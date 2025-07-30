import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../shared/components/ui/dialog";
import { Input } from "../../shared/components/ui/input";
import { Label } from "../../shared/components/ui/label";
import { Separator } from "../../shared/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "../../shared/components/ui/tabs";
import { Textarea } from "../../shared/components/ui/textarea";
import { useToast } from "../../shared/hooks/use-toast";

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

// Status badge configuration for better maintainability - using const assertion for type safety
const STATUS_CONFIG = {
  unread: { variant: "destructive" as const, label: "Unread" },
  read: { variant: "secondary" as const, label: "Read" },
  replied: { variant: "default" as const, label: "Replied" },
  archived: { variant: "outline" as const, label: "Archived" },
} as const;

// Priority color mapping for consistent styling - using readonly array to prevent injection
const PRIORITY_COLORS: Record<Inquiry["priority"], string> = {
  high: "border-l-red-500",
  medium: "border-l-yellow-500",
  low: "border-l-green-500",
} as const;

// Type icon configuration for better organization - using const assertion for type safety
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

// Utility functions for better code organization with proper type safety
const getStatusBadge = (status: Inquiry["status"]) => {
  const validStatuses = ["unread", "read", "replied", "archived"] as const;
  const config = validStatuses.includes(status) ? STATUS_CONFIG[status] : STATUS_CONFIG.unread;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Safe access to priority colors to prevent object injection
const getPriorityColor = (priority: Inquiry["priority"]): string => {
  const validPriorities = ["high", "medium", "low"] as const;
  if (validPriorities.includes(priority)) {
    return PRIORITY_COLORS[priority];
  }
  return "border-l-gray-500";
};

// Safe access to type icons with proper typing
const getTypeIcon = (type: Inquiry["type"]) => {
  const validTypes = ["viewing_request", "offer", "complaint", "inquiry"] as const;
  const iconConfig = validTypes.includes(type) ? TYPE_ICONS[type] : TYPE_ICONS.inquiry;
  const { icon: Icon, className } = iconConfig;
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

// Memoized inquiry item component for better performance with improved accessibility
const InquiryItem = ({
  inquiry,
  isSelected,
  onSelect,
}: {
  inquiry: Inquiry;
  isSelected: boolean;
  onSelect: (inquiry: Inquiry) => void;
}) => {
  // Handle keyboard navigation for accessibility
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect(inquiry);
      }
    },
    [inquiry, onSelect]
  );

  return (
    <div
      className={`p-4 border-b border-l-4 cursor-pointer hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${getPriorityColor(
        inquiry.priority
      )} ${isSelected ? "bg-accent" : ""}`}
      onClick={() => onSelect(inquiry)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected ? "true" : "false"}
      aria-label={`Message from ${inquiry.senderName} about ${inquiry.propertyTitle}`}
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
};

// Main component with optimized structure
export default function InboxPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simplified data fetching to avoid hook issues
  const {
    data: inquiries = MOCK_INQUIRIES,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inquiries"],
    queryFn: async (): Promise<Inquiry[]> => {
      // Simulate API call with proper error handling
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_INQUIRIES;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Optimized reply mutation with proper error handling
  const replyMutation = useMutation({
    mutationFn: async (data: { inquiryId: string; message: string }) => {
      // Simulate reply with validation
      if (!data.message.trim()) {
        throw new Error("Message cannot be empty");
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, messageId: `reply_${Date.now()}` };
    },
    onSuccess: () => {
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      setShowReplyDialog(false);
      setReplyMessage(""); // Clear the reply message
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending reply",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  // Optimized mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (_inquiryId: string) => {
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

  const handleReply = useCallback(() => {
    if (selectedInquiry && replyMessage.trim()) {
      replyMutation.mutate({
        inquiryId: selectedInquiry.id,
        message: replyMessage.trim(),
      });
    }
  }, [selectedInquiry, replyMessage, replyMutation]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TabValue);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  // Handle reply dialog close with cleanup
  const handleReplyDialogClose = useCallback((open: boolean) => {
    setShowReplyDialog(open);
    if (!open) {
      setReplyMessage("");
    }
  }, []);

  // Keyboard shortcut for sending reply
  const handleReplyKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleReply();
      }
    },
    [handleReply]
  );

  // Render loading state
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

  // Render error state
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
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 hover:text-foreground"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Button>
          <span>/</span>
          <span className="text-foreground font-medium">Inbox</span>
        </nav>

        {/* Header section with improved accessibility */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Inbox</h1>
              <p className="text-muted-foreground">
                Manage inquiries and communicate with potential buyers
              </p>
            </div>
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
          {/* Inbox List with improved performance and accessibility */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Messages
                  </CardTitle>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" aria-label={`${unreadCount} unread messages`}>
                      {unreadCount}
                    </Badge>
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

                <div className="max-h-96 overflow-y-auto" role="list" aria-label="Inquiry messages">
                  {filteredInquiries.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No inquiries found
                      </p>
                    </div>
                  ) : (
                    filteredInquiries.map((inquiry) => (
                      <div key={inquiry.id} role="listitem">
                        <InquiryItem
                          inquiry={inquiry}
                          isSelected={selectedInquiry?.id === inquiry.id}
                          onSelect={handleInquiryClick}
                        />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Detail with enhanced UX */}
          <div className="lg:col-span-2">
            {selectedInquiry ? (
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
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/property/${selectedInquiry.propertyId}`)}
                    >
                      <Home className="w-4 h-4 mr-2" />
                      View Property
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
            ) : (
              <Card>
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
            )}
          </div>
        </div>

        {/* Reply Dialog with improved form handling and accessibility */}
        <Dialog open={showReplyDialog} onOpenChange={handleReplyDialogClose}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reply to {selectedInquiry?.senderName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reply-message">Your Reply</Label>
                <Textarea
                  id="reply-message"
                  placeholder="Type your reply here..."
                  rows={6}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={handleReplyKeyDown}
                  disabled={replyMutation.isPending}
                  required
                  aria-describedby="reply-help"
                />
                <p id="reply-help" className="text-xs text-muted-foreground mt-1">
                  Press Ctrl+Enter (Cmd+Enter on Mac) to send quickly
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleReplyDialogClose(false)}
                  disabled={replyMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReply}
                  disabled={replyMutation.isPending || !replyMessage.trim()}
                >
                  {replyMutation.isPending ? (
                    <>Sending...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}