import React, { useState, useCallback, useMemo } from 'react'
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  MapPin, 
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Flag,
  Star,
  Clock,
  Filter,
  Search,
  Plus,
  Share2,
  Heart,
  BarChart3
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { useToast } from '../hooks/use-toast'

interface CommunityReport {
  id: string;
  propertyId: string;
  propertyAddress: string;
  reportType: 'review' | 'warning' | 'recommendation' | 'question';
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    trustScore: number;
    verifiedResident: boolean;
  };
  location: string;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  replies: number;
  views: number;
  tags: string[];
  verified: boolean;
  helpful: boolean;
  userVote?: 'up' | 'down';
}

interface CommunityInsight {
  id: string;
  type: 'trend' | 'alert' | 'recommendation';
  title: string;
  description: string;
  location: string;
  confidence: number;
  reportCount: number;
  lastUpdated: Date;
  severity: 'low' | 'medium' | 'high';
}

interface NewReportForm {
  propertyAddress: string;
  reportType: string;
  title: string;
  content: string;
  tags: string[];
  anonymous: boolean;
}

// Mock data
const mockReports: CommunityReport[] = [
  {
    id: 'rep-1',
    propertyId: 'prop-123',
    propertyAddress: '123 Westlands Road, Nairobi',
    reportType: 'warning',
    title: 'Flooding issues during rainy season',
    content: 'This area experiences significant flooding during heavy rains. The drainage system is inadequate and water can reach up to 2 feet in some areas. Consider this if buying property here.',
    author: {
      id: 'user-1',
      name: 'Mary Wanjiku',
      trustScore: 87,
      verifiedResident: true
    },
    location: 'Westlands, Nairobi',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    upvotes: 23,
    downvotes: 2,
    replies: 8,
    views: 156,
    tags: ['flooding', 'drainage', 'weather'],
    verified: true,
    helpful: true
  },
  {
    id: 'rep-2',
    propertyId: 'prop-456',
    propertyAddress: '456 Karen Close, Nairobi',
    reportType: 'review',
    title: 'Excellent neighborhood for families',
    content: 'Great area with good schools nearby, safe streets, and friendly neighbors. The Karen Hospital is just 5 minutes away. Property values have been stable and appreciating slowly.',
    author: {
      id: 'user-2',
      name: 'John Mwangi',
      trustScore: 92,
      verifiedResident: true
    },
    location: 'Karen, Nairobi',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    upvotes: 45,
    downvotes: 1,
    replies: 12,
    views: 234,
    tags: ['family-friendly', 'schools', 'safety', 'healthcare'],
    verified: true,
    helpful: true
  },
  {
    id: 'rep-3',
    propertyId: 'prop-789',
    propertyAddress: '789 Kilimani Street, Nairobi',
    reportType: 'question',
    title: 'Anyone know about the new development plans?',
    content: 'I heard there are plans for a new shopping mall in this area. Does anyone have more information about this? Will it affect property values?',
    author: {
      id: 'user-3',
      name: 'Grace Muthoni',
      trustScore: 76,
      verifiedResident: false
    },
    location: 'Kilimani, Nairobi',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    upvotes: 8,
    downvotes: 0,
    replies: 5,
    views: 67,
    tags: ['development', 'shopping', 'property-value'],
    verified: false,
    helpful: false
  }
];

const mockInsights: CommunityInsight[] = [
  {
    id: 'ins-1',
    type: 'alert',
    title: 'Increased fraud reports in Westlands area',
    description: 'Multiple community members have reported suspicious property listings and fake documents in the Westlands area. Exercise extra caution.',
    location: 'Westlands, Nairobi',
    confidence: 89,
    reportCount: 12,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 6),
    severity: 'high'
  },
  {
    id: 'ins-2',
    type: 'trend',
    title: 'Rising property values in Karen',
    description: 'Community reports indicate property values in Karen have increased by approximately 8% over the past 6 months.',
    location: 'Karen, Nairobi',
    confidence: 76,
    reportCount: 28,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    severity: 'medium'
  },
  {
    id: 'ins-3',
    type: 'recommendation',
    title: 'Best time to buy in Kilimani',
    description: 'Based on community insights, the current market conditions in Kilimani are favorable for buyers, with several motivated sellers.',
    location: 'Kilimani, Nairobi',
    confidence: 82,
    reportCount: 15,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    severity: 'low'
  }
];

export default function CommunityIntelligence() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'reports' | 'insights' | 'contribute'>('reports');
  const [reports, setReports] = useState(mockReports);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  
  const [newReportForm, setNewReportForm] = useState<NewReportForm>({
    propertyAddress: '',
    reportType: '',
    title: '',
    content: '',
    tags: [],
    anonymous: false
  });

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = !searchQuery || 
        report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || report.reportType === filterType;
      const matchesLocation = filterLocation === 'all' || report.location.includes(filterLocation);
      
      return matchesSearch && matchesType && matchesLocation;
    });
  }, [reports, searchQuery, filterType, filterLocation]);

  const updateNewReportForm = useCallback(<K extends keyof NewReportForm>(
    key: K,
    value: NewReportForm[K]
  ) => {
    setNewReportForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleVote = useCallback((reportId: string, voteType: 'up' | 'down') => {
    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        const currentVote = report.userVote;
        let newUpvotes = report.upvotes;
        let newDownvotes = report.downvotes;
        let newUserVote: 'up' | 'down' | undefined = voteType;

        // Remove previous vote if exists
        if (currentVote === 'up') newUpvotes--;
        if (currentVote === 'down') newDownvotes--;

        // Add new vote or remove if same
        if (currentVote === voteType) {
          newUserVote = undefined; // Remove vote
        } else {
          if (voteType === 'up') newUpvotes++;
          if (voteType === 'down') newDownvotes++;
        }

        return {
          ...report,
          upvotes: newUpvotes,
          downvotes: newDownvotes,
          userVote: newUserVote
        };
      }
      return report;
    }));
  }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!newReportForm.propertyAddress || !newReportForm.reportType || !newReportForm.title || !newReportForm.content) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Report submitted successfully',
        description: 'Your community report has been submitted and will be reviewed.',
      });

      setNewReportForm({
        propertyAddress: '',
        reportType: '',
        title: '',
        content: '',
        tags: [],
        anonymous: false
      });
    } catch (error) {
      toast({
        title: 'Failed to submit report',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  }, [newReportForm, toast]);

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'review':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'recommendation':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'question':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'recommendation':
        return <Star className="w-5 h-5 text-blue-500" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            Community Intelligence
          </h1>
          <p className="text-muted-foreground">
            Leverage community insights for better property decisions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <Button
            variant={activeTab === 'reports' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('reports')}
          >
            Community Reports
          </Button>
          <Button
            variant={activeTab === 'insights' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('insights')}
          >
            Market Insights
          </Button>
          <Button
            variant={activeTab === 'contribute' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('contribute')}
          >
            Contribute
          </Button>
        </div>

        {activeTab === 'reports' && (
          <div>
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="review">Reviews</SelectItem>
                      <SelectItem value="warning">Warnings</SelectItem>
                      <SelectItem value="recommendation">Recommendations</SelectItem>
                      <SelectItem value="question">Questions</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Westlands">Westlands</SelectItem>
                      <SelectItem value="Karen">Karen</SelectItem>
                      <SelectItem value="Kilimani">Kilimani</SelectItem>
                      <SelectItem value="Lavington">Lavington</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-full">
                        {getReportTypeIcon(report.reportType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{report.author.name}</span>
                              {report.author.verifiedResident && (
                                <Badge variant="outline" className="text-xs">
                                  Verified Resident
                                </Badge>
                              )}
                              <span>Trust Score: {report.author.trustScore}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(report.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {report.reportType}
                            </Badge>
                            {report.verified && (
                              <Badge className="bg-green-100 text-green-800">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground mb-2">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {report.propertyAddress}
                          </p>
                          <p className="text-gray-700">{report.content}</p>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {report.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleVote(report.id, 'up')}
                              className={`flex items-center gap-1 text-sm transition-colors ${
                                report.userVote === 'up' ? 'text-green-600' : 'text-muted-foreground hover:text-green-600'
                              }`}
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span>{report.upvotes}</span>
                            </button>
                            
                            <button
                              onClick={() => handleVote(report.id, 'down')}
                              className={`flex items-center gap-1 text-sm transition-colors ${
                                report.userVote === 'down' ? 'text-red-600' : 'text-muted-foreground hover:text-red-600'
                              }`}
                            >
                              <ThumbsDown className="w-4 h-4" />
                              <span>{report.downvotes}</span>
                            </button>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MessageSquare className="w-4 h-4" />
                              <span>{report.replies}</span>
                            </div>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Eye className="w-4 h-4" />
                              <span>{report.views}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Flag className="w-4 h-4 mr-2" />
                              Report
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            {mockInsights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-muted rounded-full">
                      {getInsightIcon(insight.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{insight.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span>{insight.location}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(insight.lastUpdated)}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {insight.type}
                        </Badge>
                      </div>

                      <p className="text-gray-700 mb-4">{insight.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <BarChart3 className="w-4 h-4 text-blue-500" />
                            <span>Confidence: {insight.confidence}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-green-500" />
                            <span>{insight.reportCount} reports</span>
                          </div>
                        </div>

                        <Badge className={
                          insight.severity === 'high' ? 'bg-red-100 text-red-800' :
                          insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {insight.severity} priority
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'contribute' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Share Your Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="property-address">Property Address *</Label>
                <Textarea
                  id="property-address"
                  placeholder="Enter the property address you want to report about"
                  value={newReportForm.propertyAddress}
                  onChange={(e) => updateNewReportForm('propertyAddress', e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="report-type">Report Type *</Label>
                <Select
                  value={newReportForm.reportType}
                  onValueChange={(value) => updateNewReportForm('reportType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="review">Property Review</SelectItem>
                    <SelectItem value="warning">Warning/Alert</SelectItem>
                    <SelectItem value="recommendation">Recommendation</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief title for your report"
                  value={newReportForm.title}
                  onChange={(e) => updateNewReportForm('title', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Share your experience, observations, or questions about this property or area..."
                  value={newReportForm.content}
                  onChange={(e) => updateNewReportForm('content', e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={newReportForm.anonymous}
                  onChange={(e) => updateNewReportForm('anonymous', e.target.checked)}
                />
                <Label htmlFor="anonymous" className="text-sm">
                  Post anonymously
                </Label>
              </div>

              <Button onClick={handleSubmitReport} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Submit Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}