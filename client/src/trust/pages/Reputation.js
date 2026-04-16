"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReputationPage;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var tabs_1 = require("../../local/components/ui/tabs");
var use_toast_1 = require("../../local/hooks/use-toast");
function ReputationPage() {
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)(78), reputationScore = _a[0], setReputationScore = _a[1];
    // Simulated user reputation data
    var _b = (0, react_1.useState)({
        verifiedListings: 5,
        successfulTransactions: 12,
        positiveReviews: 8,
        negativeReviews: 1,
        responseRate: 95,
        verificationLevel: "Silver",
        reputationScore: 78,
        trustPoints: 350,
        memberSince: "March 2023",
        completedCourses: 2
    }), reputationData = _b[0], setReputationData = _b[1];
    var handleDocumentUpload = function () {
        toast({
            title: "Document submitted",
            description: "Your certification will be reviewed within 48 hours.",
        });
    };
    var startCourse = function (courseName) {
        toast({
            title: "Started: ".concat(courseName),
            description: "Course content is now available in your learning dashboard.",
        });
    };
    var claimVerification = function () {
        toast({
            title: "Verification request submitted",
            description: "Our team will review your credentials within 48 hours.",
        });
    };
    return (<div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-[#2C5282]">Build Your Reputation</h1>
      <p className="text-lg mb-8">
        Enhance your trustworthiness in the Kenyan real estate market. 
        A strong reputation leads to faster transactions and premium clients.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <tabs_1.Tabs defaultValue="overview">
            <tabs_1.TabsList className="grid grid-cols-4 mb-8">
              <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="certifications">Certifications</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="education">Education</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="reviews">Reviews</tabs_1.TabsTrigger>
            </tabs_1.TabsList>
            
            <tabs_1.TabsContent value="overview" className="space-y-6">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Reputation Overview</card_1.CardTitle>
                  <card_1.CardDescription>Your current standing in the TripleCheck ecosystem</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="flex justify-between mb-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#2C5282]">{reputationData.reputationScore}</div>
                      <div className="text-sm text-gray-500">Reputation Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#38A169]">{reputationData.trustPoints}</div>
                      <div className="text-sm text-gray-500">Trust Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-amber-500">{reputationData.verificationLevel}</div>
                      <div className="text-sm text-gray-500">Verification Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-500">{reputationData.verifiedListings}</div>
                      <div className="text-sm text-gray-500">Verified Listings</div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Overall Reputation Score</span>
                      <span className="text-sm font-medium">{reputationData.reputationScore}/100</span>
                    </div>
                    <progress_1.Progress value={reputationData.reputationScore} className="h-2"/>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Key Metrics</h3>
                      <ul className="space-y-3">
                        <li className="flex justify-between">
                          <span className="text-gray-600">Response Rate</span>
                          <span className="font-medium">{reputationData.responseRate}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Successful Transactions</span>
                          <span className="font-medium">{reputationData.successfulTransactions}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Positive Reviews</span>
                          <span className="font-medium">{reputationData.positiveReviews}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Negative Reviews</span>
                          <span className="font-medium">{reputationData.negativeReviews}</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-3">Active Badges</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <badge_1.Badge className="flex items-center gap-1 justify-center py-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200">
                          <lucide_react_1.Shield className="h-3 w-3"/> Verified
                        </badge_1.Badge>
                        <badge_1.Badge className="flex items-center gap-1 justify-center py-1.5 bg-green-100 text-green-800 hover:bg-green-200">
                          <lucide_react_1.Star className="h-3 w-3"/> Top Rated
                        </badge_1.Badge>
                        <badge_1.Badge className="flex items-center gap-1 justify-center py-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200">
                          <lucide_react_1.Award className="h-3 w-3"/> Licensed
                        </badge_1.Badge>
                        <badge_1.Badge className="flex items-center gap-1 justify-center py-1.5 bg-purple-100 text-purple-800 hover:bg-purple-200">
                          <lucide_react_1.ThumbsUp className="h-3 w-3"/> Responsive
                        </badge_1.Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Reputation Growth</h3>
                    <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center">
                      <p className="text-gray-500">Reputation growth chart will be displayed here</p>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
              
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Reputation Building Tips</card_1.CardTitle>
                  <card_1.CardDescription>Follow these recommendations to enhance your standing</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <ul className="space-y-4">
                    <li className="flex">
                      <lucide_react_1.Check className="text-green-500 h-5 w-5 mr-3 flex-shrink-0 mt-0.5"/>
                      <div>
                        <strong>Respond Promptly:</strong>
                        <p className="text-gray-600 text-sm">Reply to inquiries within 24 hours to maintain a high response rate</p>
                      </div>
                    </li>
                    <li className="flex">
                      <lucide_react_1.Check className="text-green-500 h-5 w-5 mr-3 flex-shrink-0 mt-0.5"/>
                      <div>
                        <strong>Verify All Listings:</strong>
                        <p className="text-gray-600 text-sm">Submit proper documentation for all properties to earn the Verified Listing badge</p>
                      </div>
                    </li>
                    <li className="flex">
                      <lucide_react_1.Check className="text-green-500 h-5 w-5 mr-3 flex-shrink-0 mt-0.5"/>
                      <div>
                        <strong>Complete Educational Courses:</strong>
                        <p className="text-gray-600 text-sm">Finish at least 3 courses to earn the Educated Agent badge</p>
                      </div>
                    </li>
                    <li className="flex">
                      <lucide_react_1.Check className="text-green-500 h-5 w-5 mr-3 flex-shrink-0 mt-0.5"/>
                      <div>
                        <strong>Upload Certifications:</strong>
                        <p className="text-gray-600 text-sm">Share your real estate credentials to boost your verification level</p>
                      </div>
                    </li>
                  </ul>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>
            
            <tabs_1.TabsContent value="certifications" className="space-y-6">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Professional Certifications</card_1.CardTitle>
                  <card_1.CardDescription>Upload your real estate credentials and licenses</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-6">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Estate Agents Registration Board (EARB) License</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload your active EARB license to verify your credentials as a registered estate agent in Kenya.
                      </p>
                      <div className="flex gap-3">
                        <button_1.Button onClick={handleDocumentUpload}>
                          <lucide_react_1.Upload className="h-4 w-4 mr-2"/>
                          Upload License
                        </button_1.Button>
                        <button_1.Button variant="outline">
                          <lucide_react_1.ExternalLink className="h-4 w-4 mr-2"/>
                          EARB Website
                        </button_1.Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Institution of Surveyors of Kenya (ISK) Membership</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Provide proof of your ISK membership to demonstrate professional standing.
                      </p>
                      <div className="flex gap-3">
                        <button_1.Button onClick={handleDocumentUpload}>
                          <lucide_react_1.Upload className="h-4 w-4 mr-2"/>
                          Upload Certificate
                        </button_1.Button>
                        <button_1.Button variant="outline">
                          <lucide_react_1.ExternalLink className="h-4 w-4 mr-2"/>
                          ISK Website
                        </button_1.Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Real Estate Business Permit</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload your current business permit to verify your official status.
                      </p>
                      <div className="flex gap-3">
                        <button_1.Button onClick={handleDocumentUpload}>
                          <lucide_react_1.Upload className="h-4 w-4 mr-2"/>
                          Upload Permit
                        </button_1.Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Additional Certifications</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload any additional relevant certifications or qualifications.
                      </p>
                      <div className="flex gap-3">
                        <button_1.Button onClick={handleDocumentUpload}>
                          <lucide_react_1.Upload className="h-4 w-4 mr-2"/>
                          Upload Document
                        </button_1.Button>
                      </div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
              
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Verification Levels</card_1.CardTitle>
                  <card_1.CardDescription>Understand the verification tiers and their benefits</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <badge_1.Badge className="bg-slate-200 text-slate-800 py-1 px-2">Basic</badge_1.Badge>
                      <div>
                        <h3 className="font-medium">Basic Verification</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Email and phone number verification. Limited trust indicators.
                        </p>
                        <ul className="text-sm text-gray-600 mt-2 list-disc pl-5 space-y-1">
                          <li>Identity verification</li>
                          <li>Basic listing privileges</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <badge_1.Badge className="bg-[#C0C0C0] text-gray-800 py-1 px-2">Silver</badge_1.Badge>
                      <div>
                        <h3 className="font-medium">Silver Verification</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Government ID verification and at least 5 verified property transactions.
                        </p>
                        <ul className="text-sm text-gray-600 mt-2 list-disc pl-5 space-y-1">
                          <li>Silver verification badge</li>
                          <li>Increased visibility in search results</li>
                          <li>Access to premium leads</li>
                        </ul>
                        <div className="mt-2">
                          <button_1.Button variant="outline" className="text-xs h-7" onClick={claimVerification}>
                            Current Level
                          </button_1.Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <badge_1.Badge className="bg-[#FFD700] text-amber-800 py-1 px-2">Gold</badge_1.Badge>
                      <div>
                        <h3 className="font-medium">Gold Verification</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Professional license verification, 10+ transactions, and 4.5+ star rating.
                        </p>
                        <ul className="text-sm text-gray-600 mt-2 list-disc pl-5 space-y-1">
                          <li>Gold verification badge</li>
                          <li>Top placement in search results</li>
                          <li>Featured agent status</li>
                          <li>Dedicated account manager</li>
                        </ul>
                        <div className="mt-2">
                          <button_1.Button size="sm" onClick={claimVerification}>
                            Claim Gold Status
                          </button_1.Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <badge_1.Badge className="bg-black text-white py-1 px-2">Platinum</badge_1.Badge>
                      <div>
                        <h3 className="font-medium">Platinum Verification</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Full professional verification, 25+ transactions, 4.8+ star rating, and certified courses completion.
                        </p>
                        <ul className="text-sm text-gray-600 mt-2 list-disc pl-5 space-y-1">
                          <li>Platinum verification badge</li>
                          <li>VIP status on the platform</li>
                          <li>Access to high-net-worth client network</li>
                          <li>Reduced commission rates</li>
                          <li>Featured in marketing materials</li>
                        </ul>
                        <div className="mt-2">
                          <button_1.Button variant="outline" size="sm" disabled>
                            Complete Gold Requirements First
                          </button_1.Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>
            
            <tabs_1.TabsContent value="education" className="space-y-6">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Educational Courses</card_1.CardTitle>
                  <card_1.CardDescription>Enhance your knowledge and earn certification badges</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="grid gap-6">
                    <div className="border rounded-md overflow-hidden">
                      <div className="grid md:grid-cols-3">
                        <div className="bg-[#2C5282] text-white p-6 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-xl">Ethical Real Estate Practices</h3>
                            <p className="mt-2 text-white/80 text-sm">
                              Learn the ethical standards for real estate in Kenya and how to apply them.
                            </p>
                          </div>
                          <div className="mt-4">
                            <badge_1.Badge className="bg-white text-[#2C5282]">
                              <lucide_react_1.Award className="h-3 w-3 mr-1"/> +25 Trust Points
                            </badge_1.Badge>
                          </div>
                        </div>
                        <div className="col-span-2 p-6">
                          <div className="flex justify-between mb-4">
                            <div>
                              <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <lucide_react_1.Calendar className="h-4 w-4 mr-1"/> 4 weeks
                                </span>
                                <span className="flex items-center">
                                  <lucide_react_1.FileText className="h-4 w-4 mr-1"/> 6 modules
                                </span>
                                <span className="flex items-center">
                                  <lucide_react_1.User className="h-4 w-4 mr-1"/> Expert instructor
                                </span>
                              </div>
                            </div>
                            <badge_1.Badge className="bg-green-100 text-green-800">Completed</badge_1.Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            This course covers the ethical guidelines outlined by the Estate Agents Registration Board and international best practices for transparent property transactions.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex">
                                {Array(5).fill(0).map(function (_, i) { return (<lucide_react_1.Star key={i} className={"h-4 w-4 ".concat(i < 4 ? "text-yellow-400" : "text-gray-300")} fill={i < 4 ? "currentColor" : "none"}/>); })}
                              </div>
                              <span className="text-sm text-gray-500 ml-2">4.0 (28 ratings)</span>
                            </div>
                            <button_1.Button variant="outline" size="sm">
                              View Certificate
                            </button_1.Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      <div className="grid md:grid-cols-3">
                        <div className="bg-[#38A169] text-white p-6 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-xl">Property Valuation Fundamentals</h3>
                            <p className="mt-2 text-white/80 text-sm">
                              Master the art of accurate property valuation in the Kenyan market.
                            </p>
                          </div>
                          <div className="mt-4">
                            <badge_1.Badge className="bg-white text-[#38A169]">
                              <lucide_react_1.Award className="h-3 w-3 mr-1"/> +30 Trust Points
                            </badge_1.Badge>
                          </div>
                        </div>
                        <div className="col-span-2 p-6">
                          <div className="flex justify-between mb-4">
                            <div>
                              <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <lucide_react_1.Calendar className="h-4 w-4 mr-1"/> 6 weeks
                                </span>
                                <span className="flex items-center">
                                  <lucide_react_1.FileText className="h-4 w-4 mr-1"/> 8 modules
                                </span>
                                <span className="flex items-center">
                                  <lucide_react_1.User className="h-4 w-4 mr-1"/> ISK certified
                                </span>
                              </div>
                            </div>
                            <badge_1.Badge className="bg-green-100 text-green-800">Completed</badge_1.Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            Learn professional property valuation techniques including comparative market analysis, income approach, and cost approach valuation methods specific to Kenya's unique market conditions.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex">
                                {Array(5).fill(0).map(function (_, i) { return (<lucide_react_1.Star key={i} className={"h-4 w-4 ".concat(i < 5 ? "text-yellow-400" : "text-gray-300")} fill={i < 5 ? "currentColor" : "none"}/>); })}
                              </div>
                              <span className="text-sm text-gray-500 ml-2">4.8 (42 ratings)</span>
                            </div>
                            <button_1.Button variant="outline" size="sm">
                              View Certificate
                            </button_1.Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      <div className="grid md:grid-cols-3">
                        <div className="bg-amber-600 text-white p-6 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-xl">Land Title Verification</h3>
                            <p className="mt-2 text-white/80 text-sm">
                              Learn to navigate Kenya's land registration systems and verify authentic titles.
                            </p>
                          </div>
                          <div className="mt-4">
                            <badge_1.Badge className="bg-white text-amber-600">
                              <lucide_react_1.Award className="h-3 w-3 mr-1"/> +40 Trust Points
                            </badge_1.Badge>
                          </div>
                        </div>
                        <div className="col-span-2 p-6">
                          <div className="flex justify-between mb-4">
                            <div>
                              <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <lucide_react_1.Calendar className="h-4 w-4 mr-1"/> 8 weeks
                                </span>
                                <span className="flex items-center">
                                  <lucide_react_1.FileText className="h-4 w-4 mr-1"/> 10 modules
                                </span>
                                <span className="flex items-center">
                                  <lucide_react_1.Briefcase className="h-4 w-4 mr-1"/> Ministry certified
                                </span>
                              </div>
                            </div>
                            <badge_1.Badge className="bg-blue-100 text-blue-800">In Progress</badge_1.Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            This comprehensive course covers the Kenyan land registry system, title verification processes, and how to identify potentially fraudulent documentation through the ArdhiSasa platform.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <progress_1.Progress value={35} className="w-32 h-2 mr-2"/>
                              <span className="text-xs text-gray-500">35% complete</span>
                            </div>
                            <button_1.Button size="sm" onClick={function () { return startCourse("Land Title Verification"); }}>
                              Continue Learning
                            </button_1.Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden opacity-70">
                      <div className="grid md:grid-cols-3">
                        <div className="bg-purple-700 text-white p-6 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-xl">Digital Marketing for Real Estate</h3>
                            <p className="mt-2 text-white/80 text-sm">
                              Use digital tools to attract more clients and showcase properties effectively.
                            </p>
                          </div>
                          <div className="mt-4">
                            <badge_1.Badge className="bg-white text-purple-700">
                              <lucide_react_1.Award className="h-3 w-3 mr-1"/> +30 Trust Points
                            </badge_1.Badge>
                          </div>
                        </div>
                        <div className="col-span-2 p-6">
                          <div className="flex justify-between mb-4">
                            <div>
                              <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <lucide_react_1.Calendar className="h-4 w-4 mr-1"/> 5 weeks
                                </span>
                                <span className="flex items-center">
                                  <lucide_react_1.FileText className="h-4 w-4 mr-1"/> 6 modules
                                </span>
                                <span className="flex items-center">
                                  <lucide_react_1.User className="h-4 w-4 mr-1"/> Industry expert
                                </span>
                              </div>
                            </div>
                            <badge_1.Badge className="bg-gray-100 text-gray-800">Not Started</badge_1.Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            Learn to leverage social media, virtual tours, and online platforms to effectively market properties in Kenya's competitive real estate environment.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500">68 people enrolled</span>
                            </div>
                            <button_1.Button size="sm" onClick={function () { return startCourse("Digital Marketing for Real Estate"); }}>
                              Enroll Now
                            </button_1.Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>
            
            <tabs_1.TabsContent value="reviews" className="space-y-6">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Client Reviews & Feedback</card_1.CardTitle>
                  <card_1.CardDescription>What your clients are saying about you</card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-[#2C5282]">4.5</div>
                        <div className="flex mt-1">
                          {Array(5).fill(0).map(function (_, i) { return (<lucide_react_1.Star key={i} className={"h-4 w-4 ".concat(i < 4 ? "text-yellow-400" : "text-gray-300")} fill={i < 4 || i === 4 && 0.5 ? "currentColor" : "none"}/>); })}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">9 reviews</div>
                      </div>
                      
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-right mr-2">5 stars</span>
                          <div className="flex-1">
                            <progress_1.Progress value={66} className="h-2"/>
                          </div>
                          <span className="w-10 text-right ml-2 text-gray-500">6</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-right mr-2">4 stars</span>
                          <div className="flex-1">
                            <progress_1.Progress value={22} className="h-2"/>
                          </div>
                          <span className="w-10 text-right ml-2 text-gray-500">2</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-right mr-2">3 stars</span>
                          <div className="flex-1">
                            <progress_1.Progress value={0} className="h-2"/>
                          </div>
                          <span className="w-10 text-right ml-2 text-gray-500">0</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-right mr-2">2 stars</span>
                          <div className="flex-1">
                            <progress_1.Progress value={11} className="h-2"/>
                          </div>
                          <span className="w-10 text-right ml-2 text-gray-500">1</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-right mr-2">1 star</span>
                          <div className="flex-1">
                            <progress_1.Progress value={0} className="h-2"/>
                          </div>
                          <span className="w-10 text-right ml-2 text-gray-500">0</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <button_1.Button>Request Reviews</button_1.Button>
                      <p className="text-xs text-gray-500 mt-2">Send review requests to recent clients</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center text-[#2C5282] font-bold mr-3">
                            JN
                          </div>
                          <div>
                            <h4 className="font-medium">James Njoroge</h4>
                            <div className="flex items-center">
                              {Array(5).fill(0).map(function (_, i) { return (<lucide_react_1.Star key={i} className={"h-3 w-3 ".concat(i < 5 ? "text-yellow-400" : "text-gray-300")} fill={i < 5 ? "currentColor" : "none"}/>); })}
                              <span className="text-xs text-gray-500 ml-2">1 month ago</span>
                            </div>
                          </div>
                        </div>
                        <badge_1.Badge className="bg-green-100 text-green-800">Verified Transaction</badge_1.Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        "Excellent service from start to finish. Very knowledgeable about the Kileleshwa area and helped me navigate the documentation process. Would definitely recommend!"
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-xs text-gray-500">Property: Modern Apartment in Kileleshwa</div>
                        <button_1.Button variant="ghost" size="sm" className="h-7 text-gray-500">
                          <lucide_react_1.ThumbsUp className="h-3 w-3 mr-1"/> Helpful (3)
                        </button_1.Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center text-[#2C5282] font-bold mr-3">
                            WK
                          </div>
                          <div>
                            <h4 className="font-medium">Wangari Kamau</h4>
                            <div className="flex items-center">
                              {Array(5).fill(0).map(function (_, i) { return (<lucide_react_1.Star key={i} className={"h-3 w-3 ".concat(i < 2 ? "text-yellow-400" : "text-gray-300")} fill={i < 2 ? "currentColor" : "none"}/>); })}
                              <span className="text-xs text-gray-500 ml-2">2 months ago</span>
                            </div>
                          </div>
                        </div>
                        <badge_1.Badge className="bg-green-100 text-green-800">Verified Transaction</badge_1.Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        "Disappointing experience. Agent was often late for viewings and slow to respond to queries. The property information wasn't as accurate as advertised."
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-xs text-gray-500">Property: Family Home in Karen</div>
                        <button_1.Button variant="ghost" size="sm" className="h-7 text-gray-500">
                          <lucide_react_1.ThumbsUp className="h-3 w-3 mr-1"/> Helpful (1)
                        </button_1.Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center text-[#2C5282] font-bold mr-3">
                            MO
                          </div>
                          <div>
                            <h4 className="font-medium">Michael Odhiambo</h4>
                            <div className="flex items-center">
                              {Array(5).fill(0).map(function (_, i) { return (<lucide_react_1.Star key={i} className={"h-3 w-3 ".concat(i < 5 ? "text-yellow-400" : "text-gray-300")} fill={i < 5 ? "currentColor" : "none"}/>); })}
                              <span className="text-xs text-gray-500 ml-2">3 months ago</span>
                            </div>
                          </div>
                        </div>
                        <badge_1.Badge className="bg-green-100 text-green-800">Verified Transaction</badge_1.Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        "Very professional and thorough. Helped me secure a great property in Westlands and handled all the verification processes efficiently. I particularly appreciated the attention to detail with the paperwork and title verification."
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-xs text-gray-500">Property: Office Space in Westlands</div>
                        <button_1.Button variant="ghost" size="sm" className="h-7 text-gray-500">
                          <lucide_react_1.ThumbsUp className="h-3 w-3 mr-1"/> Helpful (5)
                        </button_1.Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <button_1.Button variant="outline">View All Reviews</button_1.Button>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </div>
        
        <div className="space-y-6">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Next Level Requirements</card_1.CardTitle>
              <card_1.CardDescription>What you need to reach Gold status</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3">
                    2/3
                  </div>
                  <div>
                    <p className="font-medium">Complete 3 Educational Courses</p>
                    <progress_1.Progress value={66} className="h-1.5 mt-1 mb-1 w-32"/>
                    <p className="text-xs text-gray-500">1 more course needed</p>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3">
                    1/3
                  </div>
                  <div>
                    <p className="font-medium">Upload Professional Certifications</p>
                    <progress_1.Progress value={33} className="h-1.5 mt-1 mb-1 w-32"/>
                    <p className="text-xs text-gray-500">2 more certifications needed</p>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3">
                    5/10
                  </div>
                  <div>
                    <p className="font-medium">Complete 10 Verified Transactions</p>
                    <progress_1.Progress value={50} className="h-1.5 mt-1 mb-1 w-32"/>
                    <p className="text-xs text-gray-500">5 more transactions needed</p>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 flex items-center justify-center mr-3">
                    <lucide_react_1.Check className="h-3 w-3"/>
                  </div>
                  <div>
                    <p className="font-medium">Maintain 95%+ Response Rate</p>
                    <progress_1.Progress value={100} className="h-1.5 mt-1 mb-1 w-32"/>
                    <p className="text-xs text-gray-500">Current: 95% (Requirement met)</p>
                  </div>
                </li>
              </ul>
              <button_1.Button className="w-full mt-6">Upgrade to Gold</button_1.Button>
            </card_1.CardContent>
          </card_1.Card>
          
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Reputation Benefits</card_1.CardTitle>
              <card_1.CardDescription>Why building trust matters</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <ul className="space-y-3">
                <li className="flex">
                  <lucide_react_1.ThumbsUp className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5"/>
                  <span className="text-sm">Higher conversion rates for your listings</span>
                </li>
                <li className="flex">
                  <lucide_react_1.ThumbsUp className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5"/>
                  <span className="text-sm">Command premium pricing for your services</span>
                </li>
                <li className="flex">
                  <lucide_react_1.ThumbsUp className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5"/>
                  <span className="text-sm">Access to exclusive client opportunities</span>
                </li>
                <li className="flex">
                  <lucide_react_1.ThumbsUp className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5"/>
                  <span className="text-sm">Automatic placement in featured sections</span>
                </li>
                <li className="flex">
                  <lucide_react_1.ThumbsUp className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5"/>
                  <span className="text-sm">Reduced platform fees and commissions</span>
                </li>
              </ul>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-[#2C5282] font-medium">Agents with Gold status earn 48% more than those with Basic status</p>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </div>);
}
