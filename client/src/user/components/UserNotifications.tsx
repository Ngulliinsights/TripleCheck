import { Bell, Check, X, AlertCircle, Info, CheckCircle, CheckCheck } from "lucide-react"
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react"

import { EnterpriseVirtualizedList } from "../../local/components"
import { Badge } from "../../local/components/ui/badge"
import { Button } from "../../local/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../local/components/ui/card"
import { useNotificationListVirtualization } from "../../local/hooks/useMemoryOptimization"
import { formatDate } from "../../local/utils/date-utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BaseEntity {
  id: string | number
  [key: string]: unknown
}

interface Notification extends BaseEntity {
  type: "info" | "success" | "warning" | "error"
  title: string
  message: string
  createdAt: string
  isRead: boolean
}

interface UserNotificationsProps {
  readonly notifications?: Notification[]
  readonly onMarkAsRead?: (id: string) => void
  readonly onMarkAllAsRead?: () => void
  readonly onDismiss?: (id: string) => void
}

// ─── Pure helpers (module-level to avoid re-creation on render) ───────────────

const ICON_MAP = {
  success: CheckCircle,
  warning: AlertCircle,
  error: X,
  info: Info,
} as const satisfies Record<Notification["type"], React.ElementType>

const COLOR_MAP = {
  success: "text-green-600",
  warning: "text-yellow-500",
  error: "text-red-600",
  info: "text-blue-600",
} as const satisfies Record<Notification["type"], string>

const BG_MAP = {
  success: "bg-green-50 border-green-100",
  warning: "bg-yellow-50 border-yellow-100",
  error: "bg-red-50 border-red-100",
  info: "bg-blue-50 border-blue-100",
} as const satisfies Record<Notification["type"], string>

// ─── Notification item ────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
}

const NotificationItem = React.memo(
  ({ notification, onMarkAsRead, onDismiss }: NotificationItemProps) => {
    const Icon = ICON_MAP[notification.type]
    const iconColor = COLOR_MAP[notification.type]
    const bgClass = notification.isRead
      ? "bg-muted/30 border-transparent"
      : BG_MAP[notification.type]
    const id = String(notification.id)

    return (
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors duration-150 ${bgClass}`}
      >
        {/* Type icon */}
        <Icon className={`h-4.5 w-4.5 mt-0.5 shrink-0 ${iconColor}`} aria-hidden />

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4
                className={`text-sm font-medium truncate ${
                  notification.isRead ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {notification.message}
              </p>
              <time
                dateTime={notification.createdAt}
                className="text-xs text-muted-foreground/70 mt-1 block"
              >
                {formatDate(notification.createdAt)}
              </time>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {!notification.isRead && (
                <>
                  {/* Unread dot */}
                  <span
                    className="w-2 h-2 rounded-full bg-blue-500 shrink-0"
                    aria-label="Unread"
                    role="status"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 hover:bg-background/80"
                    onClick={() => onMarkAsRead(id)}
                    title="Mark as read"
                    aria-label={`Mark "${notification.title}" as read`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-background/80 hover:text-red-500"
                onClick={() => onDismiss(id)}
                title="Dismiss notification"
                aria-label={`Dismiss "${notification.title}"`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

NotificationItem.displayName = "NotificationItem"

// ─── Virtualized list ─────────────────────────────────────────────────────────

const ITEM_HEIGHT = 90

interface VirtualizedNotificationsListProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onDismiss: (id: string) => void
}

const VirtualizedNotificationsList: React.FC<VirtualizedNotificationsListProps> = ({
  notifications,
  onMarkAsRead,
  onDismiss,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(400)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect()
      const available = window.innerHeight - rect.top - 100
      setContainerHeight(Math.max(300, Math.min(500, available)))
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const listProps = useNotificationListVirtualization(
    notifications as unknown as readonly BaseEntity[],
    containerHeight,
    ITEM_HEIGHT
  )

  const renderItem = useCallback(
    (item: BaseEntity, _index: number, style: React.CSSProperties) => (
      <div style={style} className="px-0.5 py-1">
        <NotificationItem
          notification={item as Notification}
          onMarkAsRead={onMarkAsRead}
          onDismiss={onDismiss}
        />
      </div>
    ),
    [onMarkAsRead, onDismiss]
  )

  return (
    <div ref={containerRef} className="w-full">
      <EnterpriseVirtualizedList {...listProps} renderItem={renderItem} />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UserNotifications({
  notifications: propNotifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
}: UserNotificationsProps) {
  /**
   * Local state mirrors the prop so optimistic UI updates (mark-read, dismiss)
   * are reflected immediately without waiting for the parent to re-render.
   * When the prop reference changes (e.g. a server refresh), local state syncs.
   */
  const [notifications, setNotifications] = useState<Notification[]>(propNotifications)

  useEffect(() => {
    setNotifications(propNotifications)
  }, [propNotifications])

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  )

  const handleMarkAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (String(n.id) === id ? { ...n, isRead: true } : n))
      )
      onMarkAsRead?.(id)
    },
    [onMarkAsRead]
  )

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    onMarkAllAsRead?.()
  }, [onMarkAllAsRead])

  const handleDismiss = useCallback(
    (id: string) => {
      setNotifications((prev) => prev.filter((n) => String(n.id) !== id))
      onDismiss?.(id)
    },
    [onDismiss]
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Bell className="h-5 w-5" aria-hidden />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1 tabular-nums">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="gap-1.5"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <VirtualizedNotificationsList
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onDismiss={handleDismiss}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3"
      role="status"
      aria-label="No notifications"
    >
      <Bell className="h-10 w-10 opacity-30" aria-hidden />
      <p className="text-sm">You're all caught up</p>
    </div>
  )
}