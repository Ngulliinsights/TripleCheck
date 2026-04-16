# Communication Controllers Consolidation Plan

## Current State (PROBLEMATIC)

Three overlapping controllers exist:
- `messages.controller.ts` - Message thread management
- `messaging.controller.ts` - Real-time messaging
- `communication.controller.ts` - General communication

Two overlapping services:
- `messaging.service.ts`
- `communication-business.service.ts`

## Risk

Route conflicts and confusion about which controller handles what functionality.

## Recommended Structure

```
server/communication/
├── controllers/
│   ├── messages.controller.ts      # Message CRUD operations
│   ├── threads.controller.ts       # Thread management
│   └── notifications.controller.ts # Notification management
├── services/
│   ├── messaging.service.ts        # Core messaging logic
│   ├── notification.service.ts     # Notification logic
│   └── websocket.service.ts        # Real-time communication
└── index.ts                         # Route registration
```

## Migration Steps

1. **Audit** - Map all routes in each controller
2. **Categorize** - Group routes by functionality
3. **Consolidate** - Merge into logical controllers
4. **Test** - Ensure no route conflicts
5. **Deprecate** - Remove old files

## Status

⚠️ **PENDING** - Requires careful route mapping to avoid breaking changes

## Temporary Solution

Add clear comments to each controller indicating their purpose until consolidation is complete.
