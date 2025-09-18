const nodemailer = require('nodemailer');

// --- Main Configuration ---
// It now reads the user and password from your .env file
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify(function(error, success) {
  if (error) {
    console.log('Nodemailer transport verification error:', error);
  } else {
    console.log('Nodemailer transport is ready to send emails.');
  }
});

// --- Function 1: Welcome Email ---
const sendWelcomeEmail = async (email, username) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Send from your main email
    to: email,
    subject: 'Welcome to CricketExpert!',
    html: `<h1>Hi ${username},</h1><p>Welcome to the team! We're glad to have you on board.</p>`,
  };
  const info = await transporter.sendMail(mailOptions);
  console.log(`Welcome email sent to ${email}: ${info.response}`);
};

// --- Function 2: New User Notification for Manager ---
// This function sends an alert to the service manager
const sendNewUserNotification = async (newUser) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.SERVICE_MANAGER_EMAIL, // Sends to the manager's email
        subject: 'New User Registration',
        html: `
            <h2>A new user has registered on CricketExpert:</h2>
            <ul>
                <li><strong>Username:</strong> ${newUser.username}</li>
                <li><strong>Email:</strong> ${newUser.email}</li>
                <li><strong>First Name:</strong> ${newUser.firstName}</li>
                <li><strong>Last Name:</strong> ${newUser.lastName}</li>
                <li><strong>Registered At:</strong> ${new Date(newUser.createdAt).toLocaleString()}</li>
            </ul>
        `,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`New user notification sent to service manager: ${info.response}`);
};


// --- Function 3: Password Reset Code Email ---
const sendPasswordResetCodeEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Password Reset Code',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Use the following code to reset your password:</p>
      <h3><strong>${code}</strong></h3>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
  console.log(`Password reset code sent to ${email}`);
};

// --- Function 4: Low Stock Alert Email ---
const sendLowStockAlert = async (product) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.SERVICE_MANAGER_EMAIL, // Send to admin/manager
    subject: `🚨 LOW STOCK ALERT: ${product.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">⚠️ Low Stock Alert</h2>
        <p>Dear Admin,</p>
        <p>The following product is running low on stock:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #072679; margin-top: 0;">${product.name}</h3>
          <p><strong>Product ID:</strong> ${product.productId}</p>
          <p><strong>Category:</strong> ${product.category}</p>
          <p><strong>Brand:</strong> ${product.brand}</p>
          <p><strong>Current Stock:</strong> <span style="color: #dc3545; font-weight: bold;">${product.stock_quantity}</span></p>
          <p><strong>Price:</strong> LKR ${product.price}</p>
        </div>
        
        <p style="color: #dc3545; font-weight: bold;">⚠️ Action Required: Please restock this item immediately!</p>
        
        <p>This alert was triggered when stock fell to ${product.stock_quantity} units or below.</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #6c757d; font-size: 12px;">
          This is an automated alert from CricketExpert Inventory Management System.<br>
          Generated on: ${new Date().toLocaleString()}
        </p>
      </div>
    `,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Low stock alert email sent to admin for ${product.name}: ${info.response}`);
  } catch (error) {
    console.error('❌ Failed to send low stock alert email:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendNewUserNotification,
  sendPasswordResetCodeEmail,
  sendLowStockAlert,
};
