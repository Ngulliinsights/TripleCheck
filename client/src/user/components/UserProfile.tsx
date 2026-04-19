import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PropertyImageVault } from '../../property/components/images'
import { Avatar, AvatarFallback, AvatarImage } from '../../local/components/ui/avatar'
import { Badge } from '../../local/components/ui/badge'
import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../local/components/ui/dialog'
import { PropertyImage } from '../../local/types/images'
import { User, Edit, Mail, Phone, Camera, AlertCircle, Loader, AtSign } from 'lucide-react'
import { useState, useCallback } from 'react'
import styles from './UserProfile.module.css'

import { useToast } from '../../local/hooks/use-toast'
import { User as UserType } from '@shared/types/auth.types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfileProps {
  readonly userId?: string
  readonly user?: UserType
  readonly onEdit?: () => void
  readonly isEditable?: boolean
  readonly onAvatarUpdate?: (avatarUrl: string) => void
}

interface ApiError {
  success: false
  error: string
}

interface ApiSuccess<T> {
  success: true
  data: T
}

type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── API helpers ──────────────────────────────────────────────────────────────

/** Reads the auth token once per call rather than capturing it at import time. */
function authHeader(): Record<string, string> {
  const token = localStorage.getItem('authToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function unwrap<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  const result: ApiResponse<T> = await response.json()
  if (!result.success) throw new Error(result.error)
  return result.data
}

async function fetchUserProfile(): Promise<UserType> {
  return unwrap<UserType>(
    await fetch('/api/users/me', { headers: authHeader() })
  )
}

async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch('/api/users/me/avatar', {
    method: 'POST',
    headers: authHeader(),
    body,
  })
  // Reuse generic unwrap — FormData responses also follow the same ApiResponse shape
  return unwrap<{ avatarUrl: string }>(res)
}

async function updateUserProfile(updates: Partial<UserType>): Promise<UserType> {
  return unwrap<UserType>(
    await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(updates),
    })
  )
}

// ─── Pure helpers (defined outside component to avoid re-creation on render) ──

function getRoleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    agent: 'bg-blue-100 text-blue-800',
    user: 'bg-green-100 text-green-800',
  }
  return map[role] ?? 'bg-gray-100 text-gray-800'
}

function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'U'
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'U'
}

function getTrustScoreLabel(score: number): string {
  if (score >= 900) return 'Excellent'
  if (score >= 750) return 'Very Good'
  if (score >= 500) return 'Good'
  return 'Needs Improvement'
}

function trustScorePercent(score: number): number {
  return Math.min((score / 1000) * 100, 100)
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UserProfile({
  userId,
  user: propUser,
  onEdit,
  isEditable = false,
  onAvatarUpdate,
}: Readonly<UserProfileProps>) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)

  /**
   * When a user is provided via props, it seeds the cache as `initialData`
   * so no network request is made. When it's absent, the query fetches from
   * the server. Either way, `user` below is the single source of truth.
   */
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<UserType, Error>({
    queryKey: ['user-profile', userId],
    queryFn: fetchUserProfile,
    initialData: propUser,
    enabled: !propUser,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: ({ avatarUrl }) => {
      toast({ title: 'Profile picture updated' })
      onAvatarUpdate?.(avatarUrl)
      setShowAvatarUpload(false)
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    },
    onError: (err: Error) => {
      toast({
        title: 'Upload failed',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const _updateMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updated) => {
      toast({ title: 'Profile updated' })
      queryClient.setQueryData(['user-profile', userId], updated)
    },
    onError: (err: Error) => {
      toast({
        title: 'Update failed',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const handleAvatarSelect = useCallback(
    (images: PropertyImage[]) => {
      const file = images[0]?.file
      if (file) avatarMutation.mutate(file)
    },
    [avatarMutation]
  )

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="flex items-center justify-center gap-2 py-12">
          <Loader className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-muted-foreground">Loading profile…</span>
        </CardContent>
      </Card>
    )
  }

  // ── Error / empty ──────────────────────────────────────────────────────────

  if (error || !user) {
    return (
      <Card className="w-full max-w-2xl border-red-200 bg-red-50">
        <CardContent className="flex items-start gap-3 pt-6 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">
              {error ? 'Failed to load profile' : 'No user data available'}
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-0.5">{error.message}</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Main ───────────────────────────────────────────────────────────────────

  const fullName = `${user.firstName} ${user.lastName}`.trim()
  // cspell: disable-next-line
  const notifPrefs = user.preferences?.notifications
  // cspell: disable-next-line
  const privacyPrefs = user.preferences?.privacy

  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">User Profile</CardTitle>
          {isEditable && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ── Identity ── */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} alt={fullName} />
                <AvatarFallback className="text-lg">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>

              {isEditable && (
                <Button
                  size="sm"
                  disabled={avatarMutation.isPending}
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => setShowAvatarUpload(true)}
                  title="Update profile picture"
                  aria-label="Update profile picture"
                >
                  {avatarMutation.isPending ? (
                    <Loader className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>

            <div className="space-y-2 min-w-0">
              <h3 className="text-xl font-semibold truncate">{fullName}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getRoleBadgeClass(user.role)}>
                  {capitalize(user.role)}
                </Badge>
                {user.isVerified && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* ── Contact ── */}
          <Section title="Contact Information">
            <InfoRow icon={<Mail className="h-4 w-4 text-gray-400" />} label={user.email} />
            {user.phone && (
              <InfoRow icon={<Phone className="h-4 w-4 text-gray-400" />} label={user.phone} />
            )}
          </Section>

          {/* ── Trust Score ── */}
          {user.trustScore != null && (
            <Section title="Trust Score">
              <div className="flex items-center gap-4">
                {/* cspell: disable-next-line */}
                <span className="text-3xl font-bold text-blue-600 tabular-nums">
                  {user.trustScore}
                </span>
                <div className="flex-1 space-y-1">
                  <div className={styles.trustScoreBarContainer}>
                    <div
                      className={styles.trustScoreBar}
                      style={{ width: `${trustScorePercent(user.trustScore)}%` }}
                      role="progressbar"
                      aria-valuenow={Math.round(user.trustScore)}
                      aria-valuemin={0}
                      aria-valuemax={1000}
                      aria-label={`Trust score: ${user.trustScore} out of 1000`}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    {getTrustScoreLabel(user.trustScore)}
                  </p>
                </div>
              </div>
            </Section>
          )}

          {/* ── Account Details ── */}
          <Section title="Account Details">
            {user.id && (
              <InfoRow
                icon={<User className="h-4 w-4 text-gray-400" />}
                label={`ID: ${user.id}`}
              />
            )}
            {user.username && (
              <InfoRow
                icon={<AtSign className="h-4 w-4 text-gray-400" />}
                label={user.username}
              />
            )}
          </Section>

          {/* ── Preferences ── */}
          {user.preferences && (
            <Section title="Preferences">
              <PreferenceRow label="Email Notifications" enabled={!!notifPrefs?.email} />
              <PreferenceRow label="SMS Notifications" enabled={!!notifPrefs?.sms} />
              <PreferenceRow
                label="Profile Visibility"
                enabled={!!privacyPrefs?.showProfile}
                enabledLabel="Public"
                disabledLabel="Private"
              />
            </Section>
          )}
        </CardContent>
      </Card>

      {/* ── Avatar upload dialog ── */}
      <Dialog open={showAvatarUpload} onOpenChange={setShowAvatarUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Update Profile Picture
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="min-h-50">
              <PropertyImageVault
                maxFiles={1}
                maxFileSize={5 * 1024 * 1024}
                acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
                allowAnnotation={false}
                allowReorder={false}
                onChange={handleAvatarSelect}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, or WebP · max 5 MB
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Layout primitives ────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2.5">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        {title}
      </h4>
      <div className="grid gap-2">{children}</div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-700">
      {icon}
      <span className="truncate">{label}</span>
    </div>
  )
}

function PreferenceRow({
  label,
  enabled,
  enabledLabel = 'Enabled',
  disabledLabel = 'Disabled',
}: {
  label: string
  enabled: boolean
  enabledLabel?: string
  disabledLabel?: string
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700">{label}</span>
      <Badge variant={enabled ? 'default' : 'secondary'}>
        {enabled ? enabledLabel : disabledLabel}
      </Badge>
    </div>
  )
}