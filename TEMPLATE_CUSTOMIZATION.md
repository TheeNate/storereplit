
# Template Customization Guide

This guide helps you customize the BTC Glass Store template for your own use.

## Essential Changes

### 1. Branding & Site Information

**Update site name and description:**
- `client/src/components/header.tsx` - Update site title
- `client/src/components/footer.tsx` - Update company info
- `client/src/pages/landing.tsx` - Update hero section

**Update email addresses:**
- `server/resend.ts` - Change manufacturer email and from address
- `client/src/components/footer.tsx` - Update contact email

### 2. Theme Customization

**Colors (tailwind.config.ts):**
```typescript
// Change these to match your brand
colors: {
  'matrix': '#00FF88',      // Primary green
  'electric': '#00D4FF',    // Secondary blue  
  'cyber-pink': '#FF0080',  // Accent pink
  'deep-black': '#000000',  // Background
}
```

**Fonts:**
- Update font imports in `client/src/index.css`
- Modify font families in `tailwind.config.ts`

### 3. Product Categories

**Update product types:**
- `shared/schema.ts` - Modify design categories
- `server/cleanup.ts` - Update sample data
- Admin panel - Add your own products

### 4. Payment Configuration

**Stripe:**
- Update webhook endpoints if needed
- Customize payment success/failure pages

**Bitcoin (Zaprite):**
- Configure your Zaprite account
- Update invoice descriptions and metadata

### 5. Email Templates

**Customize email content in `server/resend.ts`:**
- Order confirmation emails
- Manufacturer notifications
- Styling and branding

## Optional Enhancements

### Add New Features
- User accounts and order history
- Product reviews and ratings
- Inventory management
- Shipping tracking
- Discount codes

### UI Improvements
- Product image galleries
- Better mobile navigation
- Loading states and animations
- Search and filtering

### Business Logic
- Tax calculations
- Multi-currency support
- Subscription products
- Digital downloads

## Deployment Considerations

When deploying your customized store:

1. Update all environment variables for production
2. Use production Stripe keys
3. Configure proper domain for emails
4. Set up proper error monitoring
5. Enable SSL/HTTPS (automatic on Replit)

## Getting Help

- Check the README.md for setup instructions
- Review existing code for implementation patterns
- Use Replit's community forums for questions
- Refer to documentation for integrated services (Stripe, Zaprite, Resend)
