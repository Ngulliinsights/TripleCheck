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
  MapPin,
  Home,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";
import { useState, useCallback, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "../../local/components/ui/badge";
import { Button } from "../../local/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../local/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../local/components/ui/dialog";
import { Input } from "../../local/components/ui/input";
import { Label } from "../../local/components/ui/label";
import { Separator } from "../../local/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "../../local/components/ui/tabs";
import { Textarea } from "../../local/components/ui/textarea";
import { useToast } from "../../local/hooks/use-toast";

// --- Types ---
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

type TabValue = "all" | "unread" | "replied" | "archived";

// --- Constants & Configs ---
const STATUS_CONFIG = {
  unread: { variant: "destructive" as const, label: "Unread" },
  read: { variant: "secondary" as const, label: "Read" },
  replied: { variant: "default" as const, label: "Replied" },
  archived: { variant: "outline" as const, label: "Archived" },
} as const;

const PRIORITY_COLORS: Record<Inquiry["priority"], string> = {
  high: "border-l-red-500",
  medium: "border-l-yellow-500",
  low: "border-l-green-500",
} as const;

const TYPE_ICONS = {
  viewing_request: { icon: Home, className: "w-4 h-4 text-blue-500" },
  offer: { icon: Star, className: "w-4 h-4 text-yellow-500" },
  complaint: { icon: AlertCircle, className: "w-4 h-4 text-red-500" },
  inquiry: { icon: MessageSquare, className: "w-4 h-4 text-gray-500" },
} as const;

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
    message: "Hi, I'm very interested in this property. Could we schedule a viewing this weekend? I'm looking for a 2-bedroom apartment in this area and this seems perfect. What's the earliest availability?",
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
    message: "I would like to make an offer on this property. Is the owner open to negotiations? My budget is around KES 230,000.",
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
    message: "Hello, I'm interested in renting this studio apartment. What are the lease terms and when would it be available? Also, are pets allowed?",
    timestamp: "1 day ago",
    status: "replied",
    priority: "medium",
    type: "inquiry",
  },
];

// --- Utilities ---
const getStatusBadge = (status: Inquiry["status"]) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unread;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getPriorityColor = (priority: Inquiry["priority"]): string => {
  return PRIORITY_COLORS[priority] || "border-l-gray-500";
};

const getTypeIcon = (type: Inquiry["type"]) => {
  const { icon: Icon, className } = TYPE_ICONS[type] || TYPE_ICONS.inquiry;
  return <Icon className={className} />;
};

// --- Custom Hooks ---
const useInquirySearch = (inquiries: Inquiry[], activeTab: TabValue, searchQuery: string) => {
  return useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return inquiries.filter((inquiry) => {
      const matchesTab = activeTab === "all" || inquiry.status === activeTab;
      const matchesSearch =
        !searchQuery ||
        inquiry.senderName.toLowerCase().includes(lowerQuery) ||
        inquiry.propertyTitle.toLowerCase().includes(lowerQuery) ||
        inquiry.message.toLowerCase().includes(lowerQuery);

      return matchesTab && matchesSearch;
    });
  }, [inquiries, activeTab, searchQuery]);
};

// --- Components ---

interface InquiryItemProps {
  inquiry: Inquiry;
  isSelected: boolean;
  onSelect: (inquiry: Inquiry) => void;
}

// Wrapped in React.memo to prevent unnecessary re-renders of list items
const InquiryItem = memo(({ inquiry, isSelected, onSelect }: InquiryItemProps) => {
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
      role="listitem"
      tabIndex={0}
      aria-label={`Message from ${inquiry.senderName} about ${inquiry.propertyTitle}${isSelected ? " (selected)" : ""}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getTypeIcon(inquiry.type)}
          <span className="font-medium text-sm">{inquiry.senderName}</span>
        </div>
        {getStatusBadge(inquiry.status)}
      </div>
      <p className="text-sm font-medium mb-1">{inquiry.propertyTitle}</p>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{inquiry.message}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{inquiry.timestamp}</span>
        <span className="text-xs font-medium text-primary">
          KES {inquiry.propertyPrice.toLocaleString()}
        </span>
      </div>
    </div>
  );
});
InquiryItem.displayName = "InquiryItem";

export default function InboxPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  const { data: inquiries = MOCK_INQUIRIES, isLoading, error } = useQuery({
    queryKey: ["inquiries"],
    queryFn: async (): Promise<Inquiry[]> => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_INQUIRIES;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const replyMutation = useMutation({
    mutationFn: async (data: { inquiryId: string; message: string }) => {
      if (!data.message.trim()) throw new Error("Message cannot be empty");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, messageId: `reply_${Date.now()}` };
    },
    onSuccess: () => {
      toast({ title: "Reply sent", description: "Your reply has been sent successfully" });
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      setShowReplyDialog(false);
      setReplyMessage("");
    },
    onError: (error: Error) => {
      toast({ title: "Error sending reply", description: error.message, variant: "destructive" });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (_inquiryId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
  });

  const filteredInquiries = useInquirySearch(inquiries, activeTab, searchQuery);

  const unreadCount = useMemo(
    () => inquiries.filter((i) => i.status === "unread").length,
    [inquiries]
  );

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
      replyMutation.mutate({ inquiryId: selectedInquiry.id, message: replyMessage.trim() });
    }
  }, [selectedInquiry, replyMessage, replyMutation]);

  const handleReplyDialogClose = useCallback((open: boolean) => {
    setShowReplyDialog(open);
    if (!open) setReplyMessage("");
  }, []);

  const handleReplyKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleReply();
      }
    },
    [handleReply]
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Error loading inquiries</h3>
          <p className="text-muted-foreground">Please refresh the page and try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 navbar-offset pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 hover:text-foreground"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Button>
          <span>/</span>
          <span className="text-foreground font-medium">Inbox</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="hidden md:flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Inbox</h1>
              <p className="text-muted-foreground">Manage inquiries and communicate with potential buyers</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inquiries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full md:w-64"
                aria-label="Search inquiries"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Filter</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inbox List */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5" /> Messages
                  </CardTitle>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" aria-label={`${unreadCount} unread messages`}>
                      {unreadCount}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
                  <div className="px-4 pb-2">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="unread">Unread</TabsTrigger>
                      <TabsTrigger value="replied">Replied</TabsTrigger>
                      <TabsTrigger value="archived">Archived</TabsTrigger>
                    </TabsList>
                  </div>
                </Tabs>

                <div className="flex-1 overflow-y-auto max-h-[600px]">
                  {filteredInquiries.length === 0 ? (
                    <div className="p-8 text-center mt-10">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                      <p className="text-muted-foreground">No inquiries found</p>
                    </div>
                  ) : (
                    <div role="list" aria-label="Inquiry messages">
                      {filteredInquiries.map((inquiry) => (
                        <InquiryItem
                          key={inquiry.id}
                          inquiry={inquiry}
                          isSelected={selectedInquiry?.id === inquiry.id}
                          onSelect={handleInquiryClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedInquiry ? (
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                         {getTypeIcon(selectedInquiry.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{selectedInquiry.senderName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{selectedInquiry.senderEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedInquiry.status)}
                      <Button variant="ghost" size="icon" aria-label="More options">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Property Info Block */}
                  <div className="bg-accent/40 p-4 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm text-primary">Property Inquiry</span>
                    </div>
                    <h3 className="font-semibold text-lg">{selectedInquiry.propertyTitle}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {selectedInquiry.propertyLocation}
                      </div>
                      <span className="font-semibold text-foreground">
                        KES {selectedInquiry.propertyPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Contact Methods */}
                  {selectedInquiry.senderPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedInquiry.senderPhone}</span>
                    </div>
                  )}

                  <Separator />

                  {/* The Message */}
                  <div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedInquiry.message}
                    </p>
                  </div>

                  <Separator />

                  {/* Action Bar */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button onClick={() => setShowReplyDialog(true)}>
                      <Reply className="w-4 h-4 mr-2" /> Reply
                    </Button>
                    <Button variant="outline">
                      <Forward className="w-4 h-4 mr-2" /> Forward
                    </Button>
                    <Button variant="outline" className="text-muted-foreground">
                      <Archive className="w-4 h-4 mr-2" /> Archive
                    </Button>
                    <div className="flex-1" />
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/property/${selectedInquiry.propertyId}`)}
                    >
                      <Home className="w-4 h-4 mr-2" /> View Listing
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full min-h-[500px] flex items-center justify-center">
                <CardContent className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-2">Select a message</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Choose a message from the inbox on the left to view details and reply.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reply Dialog */}
        <Dialog open={showReplyDialog} onOpenChange={handleReplyDialogClose}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Reply to {selectedInquiry?.senderName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="reply-message" className="sr-only">Your Reply</Label>
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
                  className="resize-none"
                />
                <p id="reply-help" className="text-xs text-muted-foreground">
                  Press <kbd className="px-1.5 py-0.5 bg-muted rounded border">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded border">Enter</kbd> to send quickly.
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
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Send Reply
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