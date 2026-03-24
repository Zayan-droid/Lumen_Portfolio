/* ═══════════════════════════════════════════════════════════
   Lumin — Waitlist Backend Server
   Simple Express server to handle waitlist submissions
   ═══════════════════════════════════════════════════════════ */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // Serve static files from current directory

// Handle routes without .html extension
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/waitlist', (req, res) => {
    res.sendFile(path.join(__dirname, 'waitlist.html'));
});

app.get('/confirmation', (req, res) => {
    res.sendFile(path.join(__dirname, 'confirmation.html'));
});

app.get('/features', (req, res) => {
    res.sendFile(path.join(__dirname, 'features.html'));
});

app.get('/students', (req, res) => {
    res.sendFile(path.join(__dirname, 'students.html'));
});

app.get('/teachers', (req, res) => {
    res.sendFile(path.join(__dirname, 'teachers.html'));
});

app.get('/parents', (req, res) => {
    res.sendFile(path.join(__dirname, 'parents.html'));
});

app.get('/ai', (req, res) => {
    res.sendFile(path.join(__dirname, 'ai.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/platform', (req, res) => {
    res.sendFile(path.join(__dirname, 'platform.html'));
});

// Data file path
const DATA_FILE = path.join(__dirname, 'waitlist-data.json');

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ schools: [] }, null, 2));
}

// Helper function to read waitlist data
function readWaitlistData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading waitlist data:', error);
        return { schools: [] };
    }
}

// Helper function to write waitlist data
function writeWaitlistData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing waitlist data:', error);
        return false;
    }
}

// API Routes

// GET: Retrieve all waitlist entries
app.get('/api/waitlist', (req, res) => {
    const data = readWaitlistData();
    res.json({
        success: true,
        count: data.schools.length,
        schools: data.schools
    });
});

// POST: Add new school to waitlist
app.post('/api/waitlist', (req, res) => {
    const { schoolName, studentCount, contactEmail, city } = req.body;

    // Validation
    if (!schoolName || !studentCount || !contactEmail || !city) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email address'
        });
    }

    // Student count validation
    const count = parseInt(studentCount, 10);
    if (isNaN(count) || count < 1) {
        return res.status(400).json({
            success: false,
            message: 'Invalid student count'
        });
    }

    // Read current data
    const data = readWaitlistData();

    // Check for duplicate email
    const existingSchool = data.schools.find(
        school => school.contactEmail.toLowerCase() === contactEmail.toLowerCase()
    );

    if (existingSchool) {
        return res.status(409).json({
            success: false,
            message: 'This email is already registered on the waitlist'
        });
    }

    // Create new entry
    const newEntry = {
        id: Date.now().toString(),
        schoolName: schoolName.trim(),
        studentCount: count,
        contactEmail: contactEmail.trim().toLowerCase(),
        city: city.trim(),
        submittedAt: new Date().toISOString(),
        status: 'pending' // pending, contacted, onboarded
    };

    // Add to data
    data.schools.push(newEntry);

    // Save to file
    if (writeWaitlistData(data)) {
        res.status(201).json({
            success: true,
            message: 'Successfully added to waitlist',
            data: newEntry
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Error saving data'
        });
    }
});

// GET: Retrieve single school by ID
app.get('/api/waitlist/:id', (req, res) => {
    const data = readWaitlistData();
    const school = data.schools.find(s => s.id === req.params.id);

    if (school) {
        res.json({
            success: true,
            data: school
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'School not found'
        });
    }
});

// DELETE: Remove school from waitlist
app.delete('/api/waitlist/:id', (req, res) => {
    const data = readWaitlistData();
    const initialLength = data.schools.length;
    
    data.schools = data.schools.filter(s => s.id !== req.params.id);

    if (data.schools.length < initialLength) {
        if (writeWaitlistData(data)) {
            res.json({
                success: true,
                message: 'School removed from waitlist'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error saving data'
            });
        }
    } else {
        res.status(404).json({
            success: false,
            message: 'School not found'
        });
    }
});

// PATCH: Update school status
app.patch('/api/waitlist/:id', (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'contacted', 'onboarded'];

    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status. Must be: pending, contacted, or onboarded'
        });
    }

    const data = readWaitlistData();
    const school = data.schools.find(s => s.id === req.params.id);

    if (school) {
        school.status = status;
        school.updatedAt = new Date().toISOString();

        if (writeWaitlistData(data)) {
            res.json({
                success: true,
                message: 'Status updated',
                data: school
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error saving data'
            });
        }
    } else {
        res.status(404).json({
            success: false,
            message: 'School not found'
        });
    }
});

// GET: Statistics
app.get('/api/stats', (req, res) => {
    const data = readWaitlistData();
    
    const stats = {
        total: data.schools.length,
        pending: data.schools.filter(s => s.status === 'pending').length,
        contacted: data.schools.filter(s => s.status === 'contacted').length,
        onboarded: data.schools.filter(s => s.status === 'onboarded').length,
        totalStudents: data.schools.reduce((sum, s) => sum + s.studentCount, 0),
        cities: [...new Set(data.schools.map(s => s.city))].length
    };

    res.json({
        success: true,
        stats
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌟 Lumin Waitlist Server                               ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║   API Endpoint: http://localhost:${PORT}/api/waitlist      ║
║                                                           ║
║   Ready to accept waitlist submissions!                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
