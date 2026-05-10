import { resend, IS_SANDBOX_MODE, TEST_EMAIL } from '@/lib/resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { order, adminEmail } = await req.json();

    if (!order) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    const { id: orderId, userName, userEmail } = order;
    
    const recipientEmail = IS_SANDBOX_MODE ? TEST_EMAIL : userEmail;
    const senderEmail = IS_SANDBOX_MODE ? 'ArachnidsArk <onboarding@resend.dev>' : 'ArachnidsArk <orders@arachnidsark.com>';
    const adminNotificationEmail = adminEmail || TEST_EMAIL;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #333;">
        <h2 style="color: #2d3748;">Payment Verified - #${orderId.split('-')[0]}</h2>
        <p>Hello ${userName},</p>
        <p>We are happy to inform you that your payment for order <strong>#${orderId.split('-')[0]}</strong> has been successfully verified!</p>
        
        <div style="margin-top: 20px; padding: 20px; background: #f0fff4; border-left: 4px solid #38a169; border-radius: 5px;">
          <p style="margin: 0; color: #2f855a; font-weight: bold;">Your order is now being prepared for shipping.</p>
        </div>

        <p style="margin-top: 20px;">We will notify you with the tracking details as soon as your package is dispatched. Thank you for choosing <strong>ArachnidsArk</strong>!</p>

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
      subject: `Payment Verified for Order #${orderId.split('-')[0]} - ArachnidsArk`,
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
