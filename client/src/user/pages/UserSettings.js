"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UserSettings;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var input_1 = require("../../local/components/ui/input");
var label_1 = require("../../local/components/ui/label");
var separator_1 = require("../../local/components/ui/separator");
var switch_1 = require("../../local/components/ui/switch");
function UserSettings() {
    var _a = (0, react_1.useState)({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        verificationUpdates: true,
        marketingEmails: false,
        securityAlerts: true,
    }), notifications = _a[0], setNotifications = _a[1];
    var _b = (0, react_1.useState)({
        profileVisibility: "public",
        showEmail: false,
        showPhone: false,
        showLocation: true,
        allowDataCollection: true,
    }), privacy = _b[0], setPrivacy = _b[1];
    var _c = (0, react_1.useState)(""), currentPassword = _c[0], setCurrentPassword = _c[1];
    var _d = (0, react_1.useState)(""), newPassword = _d[0], setNewPassword = _d[1];
    var _e = (0, react_1.useState)(""), confirmPassword = _e[0], setConfirmPassword = _e[1];
    var handleNotificationChange = function (key) {
        setNotifications(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = !prev[key], _a)));
        });
    };
    var handlePrivacyChange = function (key, value) {
        setPrivacy(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    };
    var handlePasswordChange = function () {
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
    var handleDeleteAccount = function () {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            // Handle account deletion logic
            window.alert("Account deletion initiated. You will receive a confirmation email.");
        }
    };
    return (<div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <lucide_react_1.Settings className="w-12 h-12 text-primary"/>
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
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.Bell className="w-5 h-5"/>
                Notification Preferences
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label_1.Label htmlFor="email-notifications">
                        Email Notifications
                      </label_1.Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates via email
                      </p>
                    </div>
                    <switch_1.Switch id="email-notifications" checked={notifications.emailNotifications} onCheckedChange={function () {
            return handleNotificationChange("emailNotifications");
        }}/>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label_1.Label htmlFor="sms-notifications">
                        SMS Notifications
                      </label_1.Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates via SMS
                      </p>
                    </div>
                    <switch_1.Switch id="sms-notifications" checked={notifications.smsNotifications} onCheckedChange={function () {
            return handleNotificationChange("smsNotifications");
        }}/>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label_1.Label htmlFor="push-notifications">
                        Push Notifications
                      </label_1.Label>
                      <p className="text-sm text-muted-foreground">
                        Browser push notifications
                      </p>
                    </div>
                    <switch_1.Switch id="push-notifications" checked={notifications.pushNotifications} onCheckedChange={function () {
            return handleNotificationChange("pushNotifications");
        }}/>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label_1.Label htmlFor="verification-updates">
                        Verification Updates
                      </label_1.Label>
                      <p className="text-sm text-muted-foreground">
                        Property verification status
                      </p>
                    </div>
                    <switch_1.Switch id="verification-updates" checked={notifications.verificationUpdates} onCheckedChange={function () {
            return handleNotificationChange("verificationUpdates");
        }}/>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label_1.Label htmlFor="marketing-emails">Marketing Emails</label_1.Label>
                      <p className="text-sm text-muted-foreground">
                        Product updates and offers
                      </p>
                    </div>
                    <switch_1.Switch id="marketing-emails" checked={notifications.marketingEmails} onCheckedChange={function () {
            return handleNotificationChange("marketingEmails");
        }}/>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label_1.Label htmlFor="security-alerts">Security Alerts</label_1.Label>
                      <p className="text-sm text-muted-foreground">
                        Account security notifications
                      </p>
                    </div>
                    <switch_1.Switch id="security-alerts" checked={notifications.securityAlerts} onCheckedChange={function () {
            return handleNotificationChange("securityAlerts");
        }}/>
                  </div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Privacy Settings */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.Eye className="w-5 h-5"/>
                Privacy Settings
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label_1.Label htmlFor="profile-visibility">Profile Visibility</label_1.Label>
                  <select id="profile-visibility" value={privacy.profileVisibility} onChange={function (e) {
            return handlePrivacyChange("profileVisibility", e.target.value);
        }} className="w-full mt-1 p-2 border border-input rounded-md bg-background" aria-label="Profile visibility setting">
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

                <separator_1.Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label_1.Label htmlFor="show-email">Show Email Address</label_1.Label>
                        <p className="text-sm text-muted-foreground">
                          Display email on profile
                        </p>
                      </div>
                      <switch_1.Switch id="show-email" checked={privacy.showEmail} onCheckedChange={function (checked) {
            return handlePrivacyChange("showEmail", checked);
        }}/>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label_1.Label htmlFor="show-phone">Show Phone Number</label_1.Label>
                        <p className="text-sm text-muted-foreground">
                          Display phone on profile
                        </p>
                      </div>
                      <switch_1.Switch id="show-phone" checked={privacy.showPhone} onCheckedChange={function (checked) {
            return handlePrivacyChange("showPhone", checked);
        }}/>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label_1.Label htmlFor="show-location">Show Location</label_1.Label>
                        <p className="text-sm text-muted-foreground">
                          Display location on profile
                        </p>
                      </div>
                      <switch_1.Switch id="show-location" checked={privacy.showLocation} onCheckedChange={function (checked) {
            return handlePrivacyChange("showLocation", checked);
        }}/>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label_1.Label htmlFor="data-collection">
                          Allow Data Collection
                        </label_1.Label>
                        <p className="text-sm text-muted-foreground">
                          For analytics and improvements
                        </p>
                      </div>
                      <switch_1.Switch id="data-collection" checked={privacy.allowDataCollection} onCheckedChange={function (checked) {
            return handlePrivacyChange("allowDataCollection", checked);
        }}/>
                    </div>
                  </div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Security Settings */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.Shield className="w-5 h-5"/>
                Security Settings
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label_1.Label htmlFor="current-password">Current Password</label_1.Label>
                    <input_1.Input id="current-password" type="password" value={currentPassword} onChange={function (e) { return setCurrentPassword(e.target.value); }} placeholder="Enter current password"/>
                  </div>
                  <div className="space-y-2">
                    <label_1.Label htmlFor="new-password">New Password</label_1.Label>
                    <input_1.Input id="new-password" type="password" value={newPassword} onChange={function (e) { return setNewPassword(e.target.value); }} placeholder="Enter new password"/>
                  </div>
                  <div className="space-y-2">
                    <label_1.Label htmlFor="confirm-password">Confirm Password</label_1.Label>
                    <input_1.Input id="confirm-password" type="password" value={confirmPassword} onChange={function (e) { return setConfirmPassword(e.target.value); }} placeholder="Confirm new password"/>
                  </div>
                </div>
                <button_1.Button onClick={handlePasswordChange} className="w-full md:w-auto">
                  <lucide_react_1.Lock className="w-4 h-4 mr-2"/>
                  Update Password
                </button_1.Button>
              </div>

              <separator_1.Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account by enabling
                  two-factor authentication.
                </p>
                <button_1.Button variant="outline">
                  <lucide_react_1.Shield className="w-4 h-4 mr-2"/>
                  Enable 2FA
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Save Settings */}
          <card_1.Card>
            <card_1.CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-medium">Save Changes</h4>
                  <p className="text-sm text-muted-foreground">
                    Don{"'"}t forget to save your settings before leaving this
                    page.
                  </p>
                </div>
                <button_1.Button>
                  <lucide_react_1.Save className="w-4 h-4 mr-2"/>
                  Save All Settings
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Danger Zone */}
          <card_1.Card className="border-destructive/20">
            <card_1.CardHeader>
              <card_1.CardTitle className="text-destructive">Danger Zone</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-medium">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                </div>
                <button_1.Button variant="destructive" onClick={handleDeleteAccount}>
                  <lucide_react_1.Trash2 className="w-4 h-4 mr-2"/>
                  Delete Account
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </div>);
}
