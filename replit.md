# TripleCheck Real Estate Verification Platform

## Overview

TripleCheck is a comprehensive real estate verification platform built for the Kenyan market. The application provides AI-powered document verification, fraud detection, and property authentication services to ensure secure and transparent real estate transactions. It combines modern web technologies with Google's Generative AI to deliver intelligent property verification services.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom theming support
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **File Uploads**: express-fileupload middleware for document handling
- **AI Integration**: Google Generative AI (Gemini) for document analysis
- **Session Management**: connect-pg-simple for PostgreSQL session storage

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon Database)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: @neondatabase/serverless for serverless PostgreSQL connections

## Key Components

### Core Data Models
1. **Users**: Authentication and trust scoring system
2. **Properties**: Property listings with verification status
3. **Reviews**: User feedback and rating system
4. **Property Features**: Structured property characteristics (bedrooms, bathrooms, square footage)

### AI-Powered Services
1. **Document Verification**: Analyzes uploaded property documents for authenticity
2. **Fraud Detection**: Evaluates property data for suspicious patterns
3. **Risk Assessment**: Generates comprehensive risk scores
4. **Report Generation**: Creates detailed verification reports

### User Interface Features
1. **Property Search**: Advanced search and filtering capabilities
2. **Property Comparison**: Side-by-side property comparison tool
3. **Verification Badges**: Visual indicators of property verification status
4. **Trust Scores**: User and property trust scoring system
5. **Interactive Tutorial**: Guided tour for new users

## Data Flow

### Property Verification Process
1. Property owner uploads documents via file upload interface
2. Files are temporarily stored in server uploads directory
3. AI service processes documents using Google Generative AI
4. System generates verification results including:
   - Document authenticity assessment
   - Ownership verification status
   - Risk score calculation
   - Fraud detection analysis
5. Results are stored in property record and displayed to users

### User Interaction Flow
1. Users browse properties with real-time verification status
2. Property details include AI-generated verification badges
3. Trust scores are calculated based on verification history
4. Reviews and ratings contribute to overall property credibility

## External Dependencies

### AI Services
- **Google Generative AI**: Document analysis and fraud detection
- **Model**: Gemini 1.5 Pro for text-based analysis

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: Built-in connection management

### File Storage
- **Local Storage**: Temporary file storage for document processing
- **Upload Directory**: Server-side file management system

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first styling
- **Class Variance Authority**: Component variant management

## Deployment Strategy

### Development Environment
- **Dev Server**: tsx for TypeScript execution
- **Hot Reload**: Vite HMR for instant updates
- **Error Handling**: Runtime error overlay for development

### Production Build
- **Frontend**: Vite build with optimized bundling
- **Backend**: esbuild for Node.js bundle creation
- **Static Assets**: Served from dist/public directory
- **Process Management**: PM2 or similar for production deployment

### Environment Configuration
- **Database URL**: Required environment variable for PostgreSQL connection
- **Google API Key**: Required for AI services integration
- **Session Secret**: For secure session management

## Identified Missing Functionality (July 01, 2025)

### Critical Missing Features:
1. **Authentication System** - No login/register functionality
2. **Property Creation** - Frontend forms not connected to backend
3. **User Reviews** - Schema exists but no UI implementation
4. **Search Integration** - Search bar non-functional
5. **Navigation Pages** - About Us, Features, Pricing pages missing (404s)
6. **User Dashboard** - No user-specific data or profile management
7. **Real-time Features** - No notifications, alerts, or messaging
8. **Data Persistence** - Using in-memory storage, data lost on restart

### Service Pages Needing Enhancement:
- Basic property checks (simulation only)
- Trust points, karma, alerts (placeholder content)
- Property owner contact/inquiry system
- Comprehensive property details view

## Changelog

Changelog:
- July 01, 2025. Initial setup
- July 01, 2025. Completed property comparison feature with interactive slider
- July 01, 2025. Identified critical missing functionality areas

## User Preferences

Preferred communication style: Simple, everyday language.