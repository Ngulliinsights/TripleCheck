"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = KarmaScorePage;
var tooltip_1 = require("../../local/components/ui/tooltip");
var lucide_react_1 = require("lucide-react");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var date_utils_1 = require("../../local/utils/date-utils");
function KarmaScorePage() {
    // Simulated karma score data
    var karmaScore = {
        overall: 85,
        components: {
            verificationHistory: 90,
            communityTrust: 82,
            documentAccuracy: 88,
            transactionHistory: 80,
            responseTime: 85,
        },
        recentActivities: [
            {
                type: "verification",
                status: "success",
                date: "2025-03-13",
                description: "Property documents verified successfully",
            },
            {
                type: "warning",
                status: "pending",
                date: "2025-03-12",
                description: "Pending response to user inquiry",
            },
            {
                type: "success",
                status: "completed",
                date: "2025-03-10",
                description: "Completed transaction with verified documentation",
            },
        ],
    };
    var scoreCategories = [
        { min: 90, label: "Exceptional", color: "text-green-500" },
        { min: 80, label: "Very Good", color: "text-blue-500" },
        { min: 70, label: "Good", color: "text-yellow-500" },
        { min: 60, label: "Fair", color: "text-orange-500" },
        { min: 0, label: "Needs Improvement", color: "text-red-500" },
    ];
    var getCurrentCategory = function (score) {
        return (scoreCategories.find(function (category) { return score >= category.min; }) ||
            scoreCategories[scoreCategories.length - 1]);
    };
    var currentCategory = getCurrentCategory(karmaScore.overall);
    return (<div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Real Estate Karma Score</h1>
          <p className="text-muted-foreground">
            Your comprehensive trust rating in the real estate community
          </p>
        </div>

        {/* Overall Score */}
        <card_1.Card>
          <card_1.CardContent className="pt-6">
            <div className="text-center space-y-4">
              <lucide_react_1.Gauge className="h-24 w-24 mx-auto text-[#2C5282]"/>
              <div className="text-6xl font-bold text-[#2C5282]">
                {karmaScore.overall}
              </div>
              <div className={"text-xl font-medium ".concat((currentCategory === null || currentCategory === void 0 ? void 0 : currentCategory.color) || 'text-gray-600')}>
                {(currentCategory === null || currentCategory === void 0 ? void 0 : currentCategory.label) || 'Unknown'}
              </div>
              <p className="text-muted-foreground">
                Your karma score indicates a strong reputation in our community
              </p>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Score Components */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Score Components</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <tooltip_1.TooltipProvider>
              {Object.entries(karmaScore.components).map(function (_a) {
            var key = _a[0], value = _a[1];
            return (<div key={key} className="space-y-2">
                  <div className="flex justify-between">
                    <tooltip_1.Tooltip>
                      <tooltip_1.TooltipTrigger className="text-left">
                        <span className="font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </tooltip_1.TooltipTrigger>
                      <tooltip_1.TooltipContent>
                        <p>
                          Learn more about{" "}
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                      </tooltip_1.TooltipContent>
                    </tooltip_1.Tooltip>
                    <span className="font-medium">{value}%</span>
                  </div>
                  <progress_1.Progress value={value} className="h-2"/>
                </div>);
        })}
            </tooltip_1.TooltipProvider>
          </card_1.CardContent>
        </card_1.Card>

        {/* Recent Activities */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Recent Activities</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-4">
              {karmaScore.recentActivities.map(function (activity, index) { return (<div key={index} className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  {activity.status === "success" ?
                <lucide_react_1.CheckCircle2 className="h-5 w-5 text-green-500 mt-1"/>
                : activity.status === "pending" ?
                    <lucide_react_1.AlertTriangle className="h-5 w-5 text-yellow-500 mt-1"/>
                    : <lucide_react_1.Shield className="h-5 w-5 text-blue-500 mt-1"/>}
                  <div>
                    <div className="font-medium">{activity.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {(0, date_utils_1.formatDate)(activity.date)}
                    </div>
                  </div>
                </div>); })}
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Improvement Tips */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Ways to Improve Your Score</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <lucide_react_1.History className="h-5 w-5 text-[#2C5282]"/>
                  <h3 className="font-medium">Regular Updates</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep your property listings and documentation up to date
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <lucide_react_1.TrendingUp className="h-5 w-5 text-[#2C5282]"/>
                  <h3 className="font-medium">Consistent Performance</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maintain high standards in all property transactions
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <lucide_react_1.Shield className="h-5 w-5 text-[#2C5282]"/>
                  <h3 className="font-medium">Verification Process</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete all verification steps for your properties
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <lucide_react_1.Users className="h-5 w-5 text-[#2C5282]"/>
                  <h3 className="font-medium">Community Engagement</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Actively participate in the community and respond to inquiries
                </p>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
