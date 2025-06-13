# Bitcoin Payment Integration Setup

## Current Status
Your BTC Glass platform has complete Bitcoin payment infrastructure implemented:

- ✅ Payment method selector (Credit Card vs Bitcoin)
- ✅ Bitcoin payment modal with QR codes
- ✅ Lightning Network support
- ✅ Database schema for payment tracking
- ✅ Webhook handlers for payment confirmations
- ✅ Comprehensive error handling

## Issue: Zaprite API Authentication
The Zaprite API is returning 404 "Not found" errors with your current credentials.

## Required Steps to Fix

### 1. Verify Zaprite Account Setup
- Login to your Zaprite dashboard at https://app.zaprite.com
- Ensure your account is fully verified and activated
- Check that Bitcoin payment processing is enabled

### 2. Regenerate API Keys
- Go to Settings → API Keys in your Zaprite dashboard
- Delete the current API key if it exists
- Generate a new API key
- Copy the complete key (should be UUID format like yours)

### 3. Verify API Endpoint Access
Test your new API key with:
```bash
curl -H "Authorization: Bearer YOUR_NEW_API_KEY" \
     -H "Content-Type: application/json" \
     https://app.zaprite.com/api/v1/account
```

### 4. Update Environment Variables
Replace the current ZAPRITE_API_KEY with your new key.

## Alternative Solution
If Zaprite API issues persist, you can:
- Contact Zaprite support at support@zaprite.com
- Verify your account has API access enabled
- Check if there are any account restrictions

## Current User Experience
- Credit card payments: Fully functional
- Bitcoin payments: Shows "service unavailable" message
- Users are directed to use credit card when Bitcoin fails

All technical infrastructure is ready - only API credentials need verification.