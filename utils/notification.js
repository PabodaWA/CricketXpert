const nodemailer = require('nodemailer');

// Create transporter with multiple fallback options
const createTransporter = () => {
  const config = {
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };

  // Try different configurations
  const configs = [
    // Configuration 1: Standard Gmail with SSL
    {
      ...config,
      secure: true,
      port: 465
    },
    // Configuration 2: Gmail with TLS
    {
      ...config,
      secure: false,
      port: 587,
      requireTLS: true
    },
    // Configuration 3: Gmail with OAuth2-like settings
    {
      ...config,
      secure: true,
      port: 465,
      tls: {
        rejectUnauthorized: false
      }
    }
  ];

  // Try each configuration until one works
  for (let i = 0; i < configs.length; i++) {
    try {
      const transporter = nodemailer.createTransport(configs[i]);
      console.log(`✅ Email transporter created with configuration ${i + 1}`);
      return transporter;
    } catch (error) {
      console.log(`❌ Configuration ${i + 1} failed:`, error.message);
      if (i === configs.length - 1) {
        throw error;
      }
    }
  }
};

let transporter = null;

// Send email with optional attachment
exports.sendEmail = async (to, subject, text, attachmentBuffer = null, filename = '') => {
  try {
    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ Email credentials not configured!');
      console.error('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
      console.error('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
      return false;
    }

    // Create transporter if not exists
    if (!transporter) {
      transporter = createTransporter();
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    };

    if (attachmentBuffer && filename) {
      mailOptions.attachments = [
        {
          filename,
          content: attachmentBuffer
        }
      ];
    }

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.log('⚠️ Transporter verification failed, trying to recreate...');
      transporter = createTransporter();
      await transporter.verify();
      console.log('✅ Email transporter recreated and verified successfully');
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} with subject: "${subject}"`);
    return true;
  } catch (err) {
    console.error('❌ Error sending email:', err.message);
      
    return false;
  }
};
