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
                    This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.
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
    from: process.env.EMAIL_USER,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;