# BeatBazaar - Premium Beat Marketplace

A full-stack music beat marketplace with authentication, database integration, and AI-powered content generation tools.

## Features

### Authentication System
- **Client Login/Registration**: Users can create accounts and log in
- **Admin Login**: Admin access with elevated permissions
- **Session Management**: Secure session-based authentication
- **Protected Routes**: Role-based access control

### Database Integration
- **PostgreSQL Database**: Full database integration with Drizzle ORM
- **User Management**: Store user accounts with roles (admin/client)
- **Beat Catalog**: Store beat information, pricing, and metadata
- **Purchase Tracking**: Track user purchases and analytics
- **Analytics**: Site visits and download tracking

### Admin Tools
- **Album Art Generator**: AI-powered album artwork creation
  - Genre-specific designs (Hip-Hop, Trap, R&B, Pop, Lo-fi, Drill, etc.)
  - Multiple art styles (Minimalist, Vintage, Modern, Abstract, etc.)
  - Customizable color schemes and moods
  - Download and save functionality

- **Banner Creator**: Create promotional banners for music releases
  - Multiple banner types (New Release, Album Launch, Single Drop, etc.)
  - Various layouts and text styles
  - Different sizes for social media and web use
  - Background patterns and effects

- **Beat Management**: Upload, edit, and manage beat catalog
- **Analytics Dashboard**: View site statistics and revenue

### Client Features
- **Personal Dashboard**: View purchased beats and download history
- **Beat Browsing**: Browse and preview beats by genre
- **Shopping Cart**: Add beats to cart and checkout
- **Purchase History**: Track all purchases

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BeatBazaar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a PostgreSQL database named `beatbazaar`
   - Set up your database connection string in environment variables

4. **Environment Configuration**
   Create a `.env` file with the following variables:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/beatbazaar
   SESSION_SECRET=your-secret-key-here
   NODE_ENV=development
   PORT=5000
   ```

5. **Database Migration**
   ```bash
   npm run db:push
   ```

6. **Start the application**
   ```bash
   npm run dev
   ```

### Default Admin Account
- **Username**: admin
- **Password**: admin123

## Project Structure

```
BeatBazaar/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts (Auth)
│   │   └── hooks/         # Custom hooks
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Database operations
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema
└── attached_assets/      # Generated images and assets
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Beats
- `GET /api/beats` - Get all beats
- `GET /api/beats/:id` - Get specific beat
- `POST /api/beats` - Create beat (admin only)
- `PUT /api/beats/:id` - Update beat (admin only)
- `DELETE /api/beats/:id` - Delete beat (admin only)

### Purchases
- `GET /api/purchases` - Get all purchases (admin only)
- `GET /api/purchases/my` - Get user's purchases
- `POST /api/purchases` - Create purchase

### Analytics
- `GET /api/analytics` - Get analytics (admin only)
- `POST /api/analytics/visit` - Increment site visits
- `POST /api/analytics/download` - Increment downloads

## Technologies Used

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Wouter** - Routing
- **TanStack Query** - Data fetching
- **React Hook Form** - Form handling

### Backend
- **Express.js** - Web framework
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing
- **express-session** - Session management

### Development Tools
- **Vite** - Build tool
- **TypeScript** - Type checking
- **ESLint** - Code linting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
