import { resend, IS_SANDBOX_MODE, TEST_EMAIL } from '@/lib/resend';
import { NextResponse } from 'next/server';

// In-memory store for OTPs (In production, use Redis or MongoDB)
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(req: Request) {
  try {
    const { email, name, action, otp: submittedOtp } = await req.json();

    if (action === 'send') {
      if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

      otpStore.set(email.toLowerCase(), { otp, expires });

      const recipientEmail = IS_SANDBOX_MODE ? TEST_EMAIL : email;
      const senderEmail = IS_SANDBOX_MODE ? 'ArachnidsArk <onboarding@resend.dev>' : 'ArachnidsArk <auth@arachnidsark.com>';

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #c53030; margin: 0;">Verification Code</h2>
            <p style="color: #718096; font-size: 14px;">ArachnidsArk Account Signup</p>
          </div>
          
          <p>Hello ${name || 'User'},</p>
          <p>Thank you for choosing <strong>ArachnidsArk</strong>. Use the following code to verify your email address and complete your signup:</p>
          
          <div style="background: #f7fafc; padding: 30px; text-align: center; border-radius: 10px; margin: 20px 0; border: 1px dashed #cbd5e0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #b7791f;">${otp}</span>
          </div>
          
          <p style="font-size: 12px; color: #718096; text-align: center;">
            This code will expire in 10 minutes. If you did not request this, please ignore this email.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            ArachnidsArk - Quality Exotics & Supplies<br>
            Quality is our primary goal.
          </p>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: senderEmail,
        to: [recipientEmail],
        subject: `${otp} is your verification code`,
        html: emailHtml,
      });

      if (error) {
        console.error('Resend error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'verify') {
      const stored = otpStore.get(email.toLowerCase());

      if (!stored) return NextResponse.json({ error: 'No OTP found for this email' }, { status: 400 });
      if (Date.now() > stored.expires) {
        otpStore.delete(email.toLowerCase());
        return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
      }
      if (stored.otp !== submittedOtp) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // Success - clear OTP
      otpStore.delete(email.toLowerCase());
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('OTP API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
