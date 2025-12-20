CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'client' NOT NULL,
	"email" text,
	"password_change_required" boolean DEFAULT true NOT NULL,
	"theme" text DEFAULT 'original' NOT NULL,
	"current_plan" text DEFAULT 'basic' NOT NULL,
	"plan_status" text DEFAULT 'active' NOT NULL,
	"plan_start_date" timestamp DEFAULT now(),
	"plan_end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "beats" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"producer" text NOT NULL,
	"bpm" integer NOT NULL,
	"genre" text NOT NULL,
	"price" double precision NOT NULL,
	"image_url" text NOT NULL,
	"audio_url" text,
	"is_exclusive" boolean DEFAULT false NOT NULL,
	"exclusive_plan" text,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"beat_id" text NOT NULL,
	"beat_title" text,
	"beat_producer" text,
	"beat_audio_url" text,
	"beat_image_url" text,
	"price" double precision NOT NULL,
	"is_exclusive" text DEFAULT 'false' NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"approved_by" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"beat_id" text NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"purchase_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"amount" double precision NOT NULL,
	"payment_method" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"transaction_id" text,
	"bank_reference" text,
	"notes" text,
	"approved_by" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"site_visits" integer DEFAULT 0 NOT NULL,
	"total_downloads" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"type" text DEFAULT 'password_reset' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_branding_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"app_name" text DEFAULT 'BeatBazaar' NOT NULL,
	"app_logo" text DEFAULT '' NOT NULL,
	"hero_title" text DEFAULT 'Discover Your Sound' NOT NULL,
	"hero_subtitle" text DEFAULT 'Premium beats for every artist. Find your perfect sound and bring your music to life.' NOT NULL,
	"hero_image" text DEFAULT '' NOT NULL,
	"hero_button_text" text DEFAULT 'Start Creating' NOT NULL,
	"hero_button_link" text DEFAULT '/beats' NOT NULL,
	"hero_banner_data" text DEFAULT '',
	"login_title" text DEFAULT 'Welcome Back' NOT NULL,
	"login_subtitle" text DEFAULT 'Sign in to your account to continue' NOT NULL,
	"login_image" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"band_image_url" text DEFAULT '' NOT NULL,
	"band_name" text DEFAULT 'BeatBazaar' NOT NULL,
	"contact_email" text DEFAULT 'contact@beatbazaar.com' NOT NULL,
	"contact_phone" text DEFAULT '+1 (555) 123-4567' NOT NULL,
	"contact_address" text DEFAULT '123 Music Street' NOT NULL,
	"contact_city" text DEFAULT 'Los Angeles' NOT NULL,
	"contact_state" text DEFAULT 'CA' NOT NULL,
	"contact_zip_code" text DEFAULT '90210' NOT NULL,
	"contact_country" text DEFAULT 'USA' NOT NULL,
	"message_enabled" boolean DEFAULT true NOT NULL,
	"message_subject" text DEFAULT 'New Contact Form Submission' NOT NULL,
	"message_template" text DEFAULT 'You have received a new message from your contact form.' NOT NULL,
	"facebook_url" text DEFAULT '' NOT NULL,
	"instagram_url" text DEFAULT '' NOT NULL,
	"twitter_url" text DEFAULT '' NOT NULL,
	"youtube_url" text DEFAULT '' NOT NULL,
	"tiktok_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"smtp_host" text DEFAULT 'smtp.gmail.com' NOT NULL,
	"smtp_port" integer DEFAULT 587 NOT NULL,
	"smtp_secure" boolean DEFAULT false NOT NULL,
	"smtp_user" text DEFAULT '' NOT NULL,
	"smtp_pass" text DEFAULT '' NOT NULL,
	"from_name" text DEFAULT 'BeatBazaar' NOT NULL,
	"from_email" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paypal_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"client_id" text DEFAULT '' NOT NULL,
	"client_secret" text DEFAULT '' NOT NULL,
	"sandbox" boolean DEFAULT true NOT NULL,
	"webhook_id" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_media_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"facebook_url" text DEFAULT '' NOT NULL,
	"instagram_url" text DEFAULT '' NOT NULL,
	"twitter_url" text DEFAULT '' NOT NULL,
	"youtube_url" text DEFAULT '' NOT NULL,
	"tiktok_url" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artist_bios" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"bio" text NOT NULL,
	"role" text DEFAULT 'Artist' NOT NULL,
	"social_links" json DEFAULT '{}'::json NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"page_title" text DEFAULT 'Beat Licensing Plans' NOT NULL,
	"page_subtitle" text DEFAULT 'Choose the perfect licensing plan for your music project. From basic commercial use to exclusive ownership.' NOT NULL,
	"basic_plan" json NOT NULL,
	"premium_plan" json NOT NULL,
	"exclusive_plan" json NOT NULL,
	"additional_features_title" text DEFAULT 'Why Choose BeatBazaar?' NOT NULL,
	"additional_features" json NOT NULL,
	"faq_section" json NOT NULL,
	"trust_badges" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"is_lifetime" boolean DEFAULT false NOT NULL,
	"payment_amount" double precision,
	"payment_method" text,
	"stripe_subscription_id" text,
	"paypal_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exclusive_purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"beat_id" text NOT NULL,
	"price" double precision NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"payment_method" text,
	"payment_id" text,
	"approved_by" text,
	"approved_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"publishable_key" text DEFAULT '' NOT NULL,
	"secret_key" text DEFAULT '' NOT NULL,
	"webhook_secret" text DEFAULT '' NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"test_mode" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stripe_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"stripe_payment_intent_id" text NOT NULL,
	"stripe_customer_id" text,
	"amount" double precision NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"receipt_url" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "home_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"title" text DEFAULT 'Premium Beats for Your Next Hit' NOT NULL,
	"description" text DEFAULT 'Discover high-quality beats crafted by professional producers.' NOT NULL,
	"feature1" text DEFAULT 'Instant download after purchase' NOT NULL,
	"feature2" text DEFAULT 'High-quality WAV & MP3 files' NOT NULL,
	"feature3" text DEFAULT 'Professional mixing and mastering' NOT NULL,
	"image_url" text DEFAULT 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_beat_id_beats_id_fk" FOREIGN KEY ("beat_id") REFERENCES "public"."beats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_transactions" ADD CONSTRAINT "stripe_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;