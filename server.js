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

// Nodemailer transporter (secure for production)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});


// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    console.log('=== Contact Form Request Received ===');
    console.log('Request body:', req.body);

    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        console.log('Validation failed: Missing fields');
        return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('Validation failed: Invalid email format');
        return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('ERROR: Email credentials missing!');
        return res.status(500).json({ error: 'Email service not configured.' });
    }

    try {
        // Email to portfolio owner
        const VERIFIED_SENDER = 'divyanshu.jam100@gmail.com';

        const mailOptionsToOwner = {
            from: `"DIVYANSHU THAKUR" <${VERIFIED_SENDER}>`,
            to: VERIFIED_SENDER,
            subject: `New Portfolio Message: ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        };

        // Confirmation email to sender
        const mailOptionsToSender = {
        from: `"DIVYANSHU THAKUR" <${VERIFIED_SENDER}>`,
        to: email,
        subject: 'Thank you for reaching out!',
        html: `
            <p>Hi ${name},</p>

            <p>I've received your message and will get back to you as soon as possible.</p>

            <p><strong>Your message:</strong></p>
            <p>${message}</p>

            <br>
            <p>Best regards,</p>
            <p><strong>Divyanshu Thakur</strong></p>
        `
    };

        // Send emails but catch individual errors
        try {
            await transporter.sendMail(mailOptionsToOwner);
            console.log('✅ Email to owner sent successfully');
        } catch (errOwner) {
            console.error('❌ Failed to send email to owner:', errOwner.message);
        }

        try {
            await transporter.sendMail(mailOptionsToSender);
            console.log('✅ Confirmation email sent to sender');
        } catch (errSender) {
            console.error('❌ Failed to send confirmation email:', errSender.message);
        }

        // Always respond success to frontend
        res.status(200).json({
            success: true,
            message: 'Message received! We will get back to you soon.'
        });

    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({
            error: 'Something went wrong. Please try again later.',
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
app.get('/', (req, res) => res.send('Portfolio Backend Server is Running! ✅'));

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
