# Exclusive Beat Upload Guide

## Overview
This guide explains how to upload and manage exclusive beats in BeatBazaar.

## What is an Exclusive Beat?

An **Exclusive Beat** is a premium offering where:
- The beat is sold only once
- The buyer gets complete ownership
- The beat is removed from the store after purchase and admin approval
- Typically priced higher than regular beats
- Requires admin approval before finalization

## Uploading an Exclusive Beat

### Step 1: Navigate to Upload Page
1. Login as admin
2. Go to **Admin Dashboard**
3. Click **Upload New Beat** button

### Step 2: Enter Beat Details
1. Fill in the basic information:
   - **Title**: Name of the beat
   - **Producer**: Producer/artist name
   - **BPM**: Beats per minute
   - **Genre**: Select from dropdown
   - **Price**: Set the price (exclusive beats typically $500-$5000+)

2. **Check the "Exclusive Beat" checkbox**:
   - Located below the price field
   - Shows a crown icon (👑)
   - Displays a warning about exclusive beat behavior

### Step 3: Upload Audio
- Upload your beat audio file
- Supported formats: MP3, WAV, M4A, FLAC
- Maximum size: 50MB

### Step 4: Generate or Upload Artwork
- Use the AI artwork generator, or
- Upload custom artwork

### Step 5: Review and Upload
- Review all details
- Confirm the beat is marked as exclusive
- Click **Upload Beat**

## Exclusive Beat Workflow

### 1. Beat is Listed
- Beat appears in the store with exclusive badge
- Customers can preview and add to cart
- Higher price reflects exclusive rights

### 2. Customer Purchases
- Customer completes purchase
- Beat is **immediately hidden** from all users
- Purchase status: **Pending**
- Admin receives notification

### 3. Admin Reviews
- Admin goes to **Admin Dashboard > Exclusive Purchases**
- Reviews purchase details:
  - Customer information
  - Beat details
  - Payment information
  - Purchase date

### 4. Admin Decision

#### Option A: Approve
- Click **Approve** button
- Confirm in dialog
- System actions:
  - Beat record deleted from database
  - Audio file deleted from server
  - Image file deleted from server
  - Purchase record kept for accounting
  - Customer retains download access
- Customer now has exclusive rights

#### Option B: Reject
- Click **Reject** button
- Add rejection notes (optional)
- System actions:
  - Beat becomes visible again
  - Purchase marked as rejected
  - Customer can be refunded (manual process)
  - Beat available for purchase again

## Best Practices

### Pricing Exclusive Beats
- **Basic Exclusive**: $500 - $1,000
- **Premium Exclusive**: $1,000 - $3,000
- **High-End Exclusive**: $3,000 - $10,000+

Consider:
- Beat quality and production value
- Producer reputation
- Market demand
- Included rights and services

### When to Mark as Exclusive
Mark a beat as exclusive when:
- ✅ It's a premium, high-quality production
- ✅ You're willing to remove it from the store
- ✅ The price justifies exclusive rights
- ✅ You can provide full ownership transfer

Don't mark as exclusive if:
- ❌ You want to sell it multiple times
- ❌ It's a standard beat
- ❌ You're unsure about removing it

### Admin Approval Guidelines

**Approve when**:
- ✅ Payment is confirmed and cleared
- ✅ Customer information is verified
- ✅ No disputes or issues
- ✅ All terms are agreed upon

**Reject when**:
- ❌ Payment failed or disputed
- ❌ Customer requests cancellation
- ❌ Fraudulent activity suspected
- ❌ Terms not met

## Customer Experience

### For Customers Buying Exclusive Beats:

1. **Browse and Preview**
   - See exclusive badge on beat
   - Preview the beat
   - Understand exclusive rights

2. **Purchase**
   - Add to cart
   - Complete payment
   - Beat disappears from store

3. **Wait for Approval**
   - Receive confirmation email
   - Wait for admin approval
   - Typically 24-48 hours

4. **Receive Exclusive Rights**
   - Get approval notification
   - Download beat files
   - Receive ownership documentation
   - Beat is exclusively theirs

## Technical Details

### Database Changes
When a beat is marked as exclusive:
- `beats.is_exclusive` = `true`
- `beats.is_hidden` = `false` (until purchased)

When purchased:
- `purchases.is_exclusive` = `"true"`
- `purchases.status` = `"pending"`
- `beats.is_hidden` = `true`
- Beat info stored in purchase record

When approved:
- `purchases.status` = `"approved"`
- `purchases.approved_at` = timestamp
- `purchases.approved_by` = admin ID
- Beat and files deleted
- Purchase record preserved

### File Management
- Audio files stored in `uploads/audio/`
- Image files stored in `uploads/images/`
- Files deleted only after approval
- Purchase record keeps file URLs for reference

## Troubleshooting

### Beat Not Showing as Exclusive
**Problem**: Checkbox was checked but beat shows as normal

**Solution**:
1. Check database: `SELECT is_exclusive FROM beats WHERE id = 'beat-id'`
2. Verify form data was submitted correctly
3. Check server logs for errors

### Beat Still Visible After Purchase
**Problem**: Beat should be hidden but still appears

**Solution**:
1. Check `beats.is_hidden` in database
2. Verify purchase was created successfully
3. Clear browser cache
4. Check for errors in server logs

### Files Not Deleted After Approval
**Problem**: Files remain after approval

**Solution**:
1. Check file permissions
2. Verify file paths are correct
3. Check server logs for deletion errors
4. Manually delete files if needed

### Customer Can't Download After Approval
**Problem**: Customer approved but can't access beat

**Solution**:
1. Verify purchase status is "approved"
2. Check customer has download link
3. Verify files existed before deletion
4. Check purchase record has file URLs

## FAQ

**Q: Can I change a regular beat to exclusive later?**
A: Yes, edit the beat in Admin Dashboard and check the exclusive box.

**Q: Can I change an exclusive beat to regular?**
A: Yes, but only if it hasn't been purchased yet.

**Q: What happens if I reject an exclusive purchase?**
A: The beat becomes visible again and can be purchased by others.

**Q: Can I sell the same beat as both regular and exclusive?**
A: No, a beat is either exclusive or regular, not both.

**Q: How long should I wait before approving?**
A: Wait for payment to clear (24-48 hours for bank transfers, instant for PayPal).

**Q: Can I undo an approval?**
A: No, once approved and files are deleted, it cannot be undone. Always verify before approving.

**Q: What if the customer wants a refund after approval?**
A: Handle refunds manually through your payment processor. The beat cannot be restored.

## Support

For issues or questions:
1. Check server logs
2. Review database records
3. Verify file system permissions
4. Contact development team

## Related Documentation
- [Exclusive Purchase Feature](./EXCLUSIVE_PURCHASE_FEATURE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md)
