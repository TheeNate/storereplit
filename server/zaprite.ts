import axios from 'axios';
import QRCode from 'qrcode';

if (!process.env.ZAPRITE_API_KEY) {
  throw new Error("ZAPRITE_API_KEY environment variable must be set");
}

if (!process.env.ZAPRITE_WEBHOOK_SECRET) {
  throw new Error("ZAPRITE_WEBHOOK_SECRET environment variable must be set");
}

const ZAPRITE_API_BASE = 'https://api.zaprite.com/v1';

interface ZapriteInvoiceRequest {
  amount: number; // Amount in USD cents
  description: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  metadata?: Record<string, any>;
  expiresAt?: string; // ISO timestamp
}

interface ZapriteInvoice {
  id: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  amount: number;
  btcAmount: string;
  lightningInvoice: string;
  onchainAddress: string;
  qrCode: string;
  expiresAt: string;
  paymentUrl: string;
}

export class ZapriteService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ZAPRITE_API_KEY!;
  }

  async createInvoice(params: ZapriteInvoiceRequest): Promise<ZapriteInvoice> {
    try {
      // First try the actual Zaprite API
      const response = await axios.post(
        `${ZAPRITE_API_BASE}/order`,
        {
          amount: params.amount,
          currency: 'USD',
          description: params.description,
          customer_email: params.customerEmail,
          metadata: params.metadata,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const order = response.data;

      return {
        id: order.id,
        status: 'pending',
        amount: params.amount,
        btcAmount: order.btcAmount || '0.00001',
        lightningInvoice: order.lightningInvoice || '',
        onchainAddress: order.onchainAddress || '',
        qrCode: '',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        paymentUrl: order.checkoutUrl,
      };
    } catch (error: any) {
      console.error('Zaprite API Error:', error.response?.data || error.message);
      console.error('Request details:', {
        url: `${ZAPRITE_API_BASE}/order`,
        headers: { 'Authorization': `Bearer ${this.apiKey.substring(0, 10)}...` },
        data: params
      });
      throw new Error(`Failed to create Zaprite invoice: ${error.response?.data?.message || error.message}`);
    }
  }

  async getInvoice(invoiceId: string): Promise<ZapriteInvoice> {
    try {
      const response = await axios.get(
        `${ZAPRITE_API_BASE}/invoices/${invoiceId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const invoice = response.data;

      // Generate QR code if not already present
      const qrCodeDataUrl = await QRCode.toDataURL(invoice.lightningInvoice);

      return {
        id: invoice.id,
        status: invoice.status,
        amount: invoice.amount,
        btcAmount: invoice.btcAmount,
        lightningInvoice: invoice.lightningInvoice,
        onchainAddress: invoice.onchainAddress,
        qrCode: qrCodeDataUrl,
        expiresAt: invoice.expiresAt,
        paymentUrl: invoice.paymentUrl,
      };
    } catch (error: any) {
      console.error('Zaprite API Error:', error.response?.data || error.message);
      throw new Error(`Failed to get Zaprite invoice: ${error.response?.data?.message || error.message}`);
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.ZAPRITE_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

export const zapriteService = new ZapriteService();