import { Settings, Bell, Shield, Eye, Lock, Trash2, Save } from "lucide-react"
import { useState } from "react"

import { Button } from '../../local/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../local/components/ui/card"
import { Input } from '../../local/components/ui/input"
import { Label } from '../../local/components/ui/label"
import { Separator } from '../../local/components/ui/separator"
import { Switch } from '../../local/components/ui/switch"

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  verificationUpdates: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
}

interface PrivacySettings {
  profileVisibility: "public" | "private" | "contacts";
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowDataCollection: boolean;
}

export default function UserSettings() {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    verificationUpdates: true,
    marketingEmails: false,
    securityAlerts: true,
  });

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: "public",
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowDataCollection: true,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrivacyChange = (
    key: keyof PrivacySettings,
    value: boolean | string
  ) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      window.alert("Passwords do not match");
      return;
    }
    // Handle password change logic
    window.alert("Password updated successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      // Handle account deletion logic
      window.alert(
        "Account deletion initiated. You will receive a confirmation email."
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Settings className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Account Settings
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Configure your account preferences, privacy settings, and security
              options.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 navbar-offset pb-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={() =>
                        handleNotificationChange("emailNotifications")
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates via SMS
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notifications.smsNotifications}
                      onCheckedChange={() =>
                        handleNotificationChange("smsNotifications")
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">
                        Push Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Browser push notifications
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notifications.pushNotifications}
                      onCheckedChange={() =>
                        handleNotificationChange("pushNotifications")
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="verification-updates">
                        Verification Updates
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Property verification status
                      </p>
                    </div>
                    <Switch
                      id="verification-updates"
                      checked={notifications.verificationUpdates}
                      onCheckedChange={() =>
                        handleNotificationChange("verificationUpdates")
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-emails">Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Product updates and offers
                      </p>
                    </div>
                    <Switch
                      id="marketing-emails"
                      checked={notifications.marketingEmails}
                      onCheckedChange={() =>
                        handleNotificationChange("marketingEmails")
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="security-alerts">Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Account security notifications
                      </p>
                    </div>
                    <Switch
                      id="security-alerts"
                      checked={notifications.securityAlerts}
                      onCheckedChange={() =>
                        handleNotificationChange("securityAlerts")
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Privacy Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <select
                    id="profile-visibility"
                    value={privacy.profileVisibility}
                    onChange={(e) =>
                      handlePrivacyChange("profileVisibility", e.target.value)
                    }
                    className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    aria-label="Profile visibility setting"
                  >
                    <option value="public">
                      Public - Anyone can see your profile
                    </option>
                    <option value="private">
                      Private - Only you can see your profile
                    </option>
                    <option value="contacts">
                      Contacts - Only your contacts can see your profile
                    </option>
                  </select>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-email">Show Email Address</Label>
                        <p className="text-sm text-muted-foreground">
                          Display email on profile
                        </p>
                      </div>
                      <Switch
                        id="show-email"
                        checked={privacy.showEmail}
                        onCheckedChange={(checked) =>
                          handlePrivacyChange("showEmail", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-phone">Show Phone Number</Label>
                        <p className="text-sm text-muted-foreground">
                          Display phone on profile
                        </p>
                      </div>
                      <Switch
                        id="show-phone"
                        checked={privacy.showPhone}
                        onCheckedChange={(checked) =>
                          handlePrivacyChange("showPhone", checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="show-location">Show Location</Label>
                        <p className="text-sm text-muted-foreground">
                          Display location on profile
                        </p>
                      </div>
                      <Switch
                        id="show-location"
                        checked={privacy.showLocation}
                        onCheckedChange={(checked) =>
                          handlePrivacyChange("showLocation", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="data-collection">
                          Allow Data Collection
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          For analytics and improvements
                        </p>
                      </div>
                      <Switch
                        id="data-collection"
                        checked={privacy.allowDataCollection}
                        onCheckedChange={(checked) =>
                          handlePrivacyChange("allowDataCollection", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <Button
                  onClick={handlePasswordChange}
                  className="w-full md:w-auto"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account by enabling
                  two-factor authentication.
                </p>
                <Button variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Settings */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-medium">Save Changes</h4>
                  <p className="text-sm text-muted-foreground">
                    Don{`'`}t forget to save your settings before leaving this
                    page.
                  </p>
                </div>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save All Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-medium">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
