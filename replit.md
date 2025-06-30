# Naeberly Platform - Full-Stack Business Networking Application

## Overview

Naeberly is a comprehensive business networking platform that connects sales representatives with decision makers for scheduled calls and meetings. The application facilitates professional networking by allowing sales reps to invite decision makers, schedule calls, and manage feedback and ratings. The platform includes sophisticated user management, credit systems, and administrative tools for different user roles.

## System Architecture

The application follows a modern full-stack architecture with the following components:

### Frontend Architecture
- **Framework**: React with Vite for development and building
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with custom design tokens for Naeberly branding
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: MongoDB with Mongoose ODM (currently using MongoDB Atlas)
- **Authentication**: JWT tokens with Express session management
- **Session Storage**: MongoDB-backed session store for persistence
- **API Design**: RESTful API with role-based access control

### Database Schema
The application uses MongoDB with the following main collections:
- **Users**: Sales reps, decision makers, enterprise admins, and super admins
- **CallLogs**: Records of scheduled and completed calls
- **Invitations**: Invitation system for onboarding decision makers
- **CompanyCredits**: Credit management system for enterprise accounts
- **Feedback**: Post-call evaluations and ratings
- **DMFlags**: Flagging system for inappropriate behavior
- **SubscriptionPlans**: Subscription and pricing tiers

## Key Components

### User Management System
- **Multi-role Support**: Sales representatives, decision makers, enterprise admins, and super admins
- **Authentication**: JWT-based authentication with secure session management
- **Role-based Access Control**: Different permissions and UI based on user roles
- **Account Verification**: LinkedIn profile verification and domain verification for enterprise users

### Call Scheduling & Management
- **Google Calendar Integration**: OAuth2 integration for calendar synchronization
- **Availability Management**: Time zone support and availability preferences
- **Call Tracking**: Status tracking (scheduled, completed, missed, cancelled)
- **Post-call Feedback**: Rating system and detailed feedback collection

### Credit System
- **Enterprise Credits**: Monthly credit allocation for companies
- **Usage Tracking**: Per-representative usage monitoring
- **Credit Limits**: Configurable limits per sales rep
- **Renewal Cycles**: Automatic monthly credit renewal

### Administrative Tools
- **Super Admin Panel**: Complete platform oversight and user management
- **Enterprise Admin Dashboard**: Company-level user and credit management
- **Flagging System**: Content moderation and user behavior monitoring
- **Analytics Dashboard**: Performance metrics and usage analytics

### Onboarding Flows
- **Multi-step Registration**: Separate flows for sales reps and decision makers
- **Progressive Information Collection**: Personal info, professional background, and preferences
- **Package Selection**: Different subscription tiers and feature sets

## Data Flow

### Authentication Flow
1. User submits login credentials
2. Server validates against MongoDB user collection
3. JWT token generated and returned to client
4. Token stored in localStorage and sent with subsequent requests
5. Middleware validates token on protected routes

### Call Scheduling Flow
1. Sales rep invites decision maker
2. Decision maker accepts invitation and sets availability
3. Sales rep books call through calendar integration
4. System sends notifications and calendar invites
5. Post-call feedback collection and rating system

### Credit Management Flow
1. Enterprise accounts receive monthly credit allocation
2. Credits consumed when calls are booked or DMs are accessed
3. Usage tracked per representative
4. Automatic renewal at period end
5. Alerts when credits run low

## External Dependencies

### Third-party Services
- **MongoDB Atlas**: Cloud database hosting
- **Google Calendar API**: Calendar integration and scheduling
- **LinkedIn API**: Profile verification (configured but not fully implemented)

### Key NPM Packages
- **Authentication**: bcrypt, jsonwebtoken, express-session
- **Database**: mongoose, connect-mongo
- **UI Components**: @radix-ui/react-*, @tanstack/react-query
- **Form Handling**: react-hook-form, @hookform/resolvers, zod
- **Development**: vite, typescript, tailwindcss

## Deployment Strategy

### Current Setup
- **Platform**: Replit with Node.js 20 runtime
- **Build Process**: Vite for frontend bundling, esbuild for server
- **Database**: MongoDB Atlas with connection string in environment variables
- **Session Storage**: MongoDB-backed sessions for persistence across deployments

### Environment Configuration
- **Development**: Hot reload with Vite dev server
- **Production**: Static file serving with Express
- **Database**: MongoDB Atlas with connection pooling
- **CORS**: Configured for Replit domains and custom domains

### Production Considerations
- JWT secret and session secret stored in environment variables
- Trust proxy enabled for secure cookies
- CORS configured for production domains
- Database connection with retry logic and error handling

## Changelog

- June 30, 2025. Completed super admin dashboard with flags and credits tabs
  - Added Flags tab for behavior reports with comprehensive filtering and moderation actions
  - Added Credits tab for access management with enterprise features and credit allocations
  - Reordered tabs to user-specified sequence: Overview, User Management, Flags, Credits, Subscriptions, Analytics, Activity Logs, Settings, System
  - Removed revenue tab as not included in final tab structure
  - Implemented fully responsive tab navigation for all screen sizes (mobile to desktop)
  - Applied consistent global light theme styling across all new interfaces
- June 30, 2025. Completed user management functionality with global theme consistency
  - Converted dark theme user management interface to global light theme
  - Implemented full user management action handlers (suspend, remove, credits, message)
  - Added functional modals for user suspension, credit management, and messaging
  - Created backend API endpoints for user suspension and management operations
  - Applied consistent styling across all platform interfaces
- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.