import { resend, IS_SANDBOX_MODE, TEST_EMAIL } from '@/lib/resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, userName, bookingId, slotDate, slotTime, meetingLink, duration } = await req.json();

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
          <h2 style="color: #2d3748; margin-top: 0;">Consultation Scheduled!</h2>
          <p>Hello ${userName},</p>
          <p>Your expert consultation has been scheduled. Please find the details below:</p>
          
          <div style="margin: 25px 0; padding: 20px; background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
            <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${slotDate}</p>
            <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${slotTime}</p>
            <p style="margin: 0 0 10px 0;"><strong>Duration:</strong> ${duration} Minutes</p>
            ${meetingLink ? `
            <div style="margin-top: 20px; padding: 15px; background: #ebf8ff; border-radius: 5px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #2b6cb0; font-weight: bold;">Meeting Link</p>
              <a href="${meetingLink}" style="color: #3182ce; word-break: break-all;">${meetingLink}</a>
            </div>
            ` : ''}
          </div>

          <p style="margin-top: 20px; font-size: 14px; color: #4a5568;">
            <strong>Important:</strong> Please ensure you are ready 5 minutes before the scheduled time. If you need to reschedule, please notify us at least 24 hours in advance.
          </p>

          <p style="margin-top: 30px;">If you have any questions, feel free to reply to this email.</p>
          <p>We look forward to speaking with you!<br><strong>The ArachnidsArk Team</strong></p>
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
      subject: `Your Consultation is Scheduled: ${slotDate} at ${slotTime} - ArachnidsArk`,
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
