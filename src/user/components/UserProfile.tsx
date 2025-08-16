import { PropertyImageVault } from '@shared/components/images';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { PropertyImage } from '@shared/types/images';
import { User, Edit, Mail, Phone, Calendar, Camera } from 'lucide-react';
import { useState } from 'react';

import { formatDate } from '../../shared/utils/date-utils';

import { User as UserType } from '@/auth/types/auth.types';


interface UserProfileProps {
  readonly user: UserType;
  readonly onEdit?: () => void;
  readonly isEditable?: boolean;
  readonly onAvatarUpdate?: (avatarUrl: string) => void;
}

export function UserProfile({ user, onEdit, isEditable = false, onAvatarUpdate }: Readonly<UserProfileProps>) {
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getTrustScoreLabel = (score: number) => {
    if (score >= 900) return 'Excellent';
    if (score >= 750) return 'Very Good';
    if (score >= 500) return 'Good';
    return 'Needs Improvement';
  };

  const getTrustScoreWidth = (score: number) => {
    return Math.min((score / 1000) * 100, 100);
  };

  const handleAvatarUpload = (images: PropertyImage[]) => {
    if (images.length > 0 && images[0]?.file) {
      // In a real implementation, you would upload the file to your server
      // and get back the URL. For now, we'll create a local URL for demo
      const avatarUrl = URL.createObjectURL(images[0].file);
      onAvatarUpdate?.(avatarUrl);
      setShowAvatarUpload(false);
    }
  };

  return (
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
        {/* Avatar and Basic Info */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="text-lg">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            {isEditable && (
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                onClick={() => setShowAvatarUpload(true)}
                title="Update profile picture"
              >
                <Camera className="w-3 h-3" />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {user.firstName} {user.lastName}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge className={getRoleBadgeColor(user.role)}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>
              {user.isVerified && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="text-lg font-medium">Contact Information</h4>
          <div className="grid gap-3">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Trust Score */}
        {user.trustScore && (
          <div className="space-y-3">
            <h4 className="text-lg font-medium">Trust Score</h4>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-blue-600">
                {user.trustScore}
              </div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getTrustScoreWidth(user.trustScore)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {getTrustScoreLabel(user.trustScore)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Details */}
        <div className="space-y-3">
          <h4 className="text-lg font-medium">Account Details</h4>
          <div className="grid gap-3">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Member since {formatDate(user.createdAt?.toISOString())}</span>
            </div>
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-500" />
              <span>Last updated {formatDate(user.updatedAt?.toISOString())}</span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-3">
          <h4 className="text-lg font-medium">Preferences</h4>
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span>Email Notifications</span>
              <Badge variant={user.preferences.notifications.email ? "default" : "secondary"}>
                {user.preferences.notifications.email ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>SMS Notifications</span>
              <Badge variant={user.preferences.notifications.sms ? "default" : "secondary"}>
                {user.preferences.notifications.sms ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Profile Visibility</span>
              <Badge variant={user.preferences.privacy.showProfile ? "default" : "secondary"}>
                {user.preferences.privacy.showProfile ? "Public" : "Private"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Avatar Upload Dialog */}
      <Dialog open={showAvatarUpload} onOpenChange={setShowAvatarUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Update Profile Picture
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="min-h-[200px]">
              <PropertyImageVault
                maxFiles={1}
                maxFileSize={5 * 1024 * 1024} // 5MB
                acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
                allowAnnotation={false}
                allowReorder={false}
                onChange={handleAvatarUpload}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Upload a profile picture (JPEG, PNG, or WebP, max 5MB)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}