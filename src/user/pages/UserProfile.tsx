import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';
import { Badge } from '../../shared/components/ui/badge';
import { Separator } from '../../shared/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Edit,
  Camera,
  Star,
  Award
} from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  avatar: string;
  verificationLevel: 'Basic' | 'Silver' | 'Gold' | 'Platinum';
  trustScore: number;
  totalVerifications: number;
  successfulTransactions: number;
}

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    id: 'user-123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+254 712 345 678',
    location: 'Nairobi, Kenya',
    joinDate: '2023-03-15',
    avatar: '/placeholder-avatar.jpg',
    verificationLevel: 'Silver',
    trustScore: 85,
    totalVerifications: 12,
    successfulTransactions: 8
  });

  const verificationLevelColors = {
    Basic: 'bg-gray-100 text-gray-800',
    Silver: 'bg-gray-200 text-gray-800',
    Gold: 'bg-yellow-100 text-yellow-800',
    Platinum: 'bg-purple-100 text-purple-800'
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to API
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data if needed
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <User className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              User Profile
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Manage your personal information, verification status, and account preferences.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 navbar-offset pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative mx-auto w-24 h-24 mb-4">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl">{userData.name}</CardTitle>
                <Badge className={verificationLevelColors[userData.verificationLevel]}>
                  <Shield className="w-3 h-3 mr-1" />
                  {userData.verificationLevel} Verified
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{userData.trustScore}</div>
                  <div className="text-sm text-muted-foreground">Trust Score</div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold">{userData.totalVerifications}</div>
                    <div className="text-xs text-muted-foreground">Verifications</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{userData.successfulTransactions}</div>
                    <div className="text-xs text-muted-foreground">Transactions</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Achievements</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Award className="w-3 h-3 mr-1" />
                      Verified User
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Top Rated
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={userData.name}
                        onChange={(e) => setUserData({...userData, name: e.target.value})}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{userData.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        onChange={(e) => setUserData({...userData, email: e.target.value})}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{userData.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={userData.phone}
                        onChange={(e) => setUserData({...userData, phone: e.target.value})}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{userData.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        value={userData.location}
                        onChange={(e) => setUserData({...userData, location: e.target.value})}
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{userData.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(userData.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-4 pt-4">
                    <Button onClick={handleSave}>
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification History */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Property Verification</p>
                          <p className="text-sm text-muted-foreground">
                            {i === 1 ? '2 days ago' : i === 2 ? '1 week ago' : '2 weeks ago'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}