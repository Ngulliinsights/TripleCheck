import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Gauge, CheckCircle2, AlertTriangle, TrendingUp, History, Shield, Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function KarmaScorePage() {
  // Simulated karma score data
  const karmaScore = {
    overall: 85,
    components: {
      verificationHistory: 90,
      communityTrust: 82,
      documentAccuracy: 88,
      transactionHistory: 80,
      responseTime: 85
    },
    recentActivities: [
      {
        type: "verification",
        status: "success",
        date: "2025-03-13",
        description: "Property documents verified successfully"
      },
      {
        type: "warning",
        status: "pending",
        date: "2025-03-12",
        description: "Pending response to user inquiry"
      },
      {
        type: "success",
        status: "completed",
        date: "2025-03-10",
        description: "Completed transaction with verified documentation"
      }
    ]
  };

  const scoreCategories = [
    { min: 90, label: "Exceptional", color: "text-green-500" },
    { min: 80, label: "Very Good", color: "text-blue-500" },
    { min: 70, label: "Good", color: "text-yellow-500" },
    { min: 60, label: "Fair", color: "text-orange-500" },
    { min: 0, label: "Needs Improvement", color: "text-red-500" }
  ];

  const getCurrentCategory = (score: number) => {
    return scoreCategories.find(category => score >= category.min) || scoreCategories[scoreCategories.length - 1];
  };

  const currentCategory = getCurrentCategory(karmaScore.overall);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Real Estate Karma Score</h1>
          <p className="text-muted-foreground">
            Your comprehensive trust rating in the real estate community
          </p>
        </div>

        {/* Overall Score */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Gauge className="h-24 w-24 mx-auto text-[#2C5282]" />
              <div className="text-6xl font-bold text-[#2C5282]">
                {karmaScore.overall}
              </div>
              <div className={`text-xl font-medium ${currentCategory.color}`}>
                {currentCategory.label}
              </div>
              <p className="text-muted-foreground">
                Your karma score indicates a strong reputation in our community
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Score Components */}
        <Card>
          <CardHeader>
            <CardTitle>Score Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <TooltipProvider>
              {Object.entries(karmaScore.components).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <Tooltip>
                      <TooltipTrigger className="text-left">
                        <span className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Learn more about {key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      </TooltipContent>
                    </Tooltip>
                    <span className="font-medium">{value}%</span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              ))}
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {karmaScore.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  {activity.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-1" />
                  ) : activity.status === 'pending' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1" />
                  ) : (
                    <Shield className="h-5 w-5 text-blue-500 mt-1" />
                  )}
                  <div>
                    <div className="font-medium">{activity.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Improvement Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Ways to Improve Your Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <History className="h-5 w-5 text-[#2C5282]" />
                  <h3 className="font-medium">Regular Updates</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep your property listings and documentation up to date
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-[#2C5282]" />
                  <h3 className="font-medium">Consistent Performance</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maintain high standards in all property transactions
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-[#2C5282]" />
                  <h3 className="font-medium">Verification Process</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete all verification steps for your properties
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-[#2C5282]" />
                  <h3 className="font-medium">Community Engagement</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Actively participate in the community and respond to inquiries
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}