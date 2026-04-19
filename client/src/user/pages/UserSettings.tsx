import { Settings, Bell, Shield, Eye, Lock, Trash2, Save, AlertTriangle } from "lucide-react"
import { useState, useCallback, useId } from "react"

import { Button } from "../../local/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../local/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../local/components/ui/dialog"
import { Input } from "../../local/components/ui/input"
import { Label } from "../../local/components/ui/label"
import { Separator } from "../../local/components/ui/separator"
import { Switch } from "../../local/components/ui/switch"
import { useToast } from "../../local/hooks/use-toast"
import { useUpdateUserPreferences } from "../hooks/useUser"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  verificationUpdates: boolean
  marketingEmails: boolean
  securityAlerts: boolean
}

interface PrivacySettings {
  profileVisibility: "public" | "private" | "contacts"
  showEmail: boolean
  showPhone: boolean
  showLocation: boolean
  allowDataCollection: boolean
}

interface PasswordForm {
  current: string
  next: string
  confirm: string
}

interface PasswordValidation {
  match: boolean
  minLength: boolean
  hasNumber: boolean
  hasSpecial: boolean
}

interface UserSettingsProps {
  readonly userId: string
}

// ─── Password validation ──────────────────────────────────────────────────────

const MIN_PASSWORD_LENGTH = 8

function validatePassword(form: PasswordForm): PasswordValidation {
  return {
    match: form.next === form.confirm,
    minLength: form.next.length >= MIN_PASSWORD_LENGTH,
    hasNumber: /\d/.test(form.next),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(form.next),
  }
}

function isPasswordFormValid(form: PasswordForm, v: PasswordValidation): boolean {
  return !!form.current && !!form.next && !!form.confirm && Object.values(v).every(Boolean)
}

const PASSWORD_RULES: Array<{ key: keyof PasswordValidation; label: string }> = [
  { key: "minLength", label: `At least ${MIN_PASSWORD_LENGTH} characters` },
  { key: "hasNumber", label: "Contains a number" },
  { key: "hasSpecial", label: "Contains a special character" },
  { key: "match", label: "Passwords match" },
]

// ─── Layout primitives ────────────────────────────────────────────────────────

interface SettingRowProps {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

function SettingRow({ id, label, description, checked, onCheckedChange, disabled }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5 flex-1 min-w-0">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  )
}

interface SectionTitleProps {
  icon: React.ReactNode
  title: string
}

function SectionTitle({ icon, title }: SectionTitleProps) {
  return (
    <CardTitle className="flex items-center gap-2 text-base font-semibold">
      <span className="text-muted-foreground" aria-hidden>{icon}</span>
      {title}
    </CardTitle>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function UserSettings({ userId }: UserSettingsProps) {
  const { toast } = useToast()
  const updatePreferences = useUpdateUserPreferences()

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    verificationUpdates: true,
    marketingEmails: false,
    securityAlerts: true,
  })

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowDataCollection: true,
  })

  const [passwords, setPasswords] = useState<PasswordForm>({
    current: "",
    next: "",
    confirm: "",
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const passwordValidation = validatePassword(passwords)
  const passwordFormValid = isPasswordFormValid(passwords, passwordValidation)
  const showPasswordRules = passwords.next.length > 0

  // Stable unique ID prefix for ARIA associations
  const uid = useId()

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleNotificationChange = useCallback(
    (key: keyof NotificationSettings) => (checked: boolean) => {
      setNotifications((prev) => ({ ...prev, [key]: checked }))
    },
    []
  )

  const handlePrivacyToggle = useCallback(
    (key: keyof Omit<PrivacySettings, "profileVisibility">) =>
      (checked: boolean) => {
        setPrivacy((prev) => ({ ...prev, [key]: checked }))
      },
    []
  )

  const handleVisibilityChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPrivacy((prev) => ({
        ...prev,
        profileVisibility: e.target.value as PrivacySettings["profileVisibility"],
      }))
    },
    []
  )

  const handlePasswordField = useCallback(
    (field: keyof PasswordForm) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords((prev) => ({ ...prev, [field]: e.target.value }))
      },
    []
  )

  const handleSaveAll = useCallback(async () => {
    setIsSaving(true)
    try {
      await updatePreferences.mutateAsync({
        userId,
        preferences: {
          notifications: {
            email: notifications.emailNotifications,
            sms: notifications.smsNotifications,
            push: notifications.pushNotifications,
          },
          privacy: {
            showProfile: privacy.profileVisibility === "public",
            showContactInfo: privacy.showEmail || privacy.showPhone,
          },
        },
      })
      toast({ title: "Settings saved", description: "Your preferences have been updated." })
    } catch (err) {
      toast({
        title: "Failed to save settings",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [userId, notifications, privacy, updatePreferences, toast])

  const handlePasswordChange = useCallback(async () => {
    if (!passwordFormValid) return
    setIsChangingPassword(true)
    try {
      const res = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.next,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(body.message ?? "Password update failed")
      }
      toast({ title: "Password updated", description: "Your password has been changed." })
      setPasswords({ current: "", next: "", confirm: "" })
    } catch (err) {
      toast({
        title: "Password update failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }, [passwords, passwordFormValid, toast])

  const handleDeleteAccount = useCallback(async () => {
    if (!deletePassword) return
    setIsDeletingAccount(true)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string }
        throw new Error(body.message ?? "Account deletion failed")
      }
      toast({
        title: "Account deletion initiated",
        description: "You will receive a confirmation email shortly.",
      })
      setShowDeleteDialog(false)
    } catch (err) {
      toast({
        title: "Deletion failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingAccount(false)
      setDeletePassword("")
    }
  }, [userId, deletePassword, toast])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-linear-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6">
            <Settings className="w-10 h-10 text-primary" aria-hidden />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Account Settings
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Manage your notification preferences, privacy settings, and account security.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ── Notifications ── */}
          <Card>
            <CardHeader className="pb-3">
              <SectionTitle icon={<Bell className="w-4 h-4" />} title="Notification Preferences" />
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              <SettingRow
                id={`${uid}-email`}
                label="Email Notifications"
                description="Receive updates via email"
                checked={notifications.emailNotifications}
                onCheckedChange={handleNotificationChange("emailNotifications")}
              />
              <SettingRow
                id={`${uid}-verification`}
                label="Verification Updates"
                description="Property verification status changes"
                checked={notifications.verificationUpdates}
                onCheckedChange={handleNotificationChange("verificationUpdates")}
              />
              <SettingRow
                id={`${uid}-sms`}
                label="SMS Notifications"
                description="Receive updates via SMS"
                checked={notifications.smsNotifications}
                onCheckedChange={handleNotificationChange("smsNotifications")}
              />
              <SettingRow
                id={`${uid}-marketing`}
                label="Marketing Emails"
                description="Product updates and offers"
                checked={notifications.marketingEmails}
                onCheckedChange={handleNotificationChange("marketingEmails")}
              />
              <SettingRow
                id={`${uid}-push`}
                label="Push Notifications"
                description="Browser push notifications"
                checked={notifications.pushNotifications}
                onCheckedChange={handleNotificationChange("pushNotifications")}
              />
              <SettingRow
                id={`${uid}-security`}
                label="Security Alerts"
                description="Account security notifications"
                checked={notifications.securityAlerts}
                onCheckedChange={handleNotificationChange("securityAlerts")}
                // Security alerts should never be silently disabled
                disabled={false}
              />
            </CardContent>
          </Card>

          {/* ── Privacy ── */}
          <Card>
            <CardHeader className="pb-3">
              <SectionTitle icon={<Eye className="w-4 h-4" />} title="Privacy Settings" />
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor={`${uid}-visibility`} className="text-sm font-medium">
                  Profile Visibility
                </Label>
                <select
                  id={`${uid}-visibility`}
                  value={privacy.profileVisibility}
                  onChange={handleVisibilityChange}
                  className="w-full mt-1 h-9 px-3 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  title="Profile visibility options"
                >
                  <option value="public">Public — anyone can view your profile</option>
                  <option value="contacts">Contacts — only your contacts can view</option>
                  <option value="private">Private — only you can view your profile</option>
                </select>
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                <SettingRow
                  id={`${uid}-show-email`}
                  label="Show Email Address"
                  description="Display your email on your profile"
                  checked={privacy.showEmail}
                  onCheckedChange={handlePrivacyToggle("showEmail")}
                />
                <SettingRow
                  id={`${uid}-show-location`}
                  label="Show Location"
                  description="Display your location on your profile"
                  checked={privacy.showLocation}
                  onCheckedChange={handlePrivacyToggle("showLocation")}
                />
                <SettingRow
                  id={`${uid}-show-phone`}
                  label="Show Phone Number"
                  description="Display your phone on your profile"
                  checked={privacy.showPhone}
                  onCheckedChange={handlePrivacyToggle("showPhone")}
                />
                <SettingRow
                  id={`${uid}-data`}
                  label="Allow Analytics"
                  description="Help us improve via anonymized usage data"
                  checked={privacy.allowDataCollection}
                  onCheckedChange={handlePrivacyToggle("allowDataCollection")}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Security ── */}
          <Card>
            <CardHeader className="pb-3">
              <SectionTitle icon={<Shield className="w-4 h-4" />} title="Security" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Password change */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">Change Password</h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`${uid}-cur-pw`} className="text-xs">Current Password</Label>
                    <Input
                      id={`${uid}-cur-pw`}
                      type="password"
                      value={passwords.current}
                      onChange={handlePasswordField("current")}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${uid}-new-pw`} className="text-xs">New Password</Label>
                    <Input
                      id={`${uid}-new-pw`}
                      type="password"
                      value={passwords.next}
                      onChange={handlePasswordField("next")}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-describedby={showPasswordRules ? `${uid}-pw-rules` : undefined}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${uid}-conf-pw`} className="text-xs">Confirm Password</Label>
                    <Input
                      id={`${uid}-conf-pw`}
                      type="password"
                      value={passwords.confirm}
                      onChange={handlePasswordField("confirm")}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Live password rules */}
                {showPasswordRules && (
                  <ul
                    id={`${uid}-pw-rules`}
                    className="space-y-1"
                    aria-label="Password requirements"
                  >
                    {PASSWORD_RULES.map(({ key, label }) => (
                      <li
                        key={key}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          passwordValidation[key]
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span aria-hidden className="text-[10px]">
                          {passwordValidation[key] ? "✓" : "○"}
                        </span>
                        {label}
                      </li>
                    ))}
                  </ul>
                )}

                <Button
                  onClick={handlePasswordChange}
                  disabled={!passwordFormValid || isChangingPassword}
                  className="w-full sm:w-auto"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isChangingPassword ? "Updating…" : "Update Password"}
                </Button>
              </div>

              <Separator />

              {/* 2FA */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Two-Factor Authentication</h4>
                <p className="text-xs text-muted-foreground">
                  Add an extra layer of security by requiring a verification code on sign-in.
                </p>
                <Button variant="outline" size="sm">
                  <Shield className="w-4 h-4 mr-2" />
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Save bar ── */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm font-medium">Save Changes</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Notification and privacy preferences are saved together.
                  </p>
                </div>
                <Button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="shrink-0"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving…" : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Danger zone ── */}
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive flex items-center gap-2 text-base">
                <AlertTriangle className="w-4 h-4" aria-hidden />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-sm font-medium">Delete Account</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently removes your account and all associated data. This cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" aria-hidden />
              Delete your account?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all associated data.
              This action <strong>cannot be undone</strong>. Enter your password to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <Label htmlFor={`${uid}-del-pw`} className="text-sm">
              Your password
            </Label>
            <Input
              id={`${uid}-del-pw`}
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password to confirm"
              autoComplete="current-password"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeletePassword("")
              }}
              disabled={isDeletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!deletePassword || isDeletingAccount}
            >
              {isDeletingAccount ? "Deleting…" : "Delete My Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}