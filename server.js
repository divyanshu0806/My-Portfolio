const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS Configuration
const allowedOrigins = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'https://divyanshu0806.github.io',
    'https://my-portfolio-production-5ad8.up.railway.app', // Your Railway frontend
    'https://your-custom-domain.com' // Add your custom domain if you have one
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (your frontend)
app.use(express.static('public'));

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like SendGrid, Mailgun, etc.
    auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS  // Your email app password
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
        return res.status(400).json({ 
            error: 'All fields are required' 
        });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('Validation failed: Invalid email format');
        return res.status(400).json({ 
            error: 'Invalid email address' 
        });
    }

    // Check environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('ERROR: Email credentials not configured!');
        console.error('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
        console.error('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'NOT SET');
        return res.status(500).json({ 
            error: 'Email service not configured. Please contact the site administrator.' 
        });
    }

    console.log('Validation passed. Attempting to send email...');
    console.log('Email config:', {
        user: process.env.EMAIL_USER,
        passLength: process.env.EMAIL_PASS?.length || 0
    });

    try {
        // Email to you (portfolio owner)
        const mailOptionsToOwner = {
            from: process.env.EMAIL_USER,
            to: 'divyanshu.jam100@gmail.com', // Your email
            subject: `Portfolio Contact: ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <hr>
                <p><em>This message was sent from your portfolio contact form.</em></p>
            `
        };

        // Confirmation email to sender
        const mailOptionsToSender = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Thank you for contacting me!',
            html: `
                <h2>Thank you for reaching out!</h2>
                <p>Hi ${name},</p>
                <p>I've received your message and will get back to you as soon as possible.</p>
                <p><strong>Your message:</strong></p>
                <p>${message}</p>
                <br>
                <p>Best regards,</p>
                <p>Divyanshu Thakur</p>
            `
        };

        // Send both emails
        console.log('Sending email to owner...');
        await transporter.sendMail(mailOptionsToOwner);
        console.log('✅ Email to owner sent successfully');
        
        console.log('Sending confirmation email to sender...');
        await transporter.sendMail(mailOptionsToSender);
        console.log('✅ Confirmation email sent successfully');

        res.status(200).json({ 
            success: true, 
            message: 'Message sent successfully!' 
        });

    } catch (error) {
        console.error('❌ Email sending failed:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', error);
        
        res.status(500).json({ 
            error: 'Failed to send message. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Resume download endpoint
app.get('/api/download-resume', (req, res) => {
    const resumePath = path.join(__dirname, 'public', 'resume.pdf');
    
    // Check if resume file exists
    if (fs.existsSync(resumePath)) {
        res.download(resumePath, 'Divyanshu_Thakur_Resume.pdf', (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ 
                    error: 'Failed to download resume' 
                });
            }
        });
    } else {
        res.status(404).json({ 
            error: 'Resume not found. Please add resume.pdf to the public folder.' 
        });
    }
});

// Root endpoint - test if server is accessible
app.get('/', (req, res) => {
    res.send('Portfolio Backend Server is Running! ✅');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        endpoints: {
            contact: '/api/contact',
            resume: '/api/download-resume',
            health: '/api/health'
        }
    });
});

// 404 handler for debugging
app.use((req, res) => {
    console.log('404 Not Found:', req.method, req.url);
    res.status(404).json({
        error: 'Endpoint not found',
        requestedUrl: req.url,
        method: req.method,
        availableEndpoints: {
            contact: 'POST /api/contact',
            resume: 'GET /api/download-resume',
            health: 'GET /api/health'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Contact API: http://localhost:${PORT}/api/contact`);
    console.log(`Resume Download: http://localhost:${PORT}/api/download-resume`);
});
