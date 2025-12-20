# Real Payment Methods Setup Guide

This guide explains how to configure real payment processing with Stripe and PayPal for your BeatBazaar application.

## Overview

The application now supports three payment methods:
1. **Stripe** - Credit/Debit card processing
2. **PayPal** - PayPal account payments
3. **Bank Transfer** - Manual approval process

## Stripe Setup

### 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete your business verification
3. Get your API keys from the Stripe Dashboard

### 2. Configure Stripe Settings
1. Log in to your admin panel at `/admin-settings`
2. Navigate to the "Stripe" tab
3. Enter your Stripe configuration:
   - **Publishable Key**: `pk_test_...` (for testing) or `pk_live_...` (for production)
   - **Secret Key**: `sk_test_...` (for testing) or `sk_live_...` (for production)
   - **Webhook Secret**: Get this from Stripe Dashboard > Webhooks
   - **Currency**: USD (default)
   - **Test Mode**: Enable for testing, disable for production

### 3. Setup Stripe Webhooks
1. In Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `payment_intent.succeeded`
4. Copy the webhook secret to your settings

## PayPal Setup

### 1. Create PayPal Developer Account
1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Create a developer account
3. Create a new app in the dashboard

### 2. Configure PayPal Settings
1. In your admin panel, go to "PayPal" tab
2. Enter your PayPal configuration:
   - **Client ID**: From your PayPal app
   - **Client Secret**: From your PayPal app
   - **Sandbox Mode**: Enable for testing, disable for production
   - **Webhook ID**: Optional, for webhook verification

### 3. PayPal Sandbox Testing
- Use PayPal sandbox accounts for testing
- Test buyer account: Use sandbox buyer credentials
- Test payments without real money

## Environment Variables

Add these to your `.env` file:

```env
# Stripe Configuration (Optional - can be set via admin panel)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal Configuration (Optional - can be set via admin panel)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_SANDBOX=true
```

## Testing Payments

### Stripe Test Cards
Use these test card numbers in development:

- **Successful Payment**: `4242424242424242`
- **Declined Payment**: `4000000000000002`
- **Requires Authentication**: `4000002500003155`

### PayPal Sandbox
- Use PayPal sandbox buyer accounts
- No real money is charged
- Test the complete payment flow

## Production Deployment

### 1. Switch to Live Keys
- Replace test keys with live keys
- Disable test/sandbox modes
- Update webhook endpoints

### 2. SSL Certificate
- Ensure your domain has a valid SSL certificate
- Both Stripe and PayPal require HTTPS

### 3. Webhook Security
- Verify webhook signatures
- Use the webhook secrets provided by each service

## Payment Flow

### Stripe Flow
1. Customer selects Stripe payment
2. Frontend creates payment intent via `/api/stripe/create-payment-intent-bulk`
3. Customer enters card details (handled by Stripe Elements)
4. Payment is processed securely by Stripe
5. Webhook confirms payment success
6. Purchase records are updated

### PayPal Flow
1. Customer selects PayPal payment
2. Frontend creates PayPal order via `/api/paypal/create-order`
3. Customer is redirected to PayPal
4. Customer completes payment on PayPal
5. PayPal redirects back with payment confirmation
6. Purchase records are updated

### Bank Transfer Flow
1. Customer selects bank transfer
2. Order is created with "pending" status
3. Customer receives bank transfer instructions
4. Admin manually approves payment after verification
5. Purchase records are updated to "completed"

## Security Features

- **PCI Compliance**: Stripe handles card data securely
- **Webhook Verification**: All webhooks are verified
- **HTTPS Required**: All payment processing requires SSL
- **No Card Storage**: Card details never touch your servers
- **Encrypted Communication**: All API calls are encrypted

## Admin Management

### Payment Monitoring
- View all payments in `/admin-dashboard`
- Filter by status (pending, completed, failed)
- Manual approval for bank transfers

### Refunds and Disputes
- Handle refunds through Stripe/PayPal dashboards
- Track dispute status
- Update local records accordingly

## Troubleshooting

### Common Issues

1. **Stripe not working**:
   - Check API keys are correct
   - Verify webhook endpoint is accessible
   - Check webhook secret matches

2. **PayPal not working**:
   - Verify client ID and secret
   - Check sandbox/production mode settings
   - Ensure return URLs are correct

3. **Webhooks failing**:
   - Check server logs for errors
   - Verify webhook URLs are accessible
   - Test webhook endpoints manually

### Debug Mode
- Enable test mode for both services
- Use browser developer tools to check network requests
- Check server logs for detailed error messages

## Support

- **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
- **PayPal Documentation**: [developer.paypal.com/docs](https://developer.paypal.com/docs)
- **Application Logs**: Check server logs for payment-related errors

## Important Notes

⚠️ **Never commit API keys to version control**
⚠️ **Always use HTTPS in production**
⚠️ **Test thoroughly before going live**
⚠️ **Monitor payment webhooks for failures**
⚠️ **Keep payment libraries updated**

The payment system is now ready for real transactions. Configure your payment providers and test thoroughly before accepting live payments.