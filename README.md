
# BTC Glass Store Template

A full-stack e-commerce application template built with React, TypeScript, Express, and PostgreSQL. Features Bitcoin payments via Zaprite, Stripe integration, email notifications, and a modern cyberpunk-themed UI.

## Features

- 🛍️ Product catalog with custom designs
- 💳 Dual payment processing (Stripe + Bitcoin via Zaprite)
- 📧 Automated email notifications (Resend)
- 🎨 Cyberpunk-themed UI with Tailwind CSS
- 📱 Responsive design
- 🗄️ PostgreSQL database with Drizzle ORM
- 🚀 Ready for deployment on Replit

## Quick Start

1. Fork this template
2. Set up your environment variables (see Configuration section)
3. Click the Run button to start the development server
4. Visit the provided URL to see your store

## Configuration

### Required Environment Variables

Create these secrets in your Repl's Secrets tab:

```
DATABASE_URL=your_neon_database_url
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
RESEND_API_KEY=your_resend_api_key
ZAPRITE_API_KEY=your_zaprite_api_key (optional)
```

### Database Setup

1. Create a Neon database account
2. Add your DATABASE_URL to secrets
3. Run migrations: `npm run db:migrate`

### Payment Setup

#### Stripe (Credit Cards)
1. Create a Stripe account
2. Get your test keys from Stripe dashboard
3. Add keys to secrets

#### Bitcoin Payments (Optional)
1. Create a Zaprite account
2. Get your API key
3. Add ZAPRITE_API_KEY to secrets

#### Email Notifications
1. Create a Resend account
2. Get your API key
3. Add RESEND_API_KEY to secrets

## Customization

### Branding
- Update colors in `tailwind.config.ts`
- Modify site name and description in components
- Replace logo and images in `client/src/components/`

### Products
- Add/edit designs in the admin panel (`/admin`)
- Modify product schema in `shared/schema.ts`
- Update email templates in `server/resend.ts`

### Styling
- Main theme colors are defined in `tailwind.config.ts`
- Component styles use Tailwind CSS classes
- Cyberpunk theme can be easily changed

## File Structure

```
├── client/               # Frontend React app
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities and configurations
├── server/               # Backend Express API
│   ├── routes.ts         # API endpoints
│   ├── db.ts             # Database connection
│   ├── resend.ts         # Email service
│   └── zaprite.ts        # Bitcoin payment service
├── shared/               # Shared TypeScript types
└── migrations/           # Database migrations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate new migrations

## Deployment

This template is configured for easy deployment on Replit:

1. Ensure all environment variables are set
2. Use Replit's deployment feature
3. Your app will be live with HTTPS automatically

## License

MIT License - feel free to use this template for any project!

## Support

For questions about this template, refer to the original implementation or Replit's documentation.
