import { storage } from "./storage";
import type { Beat, Customer } from "@shared/schema";

let paypalClient: any = null;

/**
 * Retrieves or initializes the PayPal client for payment processing.
 */
export async function getPayPalClient(): Promise<any | null> {
  const settings = await storage.getPayPalSettings();
  
  if (!settings || !settings.enabled || !settings.clientId || !settings.clientSecret) {
    console.log("PayPal is not configured or disabled");
    return null;
  }

  if (!paypalClient) {
    try {
      // Lazy import PayPal SDK only when it's configured and needed
      const { Client, Environment } = await import("@paypal/paypal-server-sdk");
      
      const environment = settings.sandbox ? Environment.Sandbox : Environment.Production;
      
      paypalClient = new Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: settings.clientId,
          oAuthClientSecret: settings.clientSecret,
        },
        environment,
      });
    } catch (e) {
      console.error("Failed to import or initialize PayPal SDK. Is the '@paypal/paypal-server-sdk' package installed?", e);
      return null;
    }
  }

  return paypalClient;
}

export async function createPayPalOrder(
  amount: number,
  currency: string,
  customer: Customer,
  beat: Beat,
  returnUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
): Promise<any | null> {
  const client = await getPayPalClient();
  if (!client) return null;

  try {
    const { OrdersController } = await import("@paypal/paypal-server-sdk");
    const ordersController = new OrdersController(client);

    const orderRequest = {
      body: {
        intent: "CAPTURE",
        purchaseUnits: [
          {
            amount: {
              currencyCode: currency.toUpperCase(),
              value: amount.toFixed(2),
            },
            description: `Purchase of beat: ${beat.title}`,
            customId: metadata?.paymentId || "",
            invoiceId: `beat-${beat.id}-${Date.now()}`,
          },
        ],
        applicationContext: {
          returnUrl,
          cancelUrl,
          userAction: "PAY_NOW",
          paymentMethod: {
            payerSelected: "PAYPAL",
            payeePreferred: "IMMEDIATE_PAYMENT_REQUIRED",
          },
        },
      },
    };

    const response = await ordersController.ordersCreate(orderRequest);
    return response.result;
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    throw error;
  }
}

export async function capturePayPalOrder(orderId: string): Promise<any | null> {
  const client = await getPayPalClient();
  if (!client) return null;

  try {
    const { OrdersController } = await import("@paypal/paypal-server-sdk");
    const ordersController = new OrdersController(client);

    const response = await ordersController.ordersCapture({
      id: orderId,
      body: {},
    });

    return response.result;
  } catch (error) {
    console.error("Error capturing PayPal order:", error);
    throw error;
  }
}

export async function getPayPalOrder(orderId: string): Promise<any | null> {
  const client = await getPayPalClient();
  if (!client) return null;

  try {
    const { OrdersController } = await import("@paypal/paypal-server-sdk");
    const ordersController = new OrdersController(client);

    const response = await ordersController.ordersGet({ id: orderId });
    return response.result;
  } catch (error) {
    console.error("Error getting PayPal order:", error);
    throw error;
  }
}