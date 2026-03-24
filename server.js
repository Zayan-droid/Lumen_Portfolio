/* ═══════════════════════════════════════════════════════════
   Lumin — Waitlist Backend Server
   Express server with MongoDB, email notifications, and admin auth
   ═══════════════════════════════════════════════════════════ */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { connectDB, getWaitlistCollection } = require('./db');
const { initTransporter, sendCEONotification } = require('./email');

const app = express();
const PORT = process.env.PORT || 3000;

/* ── State ──────────────────────────────────────────────── */
let useDB = false; // Will be set to true if MongoDB connects

/* ── Middleware ──────────────────────────────────────────── */
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

/* ═══════════════════════════════════════════════════════════
   ROUTE HANDLERS — Clean URL support
   ═══════════════════════════════════════════════════════════ */
const pages = {
    '/': 'index.html',
    '/waitlist': 'waitlist.html',
    '/confirmation': 'confirmation.html',
    '/features': 'features.html',
    '/students': 'students.html',
    '/teachers': 'teachers.html',
    '/parents': 'parents.html',
    '/ai': 'ai.html',
    '/admin': 'admin.html',
    '/platform': 'platform.html'
};

Object.entries(pages).forEach(([route, file]) => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, file));
    });
});

/* ═══════════════════════════════════════════════════════════
   JSON FALLBACK — Used when MongoDB is not configured
   ═══════════════════════════════════════════════════════════ */
const DATA_FILE = path.join(__dirname, 'waitlist-data.json');

function readWaitlistData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify({ schools: [] }, null, 2));
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading waitlist data:', error);
        return { schools: [] };
    }
}

function writeWaitlistData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing waitlist data:', error);
        return false;
    }
}

/* ═══════════════════════════════════════════════════════════
   ADMIN AUTH
   ═══════════════════════════════════════════════════════════ */

// Simple token-based admin auth
const adminTokens = new Set();

app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'lumin2024';

    if (password === adminPassword) {
        const token = crypto.randomBytes(32).toString('hex');
        adminTokens.add(token);

        // Token expires after 24 hours
        setTimeout(() => adminTokens.delete(token), 24 * 60 * 60 * 1000);

        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// Middleware to check admin auth on sensitive routes
function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.replace('Bearer ', '');

    if (!token || !adminTokens.has(token)) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
}

/* ═══════════════════════════════════════════════════════════
   API ROUTES — WAITLIST
   ═══════════════════════════════════════════════════════════ */

// GET: Retrieve all waitlist entries (admin-protected)
app.get('/api/waitlist', requireAdmin, async (req, res) => {
    try {
        if (useDB) {
            const collection = getWaitlistCollection();
            const schools = await collection.find({}).sort({ submittedAt: -1 }).toArray();
            res.json({ success: true, count: schools.length, schools });
        } else {
            const data = readWaitlistData();
            res.json({ success: true, count: data.schools.length, schools: data.schools });
        }
    } catch (error) {
        console.error('Error fetching waitlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST: Add new school to waitlist (public)
app.post('/api/waitlist', async (req, res) => {
    const { schoolName, studentCount, contactEmail, city } = req.body;

    // Validation
    if (!schoolName || !studentCount || !contactEmail || !city) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const count = parseInt(studentCount, 10);
    if (isNaN(count) || count < 1) {
        return res.status(400).json({ success: false, message: 'Invalid student count' });
    }

    const newEntry = {
        schoolName: schoolName.trim(),
        studentCount: count,
        contactEmail: contactEmail.trim().toLowerCase(),
        city: city.trim(),
        submittedAt: new Date().toISOString(),
        status: 'pending'
    };

    try {
        if (useDB) {
            const collection = getWaitlistCollection();

            // Check for duplicate email
            const existing = await collection.findOne({
                contactEmail: newEntry.contactEmail
            });
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'This email is already registered on the waitlist'
                });
            }

            const result = await collection.insertOne(newEntry);
            newEntry._id = result.insertedId;
        } else {
            const data = readWaitlistData();
            const existingSchool = data.schools.find(
                school => school.contactEmail.toLowerCase() === newEntry.contactEmail
            );
            if (existingSchool) {
                return res.status(409).json({
                    success: false,
                    message: 'This email is already registered on the waitlist'
                });
            }
            newEntry.id = Date.now().toString();
            data.schools.push(newEntry);
            if (!writeWaitlistData(data)) {
                return res.status(500).json({ success: false, message: 'Error saving data' });
            }
        }

        // Send response immediately
        res.status(201).json({
            success: true,
            message: 'Successfully added to waitlist',
            data: newEntry
        });

        // Fire-and-forget: send CEO email notification
        sendCEONotification(newEntry).catch(err => {
            console.error('Email notification error:', err.message);
        });

    } catch (error) {
        console.error('Error adding to waitlist:', error);
        res.status(500).json({ success: false, message: 'Error saving data' });
    }
});

// GET: Retrieve single school by ID (admin-protected)
app.get('/api/waitlist/:id', requireAdmin, async (req, res) => {
    try {
        if (useDB) {
            const collection = getWaitlistCollection();
            const { ObjectId } = require('mongodb');
            let school;
            try {
                school = await collection.findOne({ _id: new ObjectId(req.params.id) });
            } catch {
                school = null;
            }
            if (school) {
                res.json({ success: true, data: school });
            } else {
                res.status(404).json({ success: false, message: 'School not found' });
            }
        } else {
            const data = readWaitlistData();
            const school = data.schools.find(s => s.id === req.params.id);
            if (school) {
                res.json({ success: true, data: school });
            } else {
                res.status(404).json({ success: false, message: 'School not found' });
            }
        }
    } catch (error) {
        console.error('Error fetching school:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE: Remove school from waitlist (admin-protected)
app.delete('/api/waitlist/:id', requireAdmin, async (req, res) => {
    try {
        if (useDB) {
            const collection = getWaitlistCollection();
            const { ObjectId } = require('mongodb');
            let result;
            try {
                result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
            } catch {
                result = { deletedCount: 0 };
            }
            if (result.deletedCount > 0) {
                res.json({ success: true, message: 'School removed from waitlist' });
            } else {
                res.status(404).json({ success: false, message: 'School not found' });
            }
        } else {
            const data = readWaitlistData();
            const initialLength = data.schools.length;
            data.schools = data.schools.filter(s => s.id !== req.params.id);
            if (data.schools.length < initialLength) {
                if (writeWaitlistData(data)) {
                    res.json({ success: true, message: 'School removed from waitlist' });
                } else {
                    res.status(500).json({ success: false, message: 'Error saving data' });
                }
            } else {
                res.status(404).json({ success: false, message: 'School not found' });
            }
        }
    } catch (error) {
        console.error('Error deleting school:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH: Update school status (admin-protected)
app.patch('/api/waitlist/:id', requireAdmin, async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'contacted', 'onboarded'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status. Must be: pending, contacted, or onboarded'
        });
    }

    try {
        if (useDB) {
            const collection = getWaitlistCollection();
            const { ObjectId } = require('mongodb');
            let result;
            try {
                result = await collection.findOneAndUpdate(
                    { _id: new ObjectId(req.params.id) },
                    { $set: { status, updatedAt: new Date().toISOString() } },
                    { returnDocument: 'after' }
                );
            } catch {
                result = null;
            }
            if (result) {
                res.json({ success: true, message: 'Status updated', data: result });
            } else {
                res.status(404).json({ success: false, message: 'School not found' });
            }
        } else {
            const data = readWaitlistData();
            const school = data.schools.find(s => s.id === req.params.id);
            if (school) {
                school.status = status;
                school.updatedAt = new Date().toISOString();
                if (writeWaitlistData(data)) {
                    res.json({ success: true, message: 'Status updated', data: school });
                } else {
                    res.status(500).json({ success: false, message: 'Error saving data' });
                }
            } else {
                res.status(404).json({ success: false, message: 'School not found' });
            }
        }
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET: Statistics (admin-protected)
app.get('/api/stats', requireAdmin, async (req, res) => {
    try {
        if (useDB) {
            const collection = getWaitlistCollection();
            const schools = await collection.find({}).toArray();
            const stats = {
                total: schools.length,
                pending: schools.filter(s => s.status === 'pending').length,
                contacted: schools.filter(s => s.status === 'contacted').length,
                onboarded: schools.filter(s => s.status === 'onboarded').length,
                totalStudents: schools.reduce((sum, s) => sum + s.studentCount, 0),
                cities: [...new Set(schools.map(s => s.city))].length
            };
            res.json({ success: true, stats });
        } else {
            const data = readWaitlistData();
            const stats = {
                total: data.schools.length,
                pending: data.schools.filter(s => s.status === 'pending').length,
                contacted: data.schools.filter(s => s.status === 'contacted').length,
                onboarded: data.schools.filter(s => s.status === 'onboarded').length,
                totalStudents: data.schools.reduce((sum, s) => sum + s.studentCount, 0),
                cities: [...new Set(data.schools.map(s => s.city))].length
            };
            res.json({ success: true, stats });
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/* ═══════════════════════════════════════════════════════════
   SERVER START
   ═══════════════════════════════════════════════════════════ */
async function startServer() {
    // Try connecting to MongoDB
    const db = await connectDB();
    useDB = !!db;

    if (!useDB) {
        console.log('📁 Using local JSON file storage (waitlist-data.json)');
        // Initialize data file if it doesn't exist
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, JSON.stringify({ schools: [] }, null, 2));
        }
    }

    // Initialize email transporter
    initTransporter();

    // Start listening
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌟 Lumin Waitlist Server                               ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║   API Endpoint: http://localhost:${PORT}/api/waitlist      ║
║   Storage: ${useDB ? 'MongoDB Atlas  ✅' : 'Local JSON    📁'}                        ║
║   Email:   ${process.env.EMAIL_USER ? 'Configured   ✅' : 'Not configured ⚠️'}                        ║
║                                                           ║
║   Ready to accept waitlist submissions!                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
