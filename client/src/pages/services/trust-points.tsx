import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Shield, Award, Star, Users, CheckCircle, ArrowRight } from "lucide-react";

export default function TrustPointsPage() {
  // Simulated user trust points data
  const trustPoints = {
    total: 850,
    level: "Silver",
    nextLevel: "Gold",
    pointsToNext: 150,
    recentActivities: [
      {
        action: "Property Verification",
        points: 100,
        date: "2025-03-13"
      },
      {
        action: "Helpful Review",
        points: 25,
        date: "2025-03-12"
      },
      {
        action: "Document Authentication",
        points: 75,
        date: "2025-03-10"
      }
    ]
  };

  const levels = [
    {
      name: "Bronze",
      points: 0,
      benefits: ["Basic property verification", "Community access", "Review submission"]
    },
    {
      name: "Silver",
      points: 500,
      benefits: ["Priority support", "Extended property history", "Review voting rights"]
    },
    {
      name: "Gold",
      points: 1000,
      benefits: ["Advanced fraud detection", "Instant verification", "Expert consultation"]
    },
    {
      name: "Platinum",
      points: 2000,
      benefits: ["VIP support", "Custom reports", "Early access to features"]
    }
  ];

  const earningMethods = [
    {
      action: "Property Verification",
      points: 100,
      icon: Shield
    },
    {
      action: "Document Authentication",
      points: 75,
      icon: CheckCircle
    },
    {
      action: "Writing Reviews",
      points: 50,
      icon: Star
    },
    {
      action: "Referring Users",
      points: 200,
      icon: Users
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Trust Points System</h1>
          <p className="text-muted-foreground">
            Build your reputation and unlock exclusive benefits
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Your Trust Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-[#2C5282] mb-2">
                {trustPoints.total}
              </div>
              <div className="text-lg font-medium">{trustPoints.level} Level</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{trustPoints.level}</span>
                <span>{trustPoints.nextLevel}</span>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {trustPoints.pointsToNext} points until {trustPoints.nextLevel} level
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trustPoints.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-medium text-[#2C5282]">
                    +{activity.points} points
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Earning Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Ways to Earn Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {earningMethods.map((method, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <method.icon className="h-8 w-8 text-[#2C5282]" />
                  <div>
                    <div className="font-medium">{method.action}</div>
                    <div className="text-sm text-muted-foreground">
                      Earn {method.points} points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trust Levels */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Trust Levels & Benefits</h2>
          {levels.map((level, index) => (
            <Card key={index}>
              <CardContent className="flex items-center gap-4 p-6">
                <Award className={`h-12 w-12 ${
                  level.name === trustPoints.level ? 'text-[#2C5282]' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{level.name}</h3>
                    {level.name === trustPoints.level && (
                      <span className="px-2 py-1 text-xs bg-[#2C5282] text-white rounded-full">
                        Current Level
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {level.points.toLocaleString()} points required
                  </p>
                  <ul className="mt-2 space-y-1">
                    {level.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-[#2C5282]" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
