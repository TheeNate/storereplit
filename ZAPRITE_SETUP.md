# Zaprite Bitcoin Payment Setup Guide

## Current Status
❌ Zaprite API returning "Not found" errors
❌ Bitcoin payments unavailable

## Required Steps to Fix

### 1. Verify Zaprite Account Setup
- Login to your Zaprite dashboard at https://zaprite.com
- Ensure your account is fully activated and verified
- Check that you have payment processing enabled

### 2. Generate Valid API Keys
- Go to Settings > Developer > API Keys in your Zaprite dashboard
- Create a new API key if needed
- Copy the full API key (should start with a UUID format)
- Generate a webhook secret for payment confirmations

### 3. Check API Key Format
Your current API key format: `472cb6a8-5...`
- This looks correct (UUID format)
- Verify it's the complete key without truncation

### 4. Test API Access
You can test your API key directly with:
```bash
curl -X GET "https://api.zaprite.com/v1/account" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

### 5. Alternative: Contact Zaprite Support
If API keys are correct but still failing:
- Email: support@zaprite.com
- Check if there are any account restrictions
- Verify API endpoint documentation

## Temporary Workaround
Bitcoin payments are disabled until API issues are resolved.
Credit card payments via Stripe remain fully functional.