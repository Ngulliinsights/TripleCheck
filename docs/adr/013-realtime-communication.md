# ADR 013: Real-time Communication - Socket.IO

**Status**: Accepted  
**Date**: 2024-01-01  
**Supersedes**: Custom websocket.service implementation

## Context

The custom `websocket.service.ts` (400+ lines) implemented:
- Manual WebSocket connection management
- Custom heartbeat mechanism
- Basic room management
- Manual reconnection logic

This resulted in reliability issues and scaling limitations.

## Decision

Replace with Socket.IO ecosystem:

### Core: Socket.IO
- Automatic reconnection
- Built-in heartbeat
- Room and namespace management
- Fallback to long-polling
- Binary support

### Scaling: @socket.io/redis-adapter
- Multi-server support
- Horizontal scaling
- Shared room state across servers

### Monitoring: @socket.io/admin-ui
- Real-time connection monitoring
- Room inspection
- Event debugging
- Performance metrics

**Location**: `server/communication/`

## Implementation

```typescript
import { socketService } from './communication/socketio-service';

// Send to specific user
socketService.sendToUser(userId, 'notification:new', data);

// Broadcast to all
socketService.broadcast('announcement', data);

// Send to room
socketService.sendToThread(threadId, 'message:new', message);
```

## Consequences

### Positive
- Automatic reconnection handling
- Built-in room management
- Redis adapter for horizontal scaling
- Admin UI for monitoring
- Reduced code by 400+ lines
- Better reliability

### Negative
- Event names changed (breaking change)
- Authentication requires JWT in handshake
- Room names changed format
- Additional dependencies

### Neutral
- Requires Redis for multi-server scaling
- Admin UI available in development
- WebSocket and long-polling fallback

## Breaking Changes

- Event names now prefixed with type (e.g., `message:new`)
- Authentication requires JWT token in handshake auth object
- Room names changed (e.g., `user:123` instead of just `123`)

## Scaling Support

With Redis adapter:
- Multiple server instances
- Shared room state
- Load balancing support
- Session affinity not required

## Configuration

```typescript
// Server
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL },
  adapter: createAdapter(redisClient, redisClient.duplicate())
});

// Client
const socket = io('http://localhost:3000', {
  auth: { token: jwtToken }
});
```

## Monitoring

Admin UI available at: `http://localhost:3000/admin` (development only)

## References

- [Socket.IO Documentation](https://socket.io/)
- [Redis Adapter Documentation](https://socket.io/docs/v4/redis-adapter/)
- [Admin UI Documentation](https://socket.io/docs/v4/admin-ui/)
