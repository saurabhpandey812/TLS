// const nodemailer = require('nodemailer');
// require('dotenv').config();

// // Create transporter for sending emails
// const createTransporter = () => {
//   return nodemailer.createTransporter({
//     service: 'gmail', // You can change this to other services like 'outlook', 'yahoo', etc.
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
//     },
//   });
// };

// // Send verification email with OTP
// const sendVerificationEmail = async (email, otp, name) => {
//   try {
//     const transporter = createTransporter();
    
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: 'Email Verification OTP - Your Account',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//           <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
//             <h2 style="color: #333; margin-bottom: 20px;">Welcome to Our Platform!</h2>
//             <p style="color: #666; font-size: 16px; margin-bottom: 20px;">Hello ${name || 'there'},</p>
//             <p style="color: #666; font-size: 16px; margin-bottom: 30px;">Thank you for registering with us. To complete your registration, please use the verification code below:</p>
            
//             <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; margin: 30px 0;">
//               <h1 style="font-size: 32px; margin: 0; letter-spacing: 5px; font-weight: bold;">${otp}</h1>
//             </div>
            
//             <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Enter this 6-digit code in the verification form to complete your registration.</p>
            
//             <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
//               <p style="color: #856404; margin: 0; font-size: 14px;">
//                 <strong>Important:</strong> This verification code will expire in 10 minutes for security reasons.
//               </p>
//             </div>
            
//             <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't create an account with us, please ignore this email.</p>
//           </div>
          
//           <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
//             <p style="color: #999; font-size: 12px;">
//               This is an automated email. Please do not reply to this message.
//             </p>
//           </div>
//         </div>
//       `,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log('Verification email sent:', info.messageId);
//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     console.error('Error sending verification email:', error);
//     return { success: false, error: error.message };
//   }
// };

// // Send password reset email (bonus feature)
// const sendPasswordResetEmail = async (email, resetToken, name) => {
//   try {
//     const transporter = createTransporter();
    
//     const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: 'Password Reset Request',
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
//           <p>Hello ${name || 'there'},</p>
//           <p>We received a request to reset your password. Click the button below to create a new password:</p>
          
//           <div style="text-align: center; margin: 30px 0;">
//             <a href="${resetUrl}" 
//                style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
//               Reset Password
//             </a>
//           </div>
          
//           <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
//           <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
//           <p>This reset link will expire in 1 hour.</p>
          
//           <p>If you didn't request a password reset, please ignore this email.</p>
          
//           <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
//           <p style="color: #666; font-size: 12px; text-align: center;">
//             This is an automated email. Please do not reply to this message.
//           </p>
//         </div>
//       `,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log('Password reset email sent:', info.messageId);
//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     console.error('Error sending password reset email:', error);
//     return { success: false, error: error.message };
//   }
// };

// module.exports = {
//   sendVerificationEmail,
//   sendPasswordResetEmail,
// }; 




const nodemailer = require('nodemailer');
require('dotenv').config();

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMPT_MAIL,
      pass: process.env.SMPT_PASSWORD,
    },
  });

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background-color: #4a90e2; padding: 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Email Verification</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 30px; text-align: center;">
                  <h2 style="color: #333333; font-size: 20px; margin: 0 0 20px;">Verify Your Email Address</h2>
                  <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">
                    Thank you for registering with us! To complete your registration, please use the One-Time Password (OTP) below:
                  </p>
                  <div style="background-color: #f0f0f0; display: inline-block; padding: 15px 25px; border-radius: 4px; margin: 20px 0;">
                    <span style="color: #4a90e2; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${options.message.match(/Your one-time verification code is: (\d+)/)?.[1] || 'N/A'}</span>
                  </div>
                  <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0 0 20px;">
                    This OTP is valid for 10 minutes. If you didn’t request this, please ignore this email.
                  </p>
                  <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">
                    Email: <strong>${options.email}</strong>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #f4f4f4; padding: 20px; text-align: center;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    &copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.
                  </p>
                  <p style="color: #999999; font-size: 12px; margin: 5px 0 0;">
                    Questions? Contact us at <a href="mailto:support@yourcompany.com" style="color: #4a90e2; text-decoration: none;">support@yourcompany.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMPT_MAIL,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;