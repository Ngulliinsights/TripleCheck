# ADR 016: Layered Architecture Pattern

**Status**: Accepted  
**Date**: 2024-01-01  
**Related**: ADR 010-015

## Context

The application architecture needed clear separation of concerns and well-defined layers for maintainability and scalability.

## Decision

Implement a layered architecture with the following layers:

### 1. Client Layer
- React application
- Socket.IO client
- Web Vitals monitoring

### 2. API Gateway Layer
- Rate limiting (express-rate-limit)
- CORS configuration
- Request validation (Zod)

### 3. Authentication Layer
- Passport.js strategies
- JWT token management
- CASL authorization

### 4. Business Logic Layer
- Domain services (Properties, Users, Messages)
- Business rules
- Service orchestration

### 5. External Services Layer
- HuggingFace AI (Axios + Opossum)
- Database storage
- Email service

### 6. Infrastructure Layer
- Pino logging
- OpenTelemetry metrics
- Redis caching/sessions

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  React App   │  │  Socket.IO   │  │  Web Vitals  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Rate Limit   │  │   CORS       │  │  Validation  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Authentication Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Passport.js │  │     JWT      │  │    CASL      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Properties  │  │     Users    │  │   Messages   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ HuggingFace  │  │   Storage    │  │   Email      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Pino      │  │ OpenTelemetry│  │   Redis      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Consequences

### Positive
- Clear separation of concerns
- Each layer has single responsibility
- Easy to test individual layers
- Scalable architecture
- Industry-standard pattern

### Negative
- More files and structure
- Learning curve for new developers
- Potential over-engineering for simple features

### Neutral
- Requires discipline to maintain boundaries
- Cross-cutting concerns handled by infrastructure

## Layer Responsibilities

### Client Layer
- User interface
- Client-side state management
- Real-time updates
- Performance monitoring

### API Gateway Layer
- Request validation
- Rate limiting
- CORS handling
- Request/response transformation

### Authentication Layer
- User authentication
- Token management
- Authorization checks
- Session management

### Business Logic Layer
- Domain logic
- Business rules
- Service orchestration
- Data transformation

### External Services Layer
- Third-party API integration
- Circuit breaker protection
- Retry logic
- Response caching

### Infrastructure Layer
- Logging
- Metrics
- Caching
- Session storage

## References

- [Layered Architecture Pattern](https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/ch01.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
