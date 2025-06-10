CREATE TABLE "designs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"design_id" integer NOT NULL,
	"size_option_id" integer NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"shipping_address" text NOT NULL,
	"notes" text,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text DEFAULT 'stripe' NOT NULL,
	"stripe_payment_intent_id" text,
	"zaprite_invoice_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"image_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "size_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"size" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"stripe_product_id" text,
	"stripe_price_id" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
