import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable must be set");
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderEmailParams {
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

// Send notification to manufacturer
export async function sendOrderNotification(params: OrderEmailParams): Promise<boolean> {
  try {
    const manufacturerEmail = 'theee@btcglass.store';

    const { data, error } = await resend.emails.send({
      from: 'BTC Glass <orders@btcglass.store>',
      to: [manufacturerEmail],
      subject: `New BTC Glass Order #${params.orderId} - ${params.productTitle}`,
      html: `
        <div style="font-family: 'JetBrains Mono', monospace; background-color: #0A0A0A; color: #ffffff; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border: 1px solid #00FF88; border-radius: 12px; padding: 30px;">
            <h1 style="color: #00FF88; text-align: center; font-size: 28px; margin-bottom: 30px;">
              🚀 NEW ORDER RECEIVED
            </h1>

            <div style="background-color: #111111; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #00D4FF; margin-top: 0;">ORDER DETAILS</h2>
              <p><strong style="color: #00FF88;">Order ID:</strong> #BTC-GLASS-${params.orderId.toString().padStart(6, '0')}</p>
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
    });

    if (error) {
      console.error('Resend order notification error:', error);
      return false;
    }

    console.log('Order notification email sent successfully to manufacturer via Resend');
    return true;
  } catch (error) {
    console.error('Resend manufacturer email error:', error);
    return false;
  }
}

// Send confirmation to customer
export async function sendCustomerOrderConfirmation(params: OrderEmailParams): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'BTC Glass <orders@btcglass.store>',
      to: [params.customerEmail],
      subject: `Order Confirmed #${params.orderId} - ${params.productTitle} | BTC Glass`,
      html: `
        <div style="font-family: 'JetBrains Mono', monospace; background-color: #0A0A0A; color: #ffffff; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border: 1px solid #00FF88; border-radius: 12px; padding: 30px;">
            <h1 style="color: #00FF88; text-align: center; font-size: 28px; margin-bottom: 10px;">
              ORDER CONFIRMED
            </h1>
            <p style="color: #00D4FF; text-align: center; font-size: 16px; margin-bottom: 30px;">
              Thanks ${params.customerName}! Your custom glass art is now in production.
            </p>

            <div style="background-color: #111111; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #00D4FF; margin-top: 0;">YOUR ORDER</h2>
              <p><strong style="color: #00FF88;">Order Number:</strong> #BTC-GLASS-${params.orderId.toString().padStart(6, '0')}</p>
              <p><strong style="color: #00FF88;">Product:</strong> ${params.productTitle}</p>
              <p><strong style="color: #00FF88;">Total Paid:</strong> $${params.amount} USD</p>
              <p><strong style="color: #00FF88;">Status:</strong> <span style="color: #00FF88;">IN PRODUCTION</span></p>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <img src="${params.productImage}" alt="${params.productTitle}" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #00FF88;">
            </div>

            <div style="background-color: #111111; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #FF0080; margin-top: 0;">SHIPPING DETAILS</h2>
              <p><strong style="color: #00FF88;">Shipping To:</strong><br/>${params.shippingAddress.replace(/\n/g, '<br/>')}</p>
              ${params.notes ? `<p><strong style="color: #00FF88;">Your Instructions:</strong><br/>${params.notes}</p>` : ''}
            </div>

            <div style="background-color: #111111; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #00D4FF; margin-top: 0;">WHAT HAPPENS NEXT?</h2>
              <p style="margin: 10px 0;">🎨 <strong>Week 1-2:</strong> Our artisan begins crafting your custom piece</p>
              <p style="margin: 10px 0;">📦 <strong>Week 2-3:</strong> Quality check and secure packaging</p>
              <p style="margin: 10px 0;">🚚 <strong>Week 3:</strong> Shipped with tracking information</p>
            </div>

            <div style="background-color: #111111; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="color: #00FF88; font-size: 16px; margin-bottom: 15px;">
                Questions about your order?
              </p>
              <p style="color: #ffffff; margin: 5px 0;">📧 theee@btcglass.store</p>
              <p style="color: #ffffff; margin: 5px 0;">💬 Reference Order #BTC-GLASS-${params.orderId.toString().padStart(6, '0')}</p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #00FF88;">
              <p style="color: #666666; font-size: 12px;">
                BTC Glass - Crafting the future of art through cryptocurrency<br/>
                Built for the cypherpunk revolution. Code is law.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend customer confirmation error:', error);
      return false;
    }

    console.log('Customer order confirmation email sent successfully via Resend');
    return true;
  } catch (error) {
    console.error('Resend customer email error:', error);
    return false;
  }
}