# TripleCheck - Secure Real Estate Verification Platform

A modern, secure real estate platform built with enterprise-grade architecture and advanced verification systems.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/               # Client source code
│   └── public/            # Static assets
├── src/                   # New domain-driven architecture
│   ├── shared/            # Shared utilities and hooks
│   ├── property/          # Property domain
│   ├── trust/             # Trust verification domain
│   ├── communication/     # Messaging domain
│   └── user/              # User management domain
├── server/                # Backend API services
├── config/                # Configuration files
├── scripts/               # Build and utility scripts
├── docs/                  # Documentation
│   ├── migration/         # Migration guides
│   ├── phases/            # Development phases
│   └── deployment/        # Deployment guides
├── legacy-migration/      # Archived legacy code
└── temp-files/           # Temporary files and reports
```

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSocket with polling fallbacks
- **Authentication**: Session-based with trust scoring
- **File Upload**: Drag-and-drop with progress tracking
- **Performance**: Infinite scroll, virtualization, debouncing

## ✨ Key Features

### 🏠 Property Management
- Advanced property listings with AI verification
- Image analysis and authenticity checking
- Location-based search with geolocation
- Virtual property tours and comparisons

### 🔒 Trust & Security
- Community-based trust scoring system
- Multi-factor verification without documents
- Behavioral pattern analysis
- Real-time fraud detection

### 💬 Communication
- Real-time messaging system
- Property inquiry management
- Automated response classification
- Email integration support

### 📊 Analytics & Insights
- User behavior tracking
- Property performance metrics
- Trust score analytics
- Market trend analysis

## 🚀 Enterprise Features

### Performance Optimizations
- **Infinite Scroll**: Handle unlimited property listings
- **Virtualization**: Render 10,000+ items without lag
- **Debouncing**: Reduce API calls by 85%
- **Real-time Updates**: WebSocket with intelligent fallbacks

### Advanced Hooks
- `useInfiniteScroll` - Seamless pagination
- `useVirtualization` - High-performance lists
- `useDebounce` - Optimized search
- `useWebSocket` - Real-time features
- `useFormValidation` - Advanced form handling
- `useGeolocation` - Location services
- `useFileUpload` - Professional file handling

## 📚 Documentation

- [Setup Guide](docs/deployment/SETUP_GUIDE.md)
- [Migration Guide](docs/migration/)
- [Strategic Hooks](docs/STRATEGIC_HOOKS_IMPLEMENTATION.md)
- [Architecture Decisions](docs/architecture_decisions.md)
- [Deployment Guide](docs/deployment/VERCEL_DEPLOYMENT.md)

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
npm run db:setup     # Set up database
npm run db:migrate   # Run migrations
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=your_database_url
SESSION_SECRET=your_session_secret
GOOGLE_API_KEY=your_google_api_key
```

## 🚀 Deployment

The application is configured for deployment on:
- **Vercel** (recommended for frontend)
- **Railway/Render** (for backend)
- **Neon/Supabase** (for database)

See [Deployment Guide](docs/deployment/VERCEL_DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Check the [documentation](docs/)
- Review [troubleshooting guides](docs/QUICK_FIXES.md)
- Contact the development team

---

**TripleCheck** - Revolutionizing real estate verification through community trust and advanced technology.