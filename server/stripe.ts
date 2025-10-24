
import Stripe from "stripe";
import { storage } from "./storage";
import type { Beat, Customer } from "@shared/schema";

let stripeInstance: Stripe | null = null;

/**
 * Retrieves or initializes the Stripe instance for payment processing.
 * 
 * This function checks if Stripe is properly configured and enabled in the application settings.
 * If configured, it returns an existing Stripe instance or creates a new one if it doesn't exist yet.
 * The instance is cached to avoid unnecessary re-initialization.
 * 
 * @returns A Promise that resolves to the Stripe instance if configured and enabled, or null if Stripe is not configured, disabled, or missing required credentials.
 */
export async function getStripeInstance(): Promise<Stripe | null> {
  const settings = await storage.getStripeSettings();
  
  if (!settings || !settings.enabled || !settings.secretKey) {
    console.log("Stripe is not configured or disabled");
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(settings.secretKey, {
      apiVersion: "2024-11-20.acacia",
    });
  }

  return stripeInstance;
}

export async function createPaymentIntent(
  amount: number,
  currency: string,
  customer: Customer,
  beat: Beat,
  metadata?: Record<string, string>
): Promise<Stripe.PaymentIntent | null> {
  const stripe = await getStripeInstance();
  if (!stripe) return null;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        customerId: customer.id,
        customerEmail: customer.email,
        beatId: beat.id,
        beatTitle: beat.title,
        ...metadata,
      },
      description: `Purchase of beat: ${beat.title}`,
      receipt_email: customer.email,
    });

    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw error;
  }
}

export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  const stripe = await getStripeInstance();
  if (!stripe) return null;

  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    throw error;
  }
}

export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  const stripe = await getStripeInstance();
  if (!stripe) return null;

  try {
    return await stripe.paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    console.error("Error canceling payment intent:", error);
    throw error;
  }
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event | null> {
  const stripe = await getStripeInstance();
  if (!stripe) return null;

  const settings = await storage.getStripeSettings();
  if (!settings || !settings.webhookSecret) {
    console.error("Stripe webhook secret is not configured");
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, settings.webhookSecret);
  } catch (error) {
    console.error("Error constructing webhook event:", error);
    throw error;
  }
}
