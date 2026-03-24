/* ═══════════════════════════════════════════════════════════
   Lumin — Email Notification Module
   Sends CEO notification when a new school joins the waitlist
   ═══════════════════════════════════════════════════════════ */

const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize the email transporter.
 * Uses Gmail SMTP by default.
 */
function initTransporter() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        console.warn('⚠️  EMAIL_USER or EMAIL_PASS not set — email notifications disabled.');
        return null;
    }

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });

    console.log('✅ Email transporter initialized');
    return transporter;
}

/**
 * Send a notification email to the CEO when a new school registers.
 * This is fire-and-forget — failures are logged but don't block the API response.
 *
 * @param {Object} schoolData - The registered school data
 */
async function sendCEONotification(schoolData) {
    const ceoEmail = process.env.CEO_EMAIL;

    if (!transporter || !ceoEmail) {
        console.warn('⚠️  Email not configured — skipping CEO notification.');
        return;
    }

    const { schoolName, studentCount, contactEmail, city, submittedAt } = schoolData;
    const date = new Date(submittedAt).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
    });

    const htmlBody = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0A1F44, #00A3FF); padding: 32px 40px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">🌟 New Waitlist Registration</h1>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px;">
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                A new school has joined the Lumin waitlist. Here are the details:
            </p>
            
            <!-- Details Card -->
            <div style="background: #F8F9FA; border-radius: 10px; padding: 24px; border: 1px solid #e2e8f0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; color: #475569; font-size: 14px; font-weight: 600; width: 140px;">School Name</td>
                        <td style="padding: 10px 0; color: #0A1F44; font-size: 14px; font-weight: 700;">${schoolName}</td>
                    </tr>
                    <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #475569; font-size: 14px; font-weight: 600;">Students</td>
                        <td style="padding: 10px 0; color: #0A1F44; font-size: 14px; font-weight: 700;">${studentCount.toLocaleString()}</td>
                    </tr>
                    <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #475569; font-size: 14px; font-weight: 600;">City</td>
                        <td style="padding: 10px 0; color: #0A1F44; font-size: 14px; font-weight: 700;">${city}</td>
                    </tr>
                    <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #475569; font-size: 14px; font-weight: 600;">Contact Email</td>
                        <td style="padding: 10px 0; color: #00A3FF; font-size: 14px; font-weight: 700;">
                            <a href="mailto:${contactEmail}" style="color: #00A3FF; text-decoration: none;">${contactEmail}</a>
                        </td>
                    </tr>
                    <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 10px 0; color: #475569; font-size: 14px; font-weight: 600;">Registered At</td>
                        <td style="padding: 10px 0; color: #0A1F44; font-size: 14px; font-weight: 700;">${date}</td>
                    </tr>
                </table>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-top: 32px;">
                <a href="${process.env.SITE_URL || 'https://lumin.com.pk'}/admin" 
                   style="display: inline-block; background: linear-gradient(135deg, #00A3FF, #0077CC); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
                    View Admin Dashboard →
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #F8F9FA; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                This is an automated notification from the Lumin Waitlist System.
            </p>
        </div>
    </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Lumin Waitlist" <${process.env.EMAIL_USER}>`,
            to: ceoEmail,
            subject: `🌟 New Waitlist: ${schoolName} (${studentCount} students, ${city})`,
            html: htmlBody
        });
        console.log(`📧 CEO notification sent for: ${schoolName}`);
    } catch (error) {
        console.error('❌ Failed to send CEO notification:', error.message);
        // Don't throw — email failure should not block the API
    }
}

module.exports = { initTransporter, sendCEONotification };
