# PillowGaming

## Overview

PillowGaming is a full-stack web application built with React frontend and Express backend. It's a gaming platform that uses a virtual currency system called "P COIN" where users can earn and spend coins through various gaming activities. The application uses Replit's authentication system and is designed to run on the Replit platform.

## User Preferences

Preferred communication style: Simple, everyday language.
UI Layout: Coin icon and currency amount should be displayed on the same line for better mobile viewing.
Owner Panel: User Management section should have shiny blue styling with prominent feature visibility.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL via Neon serverless with Drizzle ORM
- **Authentication**: Replit's OIDC-based authentication system
- **Session Management**: Express sessions with PostgreSQL store

## Key Components

### Database Schema
Located in `shared/schema.ts`, the database includes:
- **sessions**: Required for Replit Auth session storage
- **users**: User profiles with P COIN balance and welcome bonus tracking
- **pCoinTransactions**: Transaction history for P COIN activities

### Authentication System
- Custom username/password authentication system
- Passport.js integration with LocalStrategy
- Session-based authentication with PostgreSQL session store
- Password hashing using scrypt for security
- Automatic user profile creation and 10 P COIN welcome bonus on registration
- Hierarchical role system: Owner > Admin > User
- Owner Panel for managing admin privileges and role assignments

### Virtual Currency System
- P COIN balance management per user
- Welcome bonus system (10 coins for new users)
- Transaction logging for all P COIN activities
- Support for various transaction types (welcome_bonus, game_win, etc.)

### UI Components
- Custom shadcn/ui components with casino-themed styling
- Metallic buttons and coin display components
- Glass morphism effects with shiny cyan/blue gradients for modern UI
- Responsive design with mobile support
- Enhanced Owner Panel with comprehensive user management interface featuring:
  * Shiny blue gradient styling with cyan accents
  * Visual feature badges showing Edit Coins, Ban/Unban, and Promote Admin capabilities
  * Advanced user cards with gradient avatars and status indicators
  * Prominent action buttons with hover effects and shadows
- Role-based access control for different user interfaces

## Data Flow

1. **Authentication Flow**:
   - User accesses app → Redirected to Replit OAuth if not authenticated
   - Successful login → User profile created/updated in database
   - Session established with PostgreSQL session store

2. **P COIN System Flow**:
   - New user → Welcome bonus automatically triggered
   - All P COIN transactions → Logged in pCoinTransactions table
   - Balance updates → Atomic operations with database constraints

3. **Frontend Data Flow**:
   - React Query manages all API calls and caching
   - Authentication state drives conditional rendering
   - Real-time balance updates through optimistic updates

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **openid-client**: OIDC authentication client
- **passport**: Authentication middleware
- **express-session**: Session management
- **@tanstack/react-query**: Server state management

### UI Dependencies
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight routing

## Deployment Strategy

### Development Mode
- Uses Vite dev server with HMR
- Express server serves API routes
- Database migrations via Drizzle Kit
- Environment variables for database and auth configuration

### Production Build
- Frontend: Vite builds static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Single server serves both API and static files
- PostgreSQL database hosted on Neon

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit application ID
- `ISSUER_URL`: OIDC issuer URL (defaults to Replit)

### File Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript definitions
├── migrations/      # Database migrations
└── dist/           # Production build output
```

The application is designed as a monorepo with clear separation between frontend, backend, and shared code, making it easy to maintain and scale while leveraging Replit's platform-specific features.