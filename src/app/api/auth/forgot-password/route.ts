import { NextResponse } from 'next/server';
import { resend, TEST_EMAIL, IS_SANDBOX_MODE } from '@/lib/resend';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // In a real app, you would:
    // 1. Check if the user exists in the database
    // 2. Generate a secure token
    // 3. Store the token with an expiry date in the database
    
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'ArachnidsArk <onboarding@resend.dev>',
      to: IS_SANDBOX_MODE ? TEST_EMAIL : email,
      subject: 'Reset Your Password - ArachnidsArk',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; rounded: 12px;">
          <h2 style="color: #e11d48; text-transform: uppercase; letter-spacing: 2px;">ArachnidsArk</h2>
          <p>Hi there,</p>
          <p>We received a request to reset the password for your account. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; text-transform: uppercase; font-size: 14px;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">© 2024 ArachnidsArk. All rights reserved.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Reset link sent' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
