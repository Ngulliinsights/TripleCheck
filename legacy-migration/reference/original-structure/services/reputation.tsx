import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Shield, 
  Star, 
  ThumbsUp, 
  Check, 
  ExternalLink, 
  User, 
  FileText, 
  Upload,
  Calendar,
  Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReputationPage() {
  const { toast } = useToast();
  const [reputationScore, setReputationScore] = useState(78);
  
  // Simulated user reputation data
  const [reputationData, setReputationData] = useState({
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
  });

  const handleDocumentUpload = () => {
    toast({
      title: "Document submitted",
      description: "Your certification will be reviewed within 48 hours.",
    });
  };

  const startCourse = (courseName: string) => {
    toast({
      title: `Started: ${courseName}`,
      description: "Course content is now available in your learning dashboard.",
    });
  };

  const claimVerification = () => {
    toast({
      title: "Verification request submitted",
      description: "Our team will review your credentials within 48 hours.",
    });
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-[#2C5282]">Build Your Reputation</h1>
      <p className="text-lg mb-8">
        Enhance your trustworthiness in the Kenyan real estate market. 
        A strong reputation leads to faster transactions and premium clients.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reputation Overview</CardTitle>
                  <CardDescription>Your current standing in the TripleCheck ecosystem</CardDescription>
                </CardHeader>
                <CardContent>
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
                    <Progress value={reputationData.reputationScore} className="h-2" />
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
                        <Badge className="flex items-center gap-1 justify-center py-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200">
                          <Shield className="h-3 w-3" /> Verified
                        </Badge>
                        <Badge className="flex items-center gap-1 justify-center py-1.5 bg-green-100 text-green-800 hover:bg-green-200">
                          <Star className="h-3 w-3" /> Top Rated
                        </Badge>
                        <Badge className="flex items-center gap-1 justify-center py-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200">
                          <Award className="h-3 w-3" /> Licensed
                        </Badge>
                        <Badge className="flex items-center gap-1 justify-center py-1.5 bg-purple-100 text-purple-800 hover:bg-purple-200">
                          <ThumbsUp className="h-3 w-3" /> Responsive
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Reputation Growth</h3>
                    <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center">
                      <p className="text-gray-500">Reputation growth chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Reputation Building Tips</CardTitle>
                  <CardDescription>Follow these recommendations to enhance your standing</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex">
                      <Check className="text-green-500 h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Respond Promptly:</strong>
                        <p className="text-gray-600 text-sm">Reply to inquiries within 24 hours to maintain a high response rate</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-green-500 h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Verify All Listings:</strong>
                        <p className="text-gray-600 text-sm">Submit proper documentation for all properties to earn the Verified Listing badge</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-green-500 h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Complete Educational Courses:</strong>
                        <p className="text-gray-600 text-sm">Finish at least 3 courses to earn the Educated Agent badge</p>
                      </div>
                    </li>
                    <li className="flex">
                      <Check className="text-green-500 h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Upload Certifications:</strong>
                        <p className="text-gray-600 text-sm">Share your real estate credentials to boost your verification level</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="certifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Certifications</CardTitle>
                  <CardDescription>Upload your real estate credentials and licenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Estate Agents Registration Board (EARB) License</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload your active EARB license to verify your credentials as a registered estate agent in Kenya.
                      </p>
                      <div className="flex gap-3">
                        <Button onClick={handleDocumentUpload}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload License
                        </Button>
                        <Button variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          EARB Website
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Institution of Surveyors of Kenya (ISK) Membership</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Provide proof of your ISK membership to demonstrate professional standing.
                      </p>
                      <div className="flex gap-3">
                        <Button onClick={handleDocumentUpload}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Certificate
                        </Button>
                        <Button variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          ISK Website
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Real Estate Business Permit</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload your current business permit to verify your official status.
                      </p>
                      <div className="flex gap-3">
                        <Button onClick={handleDocumentUpload}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Permit
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Additional Certifications</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload any additional relevant certifications or qualifications.
                      </p>
                      <div className="flex gap-3">
                        <Button onClick={handleDocumentUpload}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Verification Levels</CardTitle>
                  <CardDescription>Understand the verification tiers and their benefits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <Badge className="bg-slate-200 text-slate-800 py-1 px-2">Basic</Badge>
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
                      <Badge className="bg-[#C0C0C0] text-gray-800 py-1 px-2">Silver</Badge>
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
                          <Button variant="outline" className="text-xs h-7" onClick={claimVerification}>
                            Current Level
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <Badge className="bg-[#FFD700] text-amber-800 py-1 px-2">Gold</Badge>
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
                          <Button size="sm" onClick={claimVerification}>
                            Claim Gold Status
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <Badge className="bg-black text-white py-1 px-2">Platinum</Badge>
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
                          <Button variant="outline" size="sm" disabled>
                            Complete Gold Requirements First
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="education" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Educational Courses</CardTitle>
                  <CardDescription>Enhance your knowledge and earn certification badges</CardDescription>
                </CardHeader>
                <CardContent>
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
                            <Badge className="bg-white text-[#2C5282]">
                              <Award className="h-3 w-3 mr-1" /> +25 Trust Points
                            </Badge>
                          </div>
                        </div>
                        <div className="col-span-2 p-6">
                          <div className="flex justify-between mb-4">
                            <div>
                              <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" /> 4 weeks
                                </span>
                                <span className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1" /> 6 modules
                                </span>
                                <span className="flex items-center">
                                  <User className="h-4 w-4 mr-1" /> Expert instructor
                                </span>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            This course covers the ethical guidelines outlined by the Estate Agents Registration Board and international best practices for transparent property transactions.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex">
                                {Array(5).fill(0).map((_, i) => (
                                  <Star key={i} className={`h-4 w-4 ${i < 4 ? "text-yellow-400" : "text-gray-300"}`} fill={i < 4 ? "currentColor" : "none"} />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500 ml-2">4.0 (28 ratings)</span>
                            </div>
                            <Button variant="outline" size="sm">
                              View Certificate
                            </Button>
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
                            <Badge className="bg-white text-[#38A169]">
                              <Award className="h-3 w-3 mr-1" /> +30 Trust Points
                            </Badge>
                          </div>
                        </div>
                        <div className="col-span-2 p-6">
                          <div className="flex justify-between mb-4">
                            <div>
                              <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" /> 6 weeks
                                </span>
                                <span className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1" /> 8 modules
                                </span>
                                <span className="flex items-center">
                                  <User className="h-4 w-4 mr-1" /> ISK certified
                                </span>
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            Learn professional property valuation techniques including comparative market analysis, income approach, and cost approach valuation methods specific to Kenya's unique market conditions.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex">
                                {Array(5).fill(0).map((_, i) => (
                                  <Star key={i} className={`h-4 w-4 ${i < 5 ? "text-yellow-400" : "text-gray-300"}`} fill={i < 5 ? "currentColor" : "none"} />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500 ml-2">4.8 (42 ratings)</span>
                            </div>
                            <Button variant="outline" size="sm">
                              View Certificate
                            </Button>
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
                            <Badge className="bg-white text-amber-600">
                              <Award className="h-3 w-3 mr-1" /> +40 Trust Points
                            </Badge>
                          </div>
                        </div>
                        <div className="col-span-2 p-6">
                          <div className="flex justify-between mb-4">
                            <div>
                              <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" /> 8 weeks
                                </span>
                                <span className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1" /> 10 modules
                                </span>
                                <span className="flex items-center">
                                  <Briefcase className="h-4 w-4 mr-1" /> Ministry certified
                                </span>
                              </div>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            This comprehensive course covers the Kenyan land registry system, title verification processes, and how to identify potentially fraudulent documentation through the ArdhiSasa platform.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Progress value={35} className="w-32 h-2 mr-2" />
                              <span className="text-xs text-gray-500">35% complete</span>
                            </div>
                            <Button size="sm" onClick={() => startCourse("Land Title Verification")}>
                              Continue Learning
                            </Button>
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
                            <Badge className="bg-white text-purple-700">
                              <Award className="h-3 w-3 mr-1" /> +30 Trust Points
                            </Badge>
                          </div>
                        </div>
                        <div className="col-span-2 p-6">
                          <div className="flex justify-between mb-4">
                            <div>
                              <div className="flex items-center text-sm text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" /> 5 weeks
                                </span>
                                <span className="flex items-center">
                                  <FileText className="h-4 w-4 mr-1" /> 6 modules
                                </span>
                                <span className="flex items-center">
                                  <User className="h-4 w-4 mr-1" /> Industry expert
                                </span>
                              </div>
                            </div>
                            <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            Learn to leverage social media, virtual tours, and online platforms to effectively market properties in Kenya's competitive real estate environment.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500">68 people enrolled</span>
                            </div>
                            <Button size="sm" onClick={() => startCourse("Digital Marketing for Real Estate")}>
                              Enroll Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Reviews & Feedback</CardTitle>
                  <CardDescription>What your clients are saying about you</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-[#2C5282]">4.5</div>
                        <div className="flex mt-1">
                          {Array(5).fill(0).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < 4 ? "text-yellow-400" : "text-gray-300"}`} fill={i < 4 || i === 4 && 0.5 ? "currentColor" : "none"} />
                          ))}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">9 reviews</div>
                      </div>
                      
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-right mr-2">5 stars</span>
                          <div className="flex-1">
                            <Progress value={66} className="h-2" />
                          </div>
                          <span className="w-10 text-right ml-2 text-gray-500">6</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-right mr-2">4 stars</span>
                          <div className="flex-1">
                            <Progress value={22} className="h-2" />
                          </div>
                          <span className="w-10 text-right ml-2 text-gray-500">2</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-right mr-2">3 stars</span>
                          <div className="flex-1">
                            <Progress value={0} className="h-2" />
                          </div>
                          <span className="w-10 text-right ml-2 text-gray-500">0</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-right mr-2">2 stars</span>
                          <div className="flex-1">
                            <Progress value={11} className="h-2" />
                          </div>
                          <span className="w-10 text-right ml-2 text-gray-500">1</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-20 text-right mr-2">1 star</span>
                          <div className="flex-1">
                            <Progress value={0} className="h-2" />
                          </div>
                          <span className="w-10 text-right ml-2 text-gray-500">0</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <Button>Request Reviews</Button>
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
                              {Array(5).fill(0).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < 5 ? "text-yellow-400" : "text-gray-300"}`} fill={i < 5 ? "currentColor" : "none"} />
                              ))}
                              <span className="text-xs text-gray-500 ml-2">1 month ago</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Verified Transaction</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        "Excellent service from start to finish. Very knowledgeable about the Kileleshwa area and helped me navigate the documentation process. Would definitely recommend!"
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-xs text-gray-500">Property: Modern Apartment in Kileleshwa</div>
                        <Button variant="ghost" size="sm" className="h-7 text-gray-500">
                          <ThumbsUp className="h-3 w-3 mr-1" /> Helpful (3)
                        </Button>
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
                              {Array(5).fill(0).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < 2 ? "text-yellow-400" : "text-gray-300"}`} fill={i < 2 ? "currentColor" : "none"} />
                              ))}
                              <span className="text-xs text-gray-500 ml-2">2 months ago</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Verified Transaction</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        "Disappointing experience. Agent was often late for viewings and slow to respond to queries. The property information wasn't as accurate as advertised."
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-xs text-gray-500">Property: Family Home in Karen</div>
                        <Button variant="ghost" size="sm" className="h-7 text-gray-500">
                          <ThumbsUp className="h-3 w-3 mr-1" /> Helpful (1)
                        </Button>
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
                              {Array(5).fill(0).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < 5 ? "text-yellow-400" : "text-gray-300"}`} fill={i < 5 ? "currentColor" : "none"} />
                              ))}
                              <span className="text-xs text-gray-500 ml-2">3 months ago</span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Verified Transaction</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        "Very professional and thorough. Helped me secure a great property in Westlands and handled all the verification processes efficiently. I particularly appreciated the attention to detail with the paperwork and title verification."
                      </p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-xs text-gray-500">Property: Office Space in Westlands</div>
                        <Button variant="ghost" size="sm" className="h-7 text-gray-500">
                          <ThumbsUp className="h-3 w-3 mr-1" /> Helpful (5)
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-center">
                    <Button variant="outline">View All Reviews</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Next Level Requirements</CardTitle>
              <CardDescription>What you need to reach Gold status</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3">
                    2/3
                  </div>
                  <div>
                    <p className="font-medium">Complete 3 Educational Courses</p>
                    <Progress value={66} className="h-1.5 mt-1 mb-1 w-32" />
                    <p className="text-xs text-gray-500">1 more course needed</p>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3">
                    1/3
                  </div>
                  <div>
                    <p className="font-medium">Upload Professional Certifications</p>
                    <Progress value={33} className="h-1.5 mt-1 mb-1 w-32" />
                    <p className="text-xs text-gray-500">2 more certifications needed</p>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3">
                    5/10
                  </div>
                  <div>
                    <p className="font-medium">Complete 10 Verified Transactions</p>
                    <Progress value={50} className="h-1.5 mt-1 mb-1 w-32" />
                    <p className="text-xs text-gray-500">5 more transactions needed</p>
                  </div>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 flex items-center justify-center mr-3">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="font-medium">Maintain 95%+ Response Rate</p>
                    <Progress value={100} className="h-1.5 mt-1 mb-1 w-32" />
                    <p className="text-xs text-gray-500">Current: 95% (Requirement met)</p>
                  </div>
                </li>
              </ul>
              <Button className="w-full mt-6">Upgrade to Gold</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Reputation Benefits</CardTitle>
              <CardDescription>Why building trust matters</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex">
                  <ThumbsUp className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Higher conversion rates for your listings</span>
                </li>
                <li className="flex">
                  <ThumbsUp className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Command premium pricing for your services</span>
                </li>
                <li className="flex">
                  <ThumbsUp className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Access to exclusive client opportunities</span>
                </li>
                <li className="flex">
                  <ThumbsUp className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Automatic placement in featured sections</span>
                </li>
                <li className="flex">
                  <ThumbsUp className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Reduced platform fees and commissions</span>
                </li>
              </ul>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-[#2C5282] font-medium">Agents with Gold status earn 48% more than those with Basic status</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}