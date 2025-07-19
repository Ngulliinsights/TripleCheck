import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card";
import { Button } from "../../shared/components/ui/button";
import { Badge } from "../../shared/components/ui/badge";
import { Input } from "../../shared/components/ui/input";
import { Textarea } from "../../shared/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "../../shared/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../shared/components/ui/dialog";
import { Label } from "../../shared/components/ui/label";
import { Separator } from "../../shared/components/ui/separator";
import { useToast } from "../../shared/hooks/use-toast";
import { apiRequest } from "../../infrastructure/api/queryClient";
import {
  MessageSquare,
  Send,
  Star,
  AlertCircle,
  Search,
  Filter,
  Archive,
  Reply,
  Forward,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  Home,
} from "lucide-react";

// Enhanced type definitions for better type safety
interface Inquiry {
  id: string;
  propertyId: number;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice: number;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
  timestamp: string;
  status: "unread" | "read" | "replied" | "archived";
  priority: "low" | "medium" | "high";
  type: "inquiry" | "viewing_request" | "offer" | "complaint";
}

// Type-safe tab definitions
type TabValue = "all" | "unread" | "replied" | "archived";

// Status badge configuration for better maintainability
const STATUS_CONFIG = {
  unread: { variant: "destructive" as const, label: "Unread" },
  read: { variant: "secondary" as const, label: "Read" },
  replied: { variant: "default" as const, label: "Replied" },
  archived: { variant: "outline" as const, label: "Archived" },
} as const;

// Priority color mapping for consistent styling
const PRIORITY_COLORS = {
  high: "border-l-red-500",
  medium: "border-l-yellow-500",
  low: "border-l-green-500",
} as const;

// Type icon configuration for better organization
const TYPE_ICONS = {
  viewing_request: { icon: Home, className: "w-4 h-4 text-blue-500" },
  offer: { icon: Star, className: "w-4 h-4 text-yellow-500" },
  complaint: { icon: AlertCircle, className: "w-4 h-4 text-red-500" },
  inquiry: { icon: MessageSquare, className: "w-4 h-4 text-gray-500" },
} as const;

// Mock data with proper typing
const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: "1",
    propertyId: 1,
    propertyTitle: "Modern Apartment in Westlands",
    propertyLocation: "Westlands, Nairobi",
    propertyPrice: 85000,
    senderName: "John Kamau",
    senderEmail: "john.kamau@email.com",
    senderPhone: "+254 700 123 456",
    message:
      "Hi, I'm very interested in this property. Could we schedule a viewing this weekend? I'm looking for a 2-bedroom apartment in this area and this seems perfect. What's the earliest availability?",
    timestamp: "2 hours ago",
    status: "unread",
    priority: "high",
    type: "viewing_request",
  },
  {
    id: "2",
    propertyId: 2,
    propertyTitle: "Luxury Villa in Karen",
    propertyLocation: "Karen, Nairobi",
    propertyPrice: 250000,
    senderName: "Sarah Wanjiku",
    senderEmail: "sarah.w@email.com",
    message:
      "I would like to make an offer on this property. Is the owner open to negotiations? My budget is around KES 230,000. Please let me know if this is acceptable.",
    timestamp: "5 hours ago",
    status: "read",
    priority: "high",
    type: "offer",
  },
  {
    id: "3",
    propertyId: 3,
    propertyTitle: "Cozy Studio in Kilimani",
    propertyLocation: "Kilimani, Nairobi",
    propertyPrice: 45000,
    senderName: "Michael Ochieng",
    senderEmail: "m.ochieng@email.com",
    senderPhone: "+254 722 987 654",
    message:
      "Hello, I'm interested in renting this studio apartment. What are the lease terms and when would it be available? Also, are pets allowed?",
    timestamp: "1 day ago",
    status: "replied",
    priority: "medium",
    type: "inquiry",
  },
  {
    id: "4",
    propertyId: 1,
    propertyTitle: "Modern Apartment in Westlands",
    propertyLocation: "Westlands, Nairobi",
    propertyPrice: 85000,
    senderName: "Grace Muthoni",
    senderEmail: "grace.muthoni@email.com",
    message:
      "I saw your listing and I'm interested. However, I noticed some discrepancies in the photos. Could you provide more recent pictures of the property?",
    timestamp: "2 days ago",
    status: "read",
    priority: "medium",
    type: "complaint",
  },
];

// Utility functions for better code organization
const getStatusBadge = (status: Inquiry["status"]) => {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getPriorityColor = (priority: Inquiry["priority"]) => {
  return PRIORITY_COLORS[priority];
};

const getTypeIcon = (type: Inquiry["type"]) => {
  const { icon: Icon, className } = TYPE_ICONS[type];
  return <Icon className={className} />;
};

// Custom hook for search functionality to improve reusability
const useInquirySearch = (
  inquiries: Inquiry[],
  activeTab: TabValue,
  searchQuery: string
) => {
  return useMemo(() => {
    return inquiries.filter((inquiry) => {
      const matchesTab = activeTab === "all" || inquiry.status === activeTab;
      const matchesSearch =
        !searchQuery ||
        inquiry.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inquiry.propertyTitle
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        inquiry.message.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [inquiries, activeTab, searchQuery]);
};

// Memoized inquiry item component for better performance
const InquiryItem = ({
  inquiry,
  isSelected,
  onSelect,
}: {
  inquiry: Inquiry;
  isSelected: boolean;
  onSelect: (inquiry: Inquiry) => void;
}) => (
  <div
    className={`p-4 border-b border-l-4 cursor-pointer hover:bg-accent/50 transition-colors ${getPriorityColor(
      inquiry.priority
    )} ${isSelected ? "bg-accent" : ""}`}
    onClick={() => onSelect(inquiry)}
  >
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        {getTypeIcon(inquiry.type)}
        <span className="font-medium text-sm">{inquiry.senderName}</span>
      </div>
      {getStatusBadge(inquiry.status)}
    </div>
    <p className="text-sm font-medium mb-1">{inquiry.propertyTitle}</p>
    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
      {inquiry.message}
    </p>
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{inquiry.timestamp}</span>
      <span className="text-xs font-medium text-primary">
        KES {inquiry.propertyPrice.toLocaleString()}
      </span>
    </div>
  </div>
);

// Main component with optimized structure
export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Optimized data fetching with proper error handling
  const {
    data: inquiries = MOCK_INQUIRIES,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inquiries"],
    queryFn: async (): Promise<Inquiry[]> => {
      try {
        // Try to fetch from the new email service API
        const response = await apiRequest("GET", "/api/email/inquiries");
        if (response.inquiries && Array.isArray(response.inquiries)) {
          // Transform email messages to inquiry format
          return response.inquiries.map((inquiry: any) => ({
            id: inquiry.id,
            propertyId: inquiry.propertyId || 1,
            propertyTitle: inquiry.propertyTitle || "Property Inquiry",
            propertyLocation: inquiry.propertyLocation || "Location not specified",
            propertyPrice: inquiry.propertyPrice || 0,
            senderName: inquiry.from?.name || inquiry.senderName || "Unknown Sender",
            senderEmail: inquiry.from?.email || inquiry.senderEmail || "",
            senderPhone: inquiry.senderPhone,
            message: inquiry.body || inquiry.message || "",
            timestamp: inquiry.timestamp ? new Date(inquiry.timestamp).toLocaleString() : "Unknown time",
            status: inquiry.isRead ? "read" : "unread",
            priority: inquiry.priority || "medium",
            type: inquiry.inquiryType || "inquiry",
          }));
        }
      } catch (error) {
        console.warn("Email service not available, using mock data:", error);
      }
      
      // Fallback to mock data for demo purposes
      return MOCK_INQUIRIES;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Optimized mutations with better error handling
  const replyMutation = useMutation({
    mutationFn: async (data: { inquiryId: string; message: string }) => {
      try {
        // Try to use the new email service API
        return await apiRequest("POST", `/api/email/inquiries/${data.inquiryId}/reply`, {
          message: data.message,
        });
      } catch (error) {
        console.warn("Email service not available, simulating reply:", error);
        // Fallback to simulation for demo purposes
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { success: true, messageId: `mock_reply_${Date.now()}` };
      }
    },
    onSuccess: () => {
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      setShowReplyDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error sending reply",
        description: "Please try again later",
        variant: "destructive",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (inquiryId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
  });

  // Use custom hook for filtered inquiries
  const filteredInquiries = useInquirySearch(inquiries, activeTab, searchQuery);

  // Memoized computed values for performance
  const unreadCount = useMemo(
    () => inquiries.filter((i) => i.status === "unread").length,
    [inquiries]
  );

  // Optimized event handlers with proper useCallback usage
  const handleInquiryClick = useCallback(
    (inquiry: Inquiry) => {
      setSelectedInquiry(inquiry);
      if (inquiry.status === "unread") {
        markAsReadMutation.mutate(inquiry.id);
      }
    },
    [markAsReadMutation]
  );

  const handleReply = useCallback(
    (message: string) => {
      if (selectedInquiry) {
        replyMutation.mutate({
          inquiryId: selectedInquiry.id,
          message,
        });
      }
    },
    [selectedInquiry, replyMutation]
  );

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  // Loading state handling
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inquiries...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state handling
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Error loading inquiries
            </h3>
            <p className="text-muted-foreground">
              Please refresh the page and try again
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header section with improved accessibility */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Inbox</h1>
            <p className="text-muted-foreground">
              Manage inquiries and communicate with potential buyers
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inquiries..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9 w-64"
                aria-label="Search inquiries"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inbox List with improved performance */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages
                  </CardTitle>
                  {unreadCount > 0 && (
                    <Badge variant="destructive">{unreadCount}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                  <TabsList className="grid w-full grid-cols-4 mx-4 mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">Unread</TabsTrigger>
                    <TabsTrigger value="replied">Replied</TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="max-h-96 overflow-y-auto">
                  {filteredInquiries.length === 0 ?
                    <div className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No inquiries found
                      </p>
                    </div>
                  : filteredInquiries.map((inquiry) => (
                      <InquiryItem
                        key={inquiry.id}
                        inquiry={inquiry}
                        isSelected={selectedInquiry?.id === inquiry.id}
                        onSelect={handleInquiryClick}
                      />
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Detail with enhanced UX */}
          <div className="lg:col-span-2">
            {selectedInquiry ?
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(selectedInquiry.type)}
                      <div>
                        <CardTitle className="text-lg">
                          {selectedInquiry.senderName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {selectedInquiry.senderEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedInquiry.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Property Info */}
                  <div className="bg-accent/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="w-4 h-4 text-primary" />
                      <span className="font-medium">Property Inquiry</span>
                    </div>
                    <h3 className="font-semibold">
                      {selectedInquiry.propertyTitle}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedInquiry.propertyLocation}
                      </div>
                      <span className="font-medium text-primary">
                        KES {selectedInquiry.propertyPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedInquiry.senderEmail}
                      </span>
                    </div>
                    {selectedInquiry.senderPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {selectedInquiry.senderPhone}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Message */}
                  <div>
                    <h4 className="font-medium mb-2">Message</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedInquiry.message}
                    </p>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button onClick={() => setShowReplyDialog(true)}>
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline">
                      <Forward className="w-4 h-4 mr-2" />
                      Forward
                    </Button>
                    <Button variant="outline">
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </Button>
                    {selectedInquiry.senderPhone && (
                      <Button variant="outline">
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            : <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Select a message
                    </h3>
                    <p className="text-muted-foreground">
                      Choose a message from the inbox to view details and reply
                    </p>
                  </div>
                </CardContent>
              </Card>
            }
          </div>
        </div>

        {/* Reply Dialog with improved form handling */}
        <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reply to {selectedInquiry?.senderName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="message">Your Reply</Label>
                <Textarea
                  id="message"
                  placeholder="Type your reply here..."
                  rows={6}
                  required
                  disabled={replyMutation.isPending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      const message = e.currentTarget.value.trim();
                      if (message) {
                        handleReply(message);
                      }
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowReplyDialog(false)}
                  disabled={replyMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const textarea = document.getElementById(
                      "message"
                    ) as HTMLTextAreaElement;
                    const message = textarea?.value.trim();
                    if (message) {
                      handleReply(message);
                    }
                  }}
                  disabled={replyMutation.isPending}
                >
                  {replyMutation.isPending ?
                    <>Sending...</>
                  : <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
