/* ═══════════════════════════════════════════════════════════
   Lumin — Waitlist API Server
   ═══════════════════════════════════════════════════════════ */

// Only load dotenv locally (Vercel injects env vars natively)
if (!process.env.VERCEL) {
    require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

// ─── Config ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const CEO_EMAIL = process.env.CEO_EMAIL;

// ─── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));

// ─── MongoDB Connection ─────────────────────────────────
mongoose.connect(process.env.MONGODB_URI, {
    dbName: 'lumin_waitlist'
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
    console.error('⚠️  MongoDB connection error:', err.message);
    console.error('   The server will keep running but DB operations will fail.');
    console.error('   If using Atlas, make sure your IP is whitelisted:');
    console.error('   https://www.mongodb.com/docs/atlas/security-whitelist/');
});

// ─── Mongoose Schema & Model ────────────────────────────
const schoolSchema = new mongoose.Schema({
    schoolName:   { type: String, required: true, trim: true },
    studentCount: { type: Number, required: true, min: 1 },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    city:         { type: String, required: true, trim: true },
    status:       { type: String, enum: ['pending', 'contacted', 'onboarded'], default: 'pending' },
    submittedAt:  { type: Date, default: Date.now }
});

const School = mongoose.model('School', schoolSchema);

// ─── Nodemailer Transport ───────────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify email transport on startup
transporter.verify()
    .then(() => console.log('✅ Email transport ready'))
    .catch(err => console.warn('⚠️  Email transport not ready:', err.message));

// ─── Admin Auth Middleware ──────────────────────────────
function requireAdmin(req, res, next) {
    const password = req.headers['x-admin-password'];
    if (!password || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Unauthorized — invalid admin password' });
    }
    next();
}

// ═══════════════════════════════════════════════════════════
//  PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════

// POST /api/waitlist — Submit a new school to the waitlist
app.post(['/api/waitlist', '/waitlist'], async (req, res) => {
    try {
        const { schoolName, studentCount, contactEmail, city } = req.body;

        // Validate
        if (!schoolName || !studentCount || !contactEmail || !city) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        // Save to MongoDB
        const school = new School({ schoolName, studentCount, contactEmail, city });
        await school.save();

        // Build response data (matches old JSON format)
        const responseData = {
            id: school._id,
            schoolName: school.schoolName,
            studentCount: school.studentCount,
            contactEmail: school.contactEmail,
            city: school.city,
            status: school.status,
            submittedAt: school.submittedAt
        };

        // ── Send Confirmation Email to School ───────────
        const confirmationHTML = `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0A1F44;">
                <div style="background: linear-gradient(135deg, #0088EE 0%, #0066CC 100%); padding: 40px 32px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">Welcome to the Lumin Waitlist!</h1>
                </div>
                <div style="padding: 32px; background: #F8F9FA; border: 1px solid #E8ECF1; border-top: none; border-radius: 0 0 12px 12px;">
                    <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${schoolName}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6;">Thank you for joining the Lumin waitlist! We're excited to have you on board. Here's a summary of your submission:</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #E8ECF1; margin: 20px 0;">
                        <p style="margin: 8px 0;"><strong>School:</strong> ${schoolName}</p>
                        <p style="margin: 8px 0;"><strong>Students:</strong> ${studentCount.toLocaleString()}</p>
                        <p style="margin: 8px 0;"><strong>City:</strong> ${city}</p>
                        <p style="margin: 8px 0;"><strong>Contact:</strong> ${contactEmail}</p>
                    </div>
                    <p style="font-size: 16px; line-height: 1.6;">We'll reach out as soon as we're ready to onboard your institution. Stay tuned!</p>
                    <p style="font-size: 14px; color: #64748B; margin-top: 24px;">— The Lumin Team</p>
                </div>
            </div>
        `;

        transporter.sendMail({
            from: `"Lumin" <${process.env.EMAIL_USER}>`,
            to: contactEmail,
            subject: '🎓 Welcome to the Lumin Waitlist!',
            html: confirmationHTML
        }).catch(err => console.error('⚠️  Confirmation email failed:', err.message));

        // ── Notify CEO ──────────────────────────────────
        if (CEO_EMAIL) {
            const ceoHTML = `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0A1F44;">
                    <div style="background: linear-gradient(135deg, #1E9E63 0%, #168A55 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">🚀 New Waitlist Signup!</h1>
                    </div>
                    <div style="padding: 24px; background: white; border: 1px solid #E8ECF1; border-top: none; border-radius: 0 0 12px 12px;">
                        <p style="margin: 10px 0;"><strong>School:</strong> ${schoolName}</p>
                        <p style="margin: 10px 0;"><strong>Students:</strong> ${studentCount.toLocaleString()}</p>
                        <p style="margin: 10px 0;"><strong>City:</strong> ${city}</p>
                        <p style="margin: 10px 0;"><strong>Email:</strong> ${contactEmail}</p>
                        <p style="margin: 10px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            `;

            transporter.sendMail({
                from: `"Lumin Waitlist" <${process.env.EMAIL_USER}>`,
                to: CEO_EMAIL,
                subject: `🚀 New Waitlist: ${schoolName} (${studentCount} students)`,
                html: ceoHTML
            }).catch(err => console.error('⚠️  CEO notification email failed:', err.message));
        }

        res.json({ success: true, message: 'Successfully joined the waitlist!', data: responseData });

    } catch (error) {
        console.error('Error adding to waitlist:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES (password-protected)
// ═══════════════════════════════════════════════════════════

// POST /api/admin/login — Validate admin password
app.post(['/api/admin/login', '/admin/login'], (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// GET /api/waitlist — List all schools
app.get(['/api/waitlist', '/waitlist'], requireAdmin, async (req, res) => {
    try {
        const schools = await School.find().sort({ submittedAt: -1 }).lean();
        const formatted = schools.map(s => ({
            id: s._id,
            schoolName: s.schoolName,
            studentCount: s.studentCount,
            contactEmail: s.contactEmail,
            city: s.city,
            status: s.status,
            submittedAt: s.submittedAt
        }));
        res.json({ success: true, schools: formatted });
    } catch (error) {
        console.error('Error fetching waitlist:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/stats — Dashboard statistics
app.get(['/api/stats', '/stats'], requireAdmin, async (req, res) => {
    try {
        const schools = await School.find().lean();
        const stats = {
            total: schools.length,
            pending: schools.filter(s => s.status === 'pending').length,
            contacted: schools.filter(s => s.status === 'contacted').length,
            onboarded: schools.filter(s => s.status === 'onboarded').length,
            totalStudents: schools.reduce((sum, s) => sum + s.studentCount, 0),
            cities: new Set(schools.map(s => s.city.toLowerCase())).size
        };
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// PATCH /api/waitlist/:id — Update status
app.patch(['/api/waitlist/:id', '/waitlist/:id'], requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['pending', 'contacted', 'onboarded'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const school = await School.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }
        res.json({ success: true, school });
    } catch (error) {
        console.error('Error updating school:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// DELETE /api/waitlist/:id — Remove school
app.delete(['/api/waitlist/:id', '/waitlist/:id'], requireAdmin, async (req, res) => {
    try {
        const school = await School.findByIdAndDelete(req.params.id);
        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }
        res.json({ success: true, message: 'School removed from waitlist' });
    } catch (error) {
        console.error('Error deleting school:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── Start Server (local only) ──────────────────────────
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n🌟 Lumin Waitlist Server running on http://localhost:${PORT}`);
        console.log(`   Environment: ${NODE_ENV}`);
        console.log(`   Admin dashboard: http://localhost:${PORT}/admin.html\n`);
    });
}

// ─── Export for Vercel Serverless ────────────────────────
module.exports = app;
