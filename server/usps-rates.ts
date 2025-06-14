interface USPSTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface USPSRateRequest {
  originZIPCode: string;
  destinationZIPCode: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  mailClass: string;
  processingCategory: string;
  destinationType: string;
  rateIndicator: string;
}

interface USPSRateResponse {
  totalBasePrice: number;
  rates?: Array<{
    totalBasePrice: number;
    SKU: string;
    description: string;
    mailClass: string;
    zone: string;
  }>;
}

interface ShippingOption {
  service: string;
  description: string;
  price: number;
  deliveryDays: string;
  icon: string;
}

interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export class USPSService {
  private apiKey: string;
  private clientSecret: string;
  private dropshipperZip: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.apiKey = process.env.USPS_CLIENT_ID || '';
    this.clientSecret = process.env.USPS_CLIENT_SECRET || '';
    this.dropshipperZip = process.env.DROPSHIPPER_ZIP || '';
    this.baseUrl = 'https://apis.usps.com/prices/v3';

    if (!this.apiKey || !this.clientSecret || !this.dropshipperZip) {
      throw new Error('USPS credentials are required: USPS_CLIENT_ID, USPS_CLIENT_SECRET, DROPSHIPPER_ZIP');
    }
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    console.log('Requesting new USPS access token...');

    try {
      const response = await fetch('https://apis.usps.com/oauth2/v3/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.clientSecret,
          scope: 'prices',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('USPS token request failed:', response.status, errorText);
        throw new Error(`USPS authentication failed: ${response.status}`);
      }

      const tokenData: USPSTokenResponse = await response.json();
      this.accessToken = tokenData.access_token;
      // Set expiry 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (tokenData.expires_in - 300) * 1000;

      console.log('USPS access token obtained successfully');
      return this.accessToken;
    } catch (error: any) {
      console.error('Error getting USPS access token:', error);
      throw new Error(`Failed to authenticate with USPS: ${error.message}`);
    }
  }

  private getPackageDimensions(sizeCategory: string): PackageDimensions {
    // Based on glass art size categories
    const dimensions: Record<string, PackageDimensions> = {
      small: { length: 10, width: 10, height: 4, weight: 2 }, // 6x6, 8x8 glass
      medium: { length: 14, width: 14, height: 4, weight: 3 }, // 10x10, 12x12 glass
      large: { length: 22, width: 22, height: 4, weight: 5 }, // 16x16+ glass
    };

    return dimensions[sizeCategory] || dimensions.medium;
  }

  private determineSizeCategory(sizeName: string): string {
    const size = sizeName.toLowerCase();
    if (size.includes('6') || size.includes('8')) return 'small';
    if (size.includes('16') || size.includes('18') || size.includes('20')) return 'large';
    return 'medium'; // Default for 10", 12", etc.
  }

  async getShippingRates(destinationZip: string, sizeOptionName: string): Promise<ShippingOption[]> {
    try {
      const accessToken = await this.getAccessToken();
      const sizeCategory = this.determineSizeCategory(sizeOptionName);
      const packageDims = this.getPackageDimensions(sizeCategory);

      console.log(`Getting USPS rates for ${sizeCategory} package to ${destinationZip}`);

      // Get Priority Mail rate
      const priorityRate = await this.getSingleRate(
        accessToken,
        destinationZip,
        packageDims,
        'PRIORITY_MAIL'
      );

      // Get Priority Express rate
      const expressRate = await this.getSingleRate(
        accessToken,
        destinationZip,
        packageDims,
        'PRIORITY_MAIL_EXPRESS'
      );

      const shippingOptions: ShippingOption[] = [];

      if (priorityRate) {
        shippingOptions.push({
          service: 'PRIORITY_MAIL',
          description: 'USPS Priority Mail (2-3 business days)',
          price: priorityRate,
          deliveryDays: '2-3 business days',
          icon: '🚚',
        });
      }

      if (expressRate) {
        shippingOptions.push({
          service: 'PRIORITY_MAIL_EXPRESS',
          description: 'USPS Priority Express (1-2 business days)',
          price: expressRate,
          deliveryDays: '1-2 business days',
          icon: '⚡',
        });
      }

      // If no rates returned, use fallback
      if (shippingOptions.length === 0) {
        console.warn('No USPS rates returned, using fallback rates');
        return this.getFallbackRates(destinationZip);
      }

      return shippingOptions;
    } catch (error: any) {
      console.error('Error getting USPS shipping rates:', error);
      // Return fallback rates on API failure
      return this.getFallbackRates(destinationZip);
    }
  }

  private async getSingleRate(
    accessToken: string,
    destinationZip: string,
    packageDims: PackageDimensions,
    mailClass: string
  ): Promise<number | null> {
    try {
      const requestBody: USPSRateRequest = {
        originZIPCode: this.dropshipperZip,
        destinationZIPCode: destinationZip,
        weight: packageDims.weight,
        length: packageDims.length,
        width: packageDims.width,
        height: packageDims.height,
        mailClass: mailClass,
        processingCategory: 'MACHINABLE',
        destinationType: 'STREET',
        rateIndicator: 'SP', // Single Piece
      };

      console.log(`USPS rate request for ${mailClass}:`, requestBody);

      const response = await fetch(`${this.baseUrl}/base-rates/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`USPS rate request failed for ${mailClass}:`, response.status, errorText);
        return null;
      }

      const rateData: USPSRateResponse = await response.json();
      console.log(`USPS rate response for ${mailClass}:`, rateData);

      if (rateData.totalBasePrice) {
        return rateData.totalBasePrice;
      }

      if (rateData.rates && rateData.rates.length > 0) {
        return rateData.rates[0].totalBasePrice;
      }

      return null;
    } catch (error: any) {
      console.error(`Error getting ${mailClass} rate:`, error);
      return null;
    }
  }

  private getFallbackRates(destinationZip: string): ShippingOption[] {
    console.log('Using fallback shipping rates for zip:', destinationZip);
    
    // Determine zone based on zip code (simplified)
    const zipNum = parseInt(destinationZip.substring(0, 3));
    let zone = 'regional';
    
    // California and nearby states (lower rates)
    if (zipNum >= 900 && zipNum <= 961) zone = 'nearby';
    // West coast
    else if (zipNum >= 800 && zipNum <= 899) zone = 'nearby';
    // Mountain states
    else if (zipNum >= 800 && zipNum <= 899) zone = 'regional';
    // Central states
    else if (zipNum >= 500 && zipNum <= 799) zone = 'regional';
    // Eastern states (higher rates)
    else zone = 'distant';

    const fallbackRates: Record<string, { priority: number; express: number }> = {
      nearby: { priority: 10, express: 27 },
      regional: { priority: 15, express: 35 },
      distant: { priority: 22, express: 45 },
    };

    const rates = fallbackRates[zone];

    return [
      {
        service: 'PRIORITY_MAIL',
        description: 'USPS Priority Mail (2-3 business days)',
        price: rates.priority,
        deliveryDays: '2-3 business days',
        icon: '🚚',
      },
      {
        service: 'PRIORITY_MAIL_EXPRESS',
        description: 'USPS Priority Express (1-2 business days)',
        price: rates.express,
        deliveryDays: '1-2 business days',
        icon: '⚡',
      },
    ];
  }

  async validateZipCode(zipCode: string): Promise<boolean> {
    // Basic zip code validation
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  }
}

export const uspsService = new USPSService();