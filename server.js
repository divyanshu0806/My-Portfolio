const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static('public'));

// Brevo (Sendinblue) SMTP Configuration
// Using port 2525 as Railway often blocks 587
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525, // Alternative port for Railway
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY
    },
    tls: {
        rejectUnauthorized: false // Allow self-signed certificates
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000
});

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ SMTP configuration error:', error);
    } else {
        console.log('✅ Server is ready to send emails');
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    console.log('=== Contact Form Request Received ===');
    console.log('Request body:', req.body);

    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
        console.log('Validation failed: Missing fields');
        return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('Validation failed: Invalid email format');
        return res.status(400).json({ error: 'Invalid email address' });
    }

    // Check environment variables
    if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_KEY) {
        console.error('ERROR: Brevo SMTP credentials missing!');
        console.error('BREVO_SMTP_USER:', process.env.BREVO_SMTP_USER ? 'Set' : 'NOT SET');
        console.error('BREVO_SMTP_KEY:', process.env.BREVO_SMTP_KEY ? 'Set' : 'NOT SET');
        return res.status(500).json({ error: 'Email service not configured.' });
    }

    try {
        // IMPORTANT: Use the email you verified in Brevo
        const VERIFIED_SENDER = process.env.BREVO_SMTP_USER; // Must be verified in Brevo

        // Email to you (portfolio owner)
        const mailOptionsToOwner = {
            from: `"Portfolio Contact Form" <${VERIFIED_SENDER}>`,
            to: 'divyanshu.jam100@gmail.com',
            replyTo: email, // So you can reply directly to the sender
            subject: `New Portfolio Message: ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <hr>
                <p><em>Reply to this email to respond to ${name} at ${email}</em></p>
            `
        };

        // Confirmation email to sender
        const mailOptionsToSender = {
            from: `"Divyanshu Thakur" <${VERIFIED_SENDER}>`,
            to: email,
            subject: 'Thank you for reaching out!',
            html: `
                <p>Hi ${name},</p>
                <p>Thank you for contacting me through my portfolio website!</p>
                <p>I've received your message and will get back to you as soon as possible.</p>
                <p><strong>Your message:</strong></p>
                <p>${message}</p>
                <br>
                <p>Best regards,</p>
                <p><strong>Divyanshu Thakur</strong></p>
            `
        };

        // Send emails
        let ownerEmailSent = false;
        let senderEmailSent = false;

        try {
            await transporter.sendMail(mailOptionsToOwner);
            console.log('✅ Email to owner sent successfully');
            ownerEmailSent = true;
        } catch (errOwner) {
            console.error('❌ Failed to send email to owner:', errOwner.message);
            console.error('Full error:', errOwner);
        }

        try {
            await transporter.sendMail(mailOptionsToSender);
            console.log('✅ Confirmation email sent to sender');
            senderEmailSent = true;
        } catch (errSender) {
            console.error('❌ Failed to send confirmation email:', errSender.message);
            console.error('Full error:', errSender);
        }

        // Respond based on results
        if (ownerEmailSent || senderEmailSent) {
            res.status(200).json({
                success: true,
                message: 'Message sent successfully! I will get back to you soon.'
            });
        } else {
            throw new Error('Failed to send emails');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        res.status(500).json({
            error: 'Failed to send message. Please try again or email me directly.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Resume download endpoint
app.get('/api/download-resume', (req, res) => {
    const resumePath = path.join(__dirname, 'public', 'resume.pdf');
    if (fs.existsSync(resumePath)) {
        res.download(resumePath, 'Divyanshu_Thakur_Resume.pdf', (err) => {
            if (err) console.error('Error downloading resume:', err);
        });
    } else {
        res.status(404).json({ error: 'Resume not found.' });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('Portfolio Backend Server is Running! ✅');
});

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'Server is running', 
        timestamp: new Date().toISOString(),
        smtp: {
            configured: !!(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_KEY)
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📧 SMTP User: ${process.env.BREVO_SMTP_USER || 'NOT SET'}`);
    console.log(`🔑 SMTP Key: ${process.env.BREVO_SMTP_KEY ? 'SET' : 'NOT SET'}`);
});