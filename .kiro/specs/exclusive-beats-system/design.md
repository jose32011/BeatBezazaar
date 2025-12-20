# Design Document

## Overview

The Exclusive Beats System enhances the existing music marketplace by implementing a comprehensive premium content management system. This system segregates exclusive and premium beats from regular content, enforces subscription-based access control, and provides single-purchase exclusivity with administrative oversight for bank transfer payments.

The design leverages the existing database schema and extends current functionality to support the new exclusive beats workflow while maintaining backward compatibility with the existing regular beats system.

## Architecture

The system follows a layered architecture pattern:

- **Presentation Layer**: React components for exclusive music page, beat filtering, and admin management
- **API Layer**: Express.js routes for exclusive beat operations, purchase management, and admin controls
- **Business Logic Layer**: Service functions for access control, purchase validation, and beat visibility management
- **Data Layer**: PostgreSQL database with existing schema extensions for exclusive purchases and user plans

### Key Architectural Decisions

1. **Separation of Concerns**: Exclusive beats are filtered at the API level rather than database level to maintain flexibility
2. **Immediate Hiding**: Pending exclusive purchases immediately hide beats from other users to prevent race conditions
3. **Audit Trail**: All exclusive transactions are logged for dispute resolution and system integrity
4. **Backward Compatibility**: Regular beats functionality remains unchanged

## Components and Interfaces

### Frontend Components

#### ExclusiveMusicPage
- **Purpose**: Display exclusive/premium beats for subscription users
- **Key Features**: Subscription validation, beat filtering, exclusive purchase flow
- **Dependencies**: AuthContext, CartContext, AudioPlayerContext

#### BeatVisibilityFilter
- **Purpose**: Filter beats based on user subscription level and beat exclusivity
- **Key Features**: Real-time filtering, subscription-aware display
- **Dependencies**: User plan data, beat metadata

#### ExclusivePurchaseManager (Enhanced)
- **Purpose**: Admin interface for managing pending exclusive purchases
- **Key Features**: Approval/rejection workflow, audit logging, beat restoration
- **Dependencies**: Admin authentication, purchase data

### Backend Services

#### ExclusiveBeatService
- **Purpose**: Core business logic for exclusive beat operations
- **Key Methods**:
  - `filterBeatsForUser(beats, userPlan)`: Filter beats based on user access level
  - `initiatePurchase(beatId, userId, paymentMethod)`: Start exclusive purchase process
  - `approvePurchase(purchaseId, adminId)`: Complete exclusive purchase and remove beat
  - `rejectPurchase(purchaseId, adminId, notes)`: Cancel purchase and restore beat visibility

#### AccessControlService
- **Purpose**: Manage user access permissions for exclusive content
- **Key Methods**:
  - `canAccessExclusiveContent(userPlan)`: Check if user can view exclusive page
  - `canPurchaseExclusive(userPlan, beatPlan)`: Validate purchase permissions
  - `validateSubscriptionStatus(userId)`: Verify active subscription

### API Endpoints

#### Beat Management
- `GET /api/beats` - Returns regular beats only (filtered by exclusivity)
- `GET /api/beats/exclusive` - Returns exclusive/premium beats for subscription users
- `GET /api/beats/:id/availability` - Check if specific beat is available for purchase

#### Purchase Management
- `POST /api/exclusive-purchases` - Initiate exclusive beat purchase
- `GET /api/exclusive-purchases/my` - Get user's exclusive purchase history
- `POST /api/admin/exclusive-purchases/:id/approve` - Admin approve purchase
- `POST /api/admin/exclusive-purchases/:id/reject` - Admin reject purchase

## Data Models

### Enhanced Beat Schema
The existing `beats` table already supports the required fields:
- `isExclusive`: Boolean flag for exclusive beats
- `exclusivePlan`: Required subscription level ('premium', 'exclusive')
- `isHidden`: Boolean flag for temporarily hiding beats

### Enhanced ExclusivePurchase Schema
The existing `exclusivePurchases` table supports the workflow:
- `status`: 'pending', 'approved', 'rejected', 'completed'
- `paymentMethod`: 'stripe', 'paypal', 'manual' (bank transfer)
- `adminNotes`: Admin comments for approval/rejection
- `approvedBy`: Admin user ID who processed the purchase

### User Plan Integration
The existing `users` and `userPlans` tables provide subscription data:
- `currentPlan`: User's active subscription level
- `planStatus`: Active/cancelled/expired status
- `planEndDate`: Subscription expiration date

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- Properties 1.1, 1.2, and 1.4 all relate to regular user filtering and can be combined into a comprehensive "regular user content filtering" property
- Properties 2.1 and 2.3 both relate to exclusive page filtering and can be combined
- Properties 4.1, 4.2, 4.3, and 4.4 all relate to regular user access prevention and can be consolidated
- Properties 6.1, 6.2, 6.3, and 6.4 all relate to beat labeling and can be combined into a comprehensive labeling property
- Properties 7.1, 7.2, 7.3, and 7.4 all relate to audit logging and can be consolidated

### Core Properties

**Property 1: Regular user content isolation**
*For any* regular user and any API request to beat endpoints, the response should contain only beats where `isExclusive` is false and `exclusivePlan` is null, with accurate counts and pagination based on accessible content only
**Validates: Requirements 1.1, 1.2, 1.4**

**Property 2: Subscription user exclusive access**
*For any* subscription user with premium or exclusive plan, the exclusive page API should return only beats where `isExclusive` is true or `exclusivePlan` is not null, filtered appropriately by search and genre parameters
**Validates: Requirements 2.1, 2.3**

**Property 3: Regular user access prevention**
*For any* regular user and any exclusive or premium beat, attempts to add to cart, purchase directly, or access exclusive content should be rejected with appropriate subscription requirement messaging
**Validates: Requirements 2.2, 4.1, 4.2, 4.3, 4.4**

**Property 4: Exclusive purchase removal**
*For any* exclusive beat that is successfully purchased, the beat should immediately disappear from all public listings and API responses for all users except the purchaser
**Validates: Requirements 3.1, 3.4**

**Property 5: Exclusive purchase persistence**
*For any* exclusive beat purchase, a complete purchase record should be created and the beat should remain permanently accessible in the purchaser's library
**Validates: Requirements 3.2, 3.3**

**Property 6: Pending purchase visibility control**
*For any* exclusive beat with a pending purchase status, the beat should be hidden from all users except the purchaser and should display appropriate status messages to subscription users
**Validates: Requirements 5.2, 6.3**

**Property 7: Admin approval workflow**
*For any* pending exclusive purchase, admin approval should complete the transaction and permanently remove the beat, while admin rejection should restore beat visibility and cancel the purchase
**Validates: Requirements 5.3, 5.4, 5.5**

**Property 8: Beat labeling consistency**
*For any* beat displayed in the UI, exclusive beats should show "Exclusive - Single Purchase" labeling, premium beats should show "Premium - Subscription Required" labeling, and purchase options should indicate removal warnings for exclusive beats
**Validates: Requirements 6.1, 6.2, 6.4**

**Property 9: Audit trail completeness**
*For any* exclusive beat transaction, complete audit logs should be maintained including transaction details, removal reasons, purchaser information, and should be included in reports and available for dispute resolution
**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

**Property 10: Bank transfer workflow**
*For any* bank transfer purchase of an exclusive beat by a subscription user, a pending purchase record should be created and the beat should be immediately hidden from other users
**Validates: Requirements 5.1**

**Property 11: Beat type indication**
*For any* exclusive page display, beats should be clearly marked to distinguish between single-purchase exclusive beats and premium beats that allow multiple purchases
**Validates: Requirements 2.4**

## Error Handling

### Client-Side Error Handling
- **Subscription Validation Errors**: Redirect to subscription upgrade page with clear messaging
- **Purchase Validation Errors**: Display inline error messages with subscription requirements
- **Network Errors**: Retry mechanisms with exponential backoff for critical operations
- **Audio Playback Errors**: Graceful fallback with error indicators on beat cards

### Server-Side Error Handling
- **Database Transaction Failures**: Rollback exclusive purchase operations to maintain consistency
- **Payment Processing Errors**: Maintain pending status until resolution, with admin notification
- **File System Errors**: Ensure beat files remain accessible even if metadata operations fail
- **Concurrent Purchase Attempts**: Use database locks to prevent race conditions on exclusive beats

### Error Recovery Strategies
- **Partial Purchase Failures**: Admin interface to manually complete or rollback transactions
- **Beat Visibility Inconsistencies**: Background jobs to reconcile beat visibility with purchase status
- **Audit Log Failures**: Separate audit service with retry mechanisms and dead letter queues

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing to ensure comprehensive coverage:

- **Unit tests** verify specific examples, edge cases, and error conditions
- **Property tests** verify universal properties that should hold across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing Requirements

Unit tests will cover:
- Specific user scenarios (regular user accessing exclusive content)
- Integration points between frontend and backend services
- Error conditions and edge cases (expired subscriptions, concurrent purchases)
- Admin workflow scenarios (approval/rejection of specific purchases)

### Property-Based Testing Requirements

Property-based testing will use **fast-check** for JavaScript/TypeScript to implement the correctness properties defined above. Each property-based test will:
- Run a minimum of 100 iterations to ensure statistical confidence
- Be tagged with comments explicitly referencing the correctness property from the design document
- Use the exact format: '**Feature: exclusive-beats-system, Property {number}: {property_text}**'
- Generate appropriate test data (users with different subscription levels, beats with different exclusivity settings)

Each correctness property will be implemented by a single property-based test that validates the universal behavior across all valid inputs.

<function_calls>
<invoke name="prework">
<parameter name="featureName">exclusive-beats-system