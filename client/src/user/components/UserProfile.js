"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfile = UserProfile;
var index_1 = require("../../local/components/images/index");
var avatar_1 = require("../../local/components/ui/avatar");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var dialog_1 = require("../../local/components/ui/dialog");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var date_utils_1 = require("../../local/utils/date-utils");
function UserProfile(_a) {
    var _b, _c;
    var user = _a.user, onEdit = _a.onEdit, _d = _a.isEditable, isEditable = _d === void 0 ? false : _d, onAvatarUpdate = _a.onAvatarUpdate;
    var _e = (0, react_1.useState)(false), showAvatarUpload = _e[0], setShowAvatarUpload = _e[1];
    var getRoleBadgeColor = function (role) {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'agent': return 'bg-blue-100 text-blue-800';
            case 'user': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    var getInitials = function (firstName, lastName) {
        return "".concat(firstName.charAt(0)).concat(lastName.charAt(0)).toUpperCase();
    };
    var getTrustScoreLabel = function (score) {
        if (score >= 900)
            return 'Excellent';
        if (score >= 750)
            return 'Very Good';
        if (score >= 500)
            return 'Good';
        return 'Needs Improvement';
    };
    var getTrustScoreWidth = function (score) {
        return Math.min((score / 1000) * 100, 100);
    };
    var handleAvatarUpload = function (images) {
        var _a;
        if (images.length > 0 && ((_a = images[0]) === null || _a === void 0 ? void 0 : _a.file)) {
            // In a real implementation, you would upload the file to your server
            // and get back the URL. For now, we'll create a local URL for demo
            var avatarUrl = URL.createObjectURL(images[0].file);
            onAvatarUpdate === null || onAvatarUpdate === void 0 ? void 0 : onAvatarUpdate(avatarUrl);
            setShowAvatarUpload(false);
        }
    };
    return (<card_1.Card className="w-full max-w-2xl">
      <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <card_1.CardTitle className="text-2xl font-bold">User Profile</card_1.CardTitle>
        {isEditable && (<button_1.Button variant="outline" size="sm" onClick={onEdit}>
            <lucide_react_1.Edit className="h-4 w-4 mr-2"/>
            Edit Profile
          </button_1.Button>)}
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <avatar_1.Avatar className="h-20 w-20">
              <avatar_1.AvatarImage src={user.avatar} alt={"".concat(user.firstName, " ").concat(user.lastName)}/>
              <avatar_1.AvatarFallback className="text-lg">
                {getInitials(user.firstName, user.lastName)}
              </avatar_1.AvatarFallback>
            </avatar_1.Avatar>
            {isEditable && (<button_1.Button size="sm" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0" onClick={function () { return setShowAvatarUpload(true); }} title="Update profile picture">
                <lucide_react_1.Camera className="w-3 h-3"/>
              </button_1.Button>)}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {user.firstName} {user.lastName}
            </h3>
            <div className="flex items-center space-x-2">
              <badge_1.Badge className={getRoleBadgeColor(user.role)}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </badge_1.Badge>
              {user.isVerified && (<badge_1.Badge variant="outline" className="text-green-600 border-green-600">
                  Verified
                </badge_1.Badge>)}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="text-lg font-medium">Contact Information</h4>
          <div className="grid gap-3">
            <div className="flex items-center space-x-3">
              <lucide_react_1.Mail className="h-4 w-4 text-gray-500"/>
              <span>{user.email}</span>
            </div>
            {user.phone && (<div className="flex items-center space-x-3">
                <lucide_react_1.Phone className="h-4 w-4 text-gray-500"/>
                <span>{user.phone}</span>
              </div>)}
          </div>
        </div>

        {/* Trust Score */}
        {user.trustScore && (<div className="space-y-3">
            <h4 className="text-lg font-medium">Trust Score</h4>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-blue-600">
                {user.trustScore}
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: "".concat(getTrustScoreWidth(user.trustScore), "%") }}/>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {getTrustScoreLabel(user.trustScore)}
                </p>
              </div>
            </div>
          </div>)}

        {/* Account Details */}
        <div className="space-y-3">
          <h4 className="text-lg font-medium">Account Details</h4>
          <div className="grid gap-3">
            <div className="flex items-center space-x-3">
              <lucide_react_1.Calendar className="h-4 w-4 text-gray-500"/>
              <span>Member since {(0, date_utils_1.formatDate)((_b = user.createdAt) === null || _b === void 0 ? void 0 : _b.toISOString())}</span>
            </div>
            <div className="flex items-center space-x-3">
              <lucide_react_1.User className="h-4 w-4 text-gray-500"/>
              <span>Last updated {(0, date_utils_1.formatDate)((_c = user.updatedAt) === null || _c === void 0 ? void 0 : _c.toISOString())}</span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-3">
          <h4 className="text-lg font-medium">Preferences</h4>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span>Email Notifications</span>
              <badge_1.Badge variant={user.preferences.notifications.email ? "default" : "secondary"}>
                {user.preferences.notifications.email ? "Enabled" : "Disabled"}
              </badge_1.Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>SMS Notifications</span>
              <badge_1.Badge variant={user.preferences.notifications.sms ? "default" : "secondary"}>
                {user.preferences.notifications.sms ? "Enabled" : "Disabled"}
              </badge_1.Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Profile Visibility</span>
              <badge_1.Badge variant={user.preferences.privacy.showProfile ? "default" : "secondary"}>
                {user.preferences.privacy.showProfile ? "Public" : "Private"}
              </badge_1.Badge>
            </div>
          </div>
        </div>
      </card_1.CardContent>

      {/* Avatar Upload Dialog */}
      <dialog_1.Dialog open={showAvatarUpload} onOpenChange={setShowAvatarUpload}>
        <dialog_1.DialogContent className="max-w-md">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle className="flex items-center gap-2">
              <lucide_react_1.Camera className="w-5 h-5"/>
              Update Profile Picture
            </dialog_1.DialogTitle>
          </dialog_1.DialogHeader>
          <div className="space-y-4">
            <div className="min-h-[200px]">
              <index_1.PropertyImageVault maxFiles={1} maxFileSize={5 * 1024 * 1024} // 5MB
     acceptedFormats={['image/jpeg', 'image/png', 'image/webp']} allowAnnotation={false} allowReorder={false} onChange={handleAvatarUpload}/>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a profile picture (JPEG, PNG, or WebP, max 5MB)
            </p>
          </div>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>
    </card_1.Card>);
}
