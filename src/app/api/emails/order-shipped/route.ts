import { resend, IS_SANDBOX_MODE, TEST_EMAIL } from '@/lib/resend';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { order, adminEmail } = await req.json();

    if (!order) {
      return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
    }

    const { id: orderId, userName, userEmail, trackingId, courierPartner } = order;
    
    const recipientEmail = IS_SANDBOX_MODE ? TEST_EMAIL : userEmail;
    const senderEmail = IS_SANDBOX_MODE ? 'ArachnidsArk <onboarding@resend.dev>' : 'ArachnidsArk <orders@arachnidsark.com>';
    const adminNotificationEmail = adminEmail || TEST_EMAIL;

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; color: #333;">
        <h2 style="color: #2b6cb0;">Order Shipped - #${orderId.split('-')[0]}</h2>
        <p>Hello ${userName},</p>
        <p>Great news! Your order <strong>#${orderId.split('-')[0]}</strong> has been dispatched and is on its way to you.</p>
        
        <div style="margin-top: 20px; padding: 25px; background: #ebf8ff; border: 2px solid #3182ce; border-radius: 12px;">
          <h3 style="margin-top: 0; color: #2b6cb0;">Tracking Information</h3>
          <p style="margin-bottom: 5px;"><strong>Courier Partner:</strong> ${courierPartner || 'N/A'}</p>
          <p style="margin-bottom: 5px;"><strong>Tracking ID / AWB:</strong> <span style="font-family: monospace; font-size: 16px; color: #2b6cb0; font-weight: bold;">${trackingId || 'N/A'}</span></p>
          <p style="font-size: 13px; color: #4a5568; margin-top: 15px;">Please allow 24-48 hours for the tracking information to update on the courier's website.</p>
        </div>

        <p style="margin-top: 25px;">Ensure someone is available at the delivery address to receive the package. For live species, please follow the unboxing instructions provided on our website to ensure their safety.</p>

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
      subject: `Your Order #${orderId.split('-')[0]} has been Shipped! - ArachnidsArk`,
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
