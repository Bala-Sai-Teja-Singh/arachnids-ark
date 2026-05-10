import { resend, IS_SANDBOX_MODE, TEST_EMAIL } from '@/lib/resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, userName, courseTitle, enrollmentId } = await req.json();

    if (!to || !courseTitle) {
      return NextResponse.json({ error: 'Missing recipient or course details' }, { status: 400 });
    }

    const recipientEmail = IS_SANDBOX_MODE ? TEST_EMAIL : to;
    const senderEmail = IS_SANDBOX_MODE ? 'ArachnidsArk <onboarding@resend.dev>' : 'ArachnidsArk <courses@arachnidsark.com>';

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #333; line-height: 1.6;">
        <div style="background: #000; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #f6ad55; margin: 0; font-size: 24px;">ArachnidsArk Learning</h1>
        </div>
        
        <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2d3748; margin-top: 0;">Course Unlocked: ${courseTitle}</h2>
          <p>Hello ${userName},</p>
          <p>Great news! Your payment has been verified, and your access to <strong>${courseTitle}</strong> is now active.</p>
          
          <div style="margin: 25px 0; padding: 20px; background: #fffaf0; border-left: 4px solid #ed8936; border-radius: 5px;">
            <p style="margin: 0; color: #7b341e; font-weight: bold;">Ready to start learning?</p>
            <p style="margin: 10px 0 0 0; font-size: 14px;">You can now access all course videos and materials from your private dashboard.</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://arachnidsark.com/dashboard/courses" style="background: #ed8936; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to My Dashboard</a>
          </div>

          <p style="margin-top: 30px;">If you have any questions or need support, feel free to reply to this email.</p>
          <p>Happy Learning!<br><strong>The ArachnidsArk Team</strong></p>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
          ArachnidsArk - Quality Exotics & Expert Knowledge<br>
          Enrollment ID: ${enrollmentId}
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [recipientEmail],
      subject: `Course Unlocked: ${courseTitle} - ArachnidsArk`,
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
