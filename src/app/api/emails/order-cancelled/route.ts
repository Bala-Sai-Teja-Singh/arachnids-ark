import { resend, IS_SANDBOX_MODE, TEST_EMAIL } from '@/lib/resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { order, adminEmail } = await req.json();

    if (!order) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    const { id: orderId, userName, userEmail, cancellationReason } = order;
    
    const recipientEmail = IS_SANDBOX_MODE ? TEST_EMAIL : userEmail;
    const senderEmail = IS_SANDBOX_MODE ? 'ArachnidsArk <onboarding@resend.dev>' : 'ArachnidsArk <orders@arachnidsark.com>';
    const adminNotificationEmail = adminEmail || TEST_EMAIL;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #333;">
        <h2 style="color: #e53e3e;">Order Cancelled - #${orderId.split('-')[0]}</h2>
        <p>Hello ${userName},</p>
        <p>We regret to inform you that your order <strong>#${orderId.split('-')[0]}</strong> has been cancelled by our team.</p>
        
        <div style="margin-top: 20px; padding: 20px; background: #fff5f5; border-left: 4px solid #e53e3e; border-radius: 5px;">
          <p style="margin: 0 0 10px 0; color: #c53030; font-weight: bold;">Cancellation Reason:</p>
          <p style="margin: 0; color: #c53030;">${cancellationReason || 'No reason provided.'}</p>
        </div>

        <p style="margin-top: 20px;">If you have already made a payment, our team will process your refund shortly. We apologize for any inconvenience caused.</p>

        <p style="margin-top: 20px;">We apologize for any inconvenience this may have caused. If you have any questions, please reply to this email.</p>

        <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
          ArachnidsArk - Quality Exotics & Supplies<br>
          This is an automated message. Please reply to this email for any queries.
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [recipientEmail],
      bcc: [adminNotificationEmail],
      replyTo: adminNotificationEmail,
      subject: `Order Update #${orderId.split('-')[0]} - ArachnidsArk`,
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
