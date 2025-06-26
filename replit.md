# BTC Glass Store - E-commerce Platform

## Overview

BTC Glass Store is a full-stack e-commerce application specializing in custom glass art with Bitcoin-themed designs. The platform features a modern cyberpunk aesthetic and supports both traditional credit card payments via Stripe and Bitcoin payments through Zaprite integration. Built as a template, it can be easily customized for different product categories and branding.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom cyberpunk theme
- **State Management**: TanStack Query for server state, local storage for cart
- **UI Components**: Radix UI with shadcn/ui design system
- **Payment Processing**: Stripe Elements for credit cards, custom Bitcoin integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **File Uploads**: Multer for image and video handling
- **Email**: Resend for transactional emails

### Development Environment
- **Build Tool**: Vite for fast development and optimized builds
- **Bundler**: esbuild for server-side bundling
- **Package Manager**: npm
- **Deployment**: Replit with autoscale deployment target

## Key Components

### Product Management System
- **Designs**: Core artwork/graphics that can be applied to different products
- **Size Options**: Configurable product variants (6", 12", 15") with individual pricing
- **Orders**: Customer purchase records linking designs, sizes, and customer information
- **Admin Panel**: Complete CRUD interface for managing products, FAQs, and landing videos

### Payment Processing
- **Dual Payment System**: Supports both Stripe (credit cards) and Zaprite (Bitcoin)
- **Payment Method Selection**: User-friendly interface for choosing payment type
- **Bitcoin Integration**: QR codes, Lightning Network support, webhook confirmations
- **Stripe Integration**: Full payment flow with customer details and order tracking

### Shopping Cart
- **Local Storage Persistence**: Cart data survives browser sessions
- **Multi-item Support**: Customers can add multiple designs and sizes
- **Real-time Updates**: Dynamic pricing and shipping calculations
- **Checkout Flow**: Integrated with both payment systems

### Email System
- **Order Confirmations**: Automated customer receipts with order details
- **Manufacturer Notifications**: Internal alerts for new orders
- **Template System**: Cyberpunk-themed HTML email templates

## Data Flow

### Order Processing Flow
1. Customer selects design and size option
2. Items added to cart with local storage persistence
3. Checkout form collects customer information
4. Payment method selection (Stripe or Bitcoin)
5. Payment processing through respective gateway
6. Order creation in database
7. Email notifications sent to customer and manufacturer
8. Success page with order confirmation

### Admin Management Flow
1. Authentication via password protection
2. CRUD operations for designs, size options, and FAQs
3. File uploads for images and videos
4. Real-time preview of changes
5. Bulk operations for managing product catalog

### USPS Shipping Integration
- Real-time rate calculation based on destination ZIP code
- Multiple service options (Priority Mail, Express)
- Package dimension-based pricing
- Shipping cost integration with checkout flow

## External Dependencies

### Payment Services
- **Stripe**: Credit card processing, webhooks, payment intents
- **Zaprite**: Bitcoin and Lightning Network payments (currently experiencing API issues)

### Email Service
- **Resend**: Transactional email delivery with custom templates

### Database Hosting
- **Neon**: Serverless PostgreSQL with connection pooling

### File Storage
- **Local Storage**: Images and videos stored in uploads directory
- **Future Enhancement**: Could be migrated to cloud storage (S3, Cloudinary)

### Shipping
- **USPS Web Tools API**: Real-time shipping rate calculations

## Deployment Strategy

### Development
- **Local Development**: `npm run dev` starts both client and server
- **Hot Reload**: Vite provides fast refresh for frontend changes
- **Database Migrations**: Drizzle Kit handles schema changes

### Production
- **Build Process**: Vite builds client, esbuild bundles server
- **Static Assets**: Client built to `dist/public` directory
- **Server Bundle**: Single file output with external packages
- **Environment Variables**: Managed through Replit Secrets

### Required Environment Variables
```
DATABASE_URL=neon_postgresql_connection_string
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_key  
RESEND_API_KEY=resend_api_key
ZAPRITE_API_KEY=zaprite_api_key (optional, currently non-functional)
```

## Changelog

- June 26, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.