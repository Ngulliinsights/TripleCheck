import React, { useState, useCallback, useMemo } from 'react'
import { 
  Search, 
  Send, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video,
  Archive,
  Star,
  Trash2,
  Filter,
  Users,
  MessageSquare
} from 'lucide-react'

import { Button } from '../../shared/components/ui/button'
import { Input } from '../../shared/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Badge } from '../../shared/components/ui/badge'
import { Textarea } from '../../shared/components/ui/textarea'
import { useToast } from '../../shared/hooks/use-toast'

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
  }>;
}

interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    role: 'buyer' | 'seller' | 'agent' | 'lawyer';
  }>;
  propertyId?: string;
  propertyTitle?: string;
  lastMessage: Message;
  unreadCount: number;
  isStarred: boolean;
  isArchived: boolean;
}

// Mock data for demonstration
const mockConversations: Conversation[] = [
  {
    id: '1',
    participants: [
      { id: '1', name: 'John Kamau', role: 'seller' },
      { id: '2', name: 'You', role: 'buyer' }
    ],
    propertyId: 'prop-1',
    propertyTitle: '3BR Apartment in Westlands',
    lastMessage: {
      id: 'msg-1',
      senderId: '1',
      senderName: 'John Kamau',
      content: 'The property is available for viewing this weekend. What time works for you?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: false
    },
    unreadCount: 2,
    isStarred: true,
    isArchived: false
  },
  {
    id: '2',
    participants: [
      { id: '3', name: 'Sarah Wanjiku', role: 'agent' },
      { id: '2', name: 'You', role: 'buyer' }
    ],
    propertyId: 'prop-2',
    propertyTitle: 'Villa in Karen',
    lastMessage: {
      id: 'msg-2',
      senderId: '3',
      senderName: 'Sarah Wanjiku',
      content: 'I have the verification documents ready for your review.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isRead: true
    },
    unreadCount: 0,
    isStarred: false,
    isArchived: false
  }
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: 'msg-1-1',
      senderId: '2',
      senderName: 'You',
      content: 'Hi, I\'m interested in viewing this property. Is it still available?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isRead: true
    },
    {
      id: 'msg-1-2',
      senderId: '1',
      senderName: 'John Kamau',
      content: 'Yes, it\'s still available! The property has been verified and all documents are in order.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23), // 23 hours ago
      isRead: true
    },
    {
      id: 'msg-1-3',
      senderId: '1',
      senderName: 'John Kamau',
      content: 'The property is available for viewing this weekend. What time works for you?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: false
    }
  ]
};

export default function MessageCenter() {
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');

  // Filter conversations based on search and filter
  const filteredConversations = useMemo(() => {
    let filtered = mockConversations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        conv.propertyTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case 'starred':
        filtered = filtered.filter(conv => conv.isStarred);
        break;
      case 'archived':
        filtered = filtered.filter(conv => conv.isArchived);
        break;
      default:
        filtered = filtered.filter(conv => !conv.isArchived);
    }

    return filtered;
  }, [searchQuery, filter]);

  const selectedConv = mockConversations.find(c => c.id === selectedConversation);
  const messages = selectedConversation ? mockMessages[selectedConversation] || [] : [];

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedConversation) return;

    // In a real app, this would send the message via API
    toast({
      title: 'Message sent',
      description: 'Your message has been delivered successfully.',
    });

    setNewMessage('');
  }, [newMessage, selectedConversation, toast]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">
            Communicate securely with property owners, agents, and legal experts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversations
                </CardTitle>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {(['all', 'unread', 'starred', 'archived'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="capitalize"
                  >
                    {f}
                  </Button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-4 cursor-pointer hover:bg-muted/50 border-l-4 transition-colors ${
                      selectedConversation === conversation.id 
                        ? 'bg-muted border-l-primary' 
                        : 'border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {conversation.participants.find(p => p.name !== 'You')?.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {conversation.participants.find(p => p.name !== 'You')?.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {conversation.isStarred && <Star className="w-3 h-3 text-yellow-500" />}
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {conversation.propertyTitle && (
                      <p className="text-xs text-muted-foreground mb-1">
                        Re: {conversation.propertyTitle}
                      </p>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                      {conversation.lastMessage.content}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatTime(conversation.lastMessage.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConv ? (
              <>
                {/* Header */}
                <CardHeader className="pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {selectedConv.participants.find(p => p.name !== 'You')?.name}
                      </h3>
                      {selectedConv.propertyTitle && (
                        <p className="text-sm text-muted-foreground">
                          Re: {selectedConv.propertyTitle}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Archive className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderName === 'You' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.senderName === 'You'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderName === 'You' 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="min-h-[60px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}