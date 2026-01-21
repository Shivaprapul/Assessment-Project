/**
 * Email Service
 * 
 * Handles email sending for OTP and notifications.
 * Supports SendGrid and Twilio.
 * 
 * @module lib/email
 */

/**
 * Sends OTP email to user
 * 
 * @param email - Recipient email address
 * @param otp - 6-digit OTP code
 */
export async function sendOTP(email: string, otp: string): Promise<void> {
  // TODO: Implement actual email sending
  // For now, log to console (development only)
  console.log(`[EMAIL] Sending OTP to ${email}: ${otp}`);
  
  // In production, use SendGrid or Twilio
  if (process.env.SENDGRID_API_KEY) {
    // SendGrid implementation
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: email,
    //   from: process.env.FROM_EMAIL,
    //   subject: 'Your Login Code',
    //   html: `<p>Your OTP is: <strong>${otp}</strong></p><p>Valid for 5 minutes.</p>`,
    // });
  } else if (process.env.TWILIO_ACCOUNT_SID) {
    // Twilio SMS implementation (if using SMS instead of email)
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //   body: `Your login code is: ${otp}`,
    //   to: email, // or phone number
    //   from: process.env.TWILIO_PHONE_NUMBER,
    // });
  }
}

/**
 * Sends notification email
 * 
 * @param email - Recipient email address
 * @param subject - Email subject
 * @param html - Email HTML content
 */
export async function sendEmail(
  email: string,
  subject: string,
  html: string
): Promise<void> {
  console.log(`[EMAIL] Sending email to ${email}: ${subject}`);
  // TODO: Implement actual email sending
}

