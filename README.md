# African Property Trust

A comprehensive full-stack land verification and property management platform built with Express.js, React, and TypeScript.

## 🌍 Overview

African Property Trust is a modern property verification system designed to streamline land ownership verification, property management, and real estate transactions across Africa. The platform provides secure, efficient tools for property verification, document management, and transaction processing.

## ✨ Features

- **Land Verification System**: Comprehensive property verification with AI-powered document analysis
- **Property Management**: Complete property listing and management capabilities
- **User Authentication**: Secure authentication with JWT and session management
- **Document Processing**: Advanced document upload, processing, and verification
- **Real-time Updates**: WebSocket integration for live updates
- **Mobile Responsive**: Fully responsive design for all devices
- **API Integration**: RESTful API with comprehensive endpoints
- **Database Management**: PostgreSQL with Drizzle ORM
- **Security**: Enterprise-grade security with rate limiting and validation

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL database
- Python 3.x (for data generation scripts)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rest-express.git
   cd rest-express
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/triplecheck
   JWT_SECRET=your-jwt-secret-key-here
   NODE_ENV=development
   PORT=3001
   ```

4. **Database Setup**
   ```bash
   npm run db:setup
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📁 Project Structure

```
├── src/                    # Frontend React application
├── server/                 # Backend Express server
├── database/              # Database schemas and migrations
├── scripts/               # Build and utility scripts
├── docs/                  # Documentation files
├── public/                # Static assets
├── tests/                 # Test files
└── config/                # Configuration files
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development servers (frontend + backend)
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Database Management

```bash
# Run migrations
npm run migrate

# Seed database
npm run seed:dev

# Reset database
npm run db:reset

# View database studio
npm run db:studio
```

### Testing

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 🚢 Deployment

### Production Build

```bash
npm run build:optimized
```

### Deploy to Vercel

```bash
npm run deploy:vercel
```

### Deploy to Render

```bash
npm run deploy:render
```

## 📚 API Documentation

The API provides comprehensive endpoints for:

- **Authentication**: `/api/auth/*`
- **Properties**: `/api/properties/*`
- **Users**: `/api/users/*`
- **Verification**: `/api/verification/*`
- **Documents**: `/api/documents/*`

For detailed API documentation, visit `/api/docs` when running the development server.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 3001 |
| `GOOGLE_MAPS_API_KEY` | Google Maps integration | Optional |

### Database Configuration

The application supports multiple database providers:
- PostgreSQL (recommended)
- Neon (serverless)
- Supabase

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs](./docs) folder
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/rest-express/issues)
- **Discussions**: Join our [GitHub Discussions](https://github.com/yourusername/rest-express/discussions)

## 🏗️ Architecture

Built with modern technologies:

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, TypeScript, Node.js
- **Database**: PostgreSQL, Drizzle ORM
- **Authentication**: JWT, Passport.js
- **Testing**: Vitest, Playwright
- **Deployment**: Vercel, Render

## 📈 Performance

- Optimized bundle sizes
- Server-side rendering ready
- Database query optimization
- Caching strategies
- CDN integration

---

Made with ❤️ for African property verification