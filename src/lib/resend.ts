import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  // We'll use a placeholder if the key is not set, 
  // but in production this should be a required env var.
  console.warn('RESEND_API_KEY is not set. Emails will not be sent.');
}

export const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_123456789');

// --- SANDBOX CONFIGURATION ---
// Set IS_SANDBOX_MODE to false once you have verified your domain on Resend.com
export const IS_SANDBOX_MODE = true;
export const TEST_EMAIL = 'isopodsofindia@gmail.com';
