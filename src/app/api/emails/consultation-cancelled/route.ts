import { resend, IS_SANDBOX_MODE, TEST_EMAIL } from '@/lib/resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, userName, bookingId, slotDate, slotTime, reason } = await req.json();

    if (!to || !slotDate || !slotTime) {
      return NextResponse.json({ error: 'Missing recipient or schedule details' }, { status: 400 });
    }

    const recipientEmail = IS_SANDBOX_MODE ? TEST_EMAIL : to;
    const senderEmail = IS_SANDBOX_MODE ? 'ArachnidsArk <onboarding@resend.dev>' : 'ArachnidsArk <consultations@arachnidsark.com>';

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #333; line-height: 1.6;">
        <div style="background: #000; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #f6ad55; margin: 0; font-size: 24px;">ArachnidsArk Consultation</h1>
        </div>
        
        <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #e53e3e; margin-top: 0;">Call Cancelled</h2>
          <p>Hello ${userName},</p>
          <p>We are writing to inform you that your scheduled consultation has been cancelled.</p>
          
          <div style="margin: 25px 0; padding: 20px; background: #fff5f5; border: 1px solid #feb2b2; border-radius: 10px;">
            <p style="margin: 0 0 10px 0;"><strong>Original Date:</strong> ${slotDate}</p>
            <p style="margin: 0 0 10px 0;"><strong>Original Time:</strong> ${slotTime}</p>
            ${reason ? `<p style="margin: 20px 0 0 0; color: #c53030;"><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>

          <p style="margin-top: 20px;">
            If this was unexpected, please contact us immediately to reschedule. Your session balance has been updated accordingly.
          </p>

          <p style="margin-top: 30px;">If you have any questions, feel free to reply to this email.</p>
          <p>Best regards,<br><strong>The ArachnidsArk Team</strong></p>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
          ArachnidsArk - Quality Exotics & Expert Knowledge<br>
          Booking ID: ${bookingId}
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [recipientEmail],
      subject: `CONSULTATION CANCELLED: ${slotDate} at ${slotTime} - ArachnidsArk`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('Email API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
