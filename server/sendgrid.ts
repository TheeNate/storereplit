import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface OrderEmailParams {
  to: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  productTitle: string;
  productDescription: string;
  productImage: string;
  amount: string;
  notes?: string;
  orderId: number;
}

export async function sendOrderNotification(params: OrderEmailParams): Promise<boolean> {
  try {
    const msg = {
      to: params.to,
      from: process.env.FROM_EMAIL || 'orders@btcglass.art',
      subject: `New BTC Glass Order #${params.orderId} - ${params.productTitle}`,
      html: `
        <div style="font-family: 'JetBrains Mono', monospace; background-color: #0A0A0A; color: #ffffff; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border: 1px solid #00FF88; border-radius: 12px; padding: 30px;">
            <h1 style="color: #00FF88; text-align: center; font-size: 28px; margin-bottom: 30px;">
              🚀 NEW ORDER RECEIVED
            </h1>
            
            <div style="background-color: #111111; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #00D4FF; margin-top: 0;">ORDER DETAILS</h2>
              <p><strong style="color: #00FF88;">Order ID:</strong> #BTC-GLASS-${params.orderId}</p>
              <p><strong style="color: #00FF88;">Product:</strong> ${params.productTitle}</p>
              <p><strong style="color: #00FF88;">Amount:</strong> $${params.amount}</p>
              <p><strong style="color: #00FF88;">Description:</strong> ${params.productDescription}</p>
            </div>

            <div style="background-color: #111111; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #FF0080; margin-top: 0;">CUSTOMER INFORMATION</h2>
              <p><strong style="color: #00FF88;">Name:</strong> ${params.customerName}</p>
              <p><strong style="color: #00FF88;">Email:</strong> ${params.customerEmail}</p>
              <p><strong style="color: #00FF88;">Shipping Address:</strong><br/>${params.shippingAddress.replace(/\n/g, '<br/>')}</p>
              ${params.notes ? `<p><strong style="color: #00FF88;">Special Instructions:</strong><br/>${params.notes}</p>` : ''}
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <img src="${params.productImage}" alt="${params.productTitle}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #00FF88;">
            </div>

            <div style="background-color: #111111; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="color: #00D4FF; font-size: 16px; margin: 0;">
                🔥 START CRAFTING THIS PIECE IMMEDIATELY 🔥
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log('Order notification email sent successfully');
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}
