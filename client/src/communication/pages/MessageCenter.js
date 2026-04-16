"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MessageCenter;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../../local/components/ui/button");
var input_1 = require("../../local/components/ui/input");
var card_1 = require("../../local/components/ui/card");
var badge_1 = require("../../local/components/ui/badge");
var textarea_1 = require("../../local/components/ui/textarea");
var use_toast_1 = require("../../local/hooks/use-toast");
// Mock data for demonstration
var mockConversations = [
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
var mockMessages = {
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
function MessageCenter() {
    var _a;
    var toast = (0, use_toast_1.useToast)().toast;
    var _b = (0, react_1.useState)('1'), selectedConversation = _b[0], setSelectedConversation = _b[1];
    var _c = (0, react_1.useState)(''), searchQuery = _c[0], setSearchQuery = _c[1];
    var _d = (0, react_1.useState)(''), newMessage = _d[0], setNewMessage = _d[1];
    var _e = (0, react_1.useState)('all'), filter = _e[0], setFilter = _e[1];
    // Filter conversations based on search and filter
    var filteredConversations = (0, react_1.useMemo)(function () {
        var filtered = mockConversations;
        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(function (conv) {
                var _a;
                return conv.participants.some(function (p) { return p.name.toLowerCase().includes(searchQuery.toLowerCase()); }) ||
                    ((_a = conv.propertyTitle) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    conv.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase());
            });
        }
        // Apply status filter
        switch (filter) {
            case 'unread':
                filtered = filtered.filter(function (conv) { return conv.unreadCount > 0; });
                break;
            case 'starred':
                filtered = filtered.filter(function (conv) { return conv.isStarred; });
                break;
            case 'archived':
                filtered = filtered.filter(function (conv) { return conv.isArchived; });
                break;
            default:
                filtered = filtered.filter(function (conv) { return !conv.isArchived; });
        }
        return filtered;
    }, [searchQuery, filter]);
    var selectedConv = mockConversations.find(function (c) { return c.id === selectedConversation; });
    var messages = selectedConversation ? mockMessages[selectedConversation] || [] : [];
    var handleSendMessage = (0, react_1.useCallback)(function () {
        if (!newMessage.trim() || !selectedConversation)
            return;
        // In a real app, this would send the message via API
        toast({
            title: 'Message sent',
            description: 'Your message has been delivered successfully.',
        });
        setNewMessage('');
    }, [newMessage, selectedConversation, toast]);
    var formatTime = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var minutes = Math.floor(diff / (1000 * 60));
        var hours = Math.floor(diff / (1000 * 60 * 60));
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (minutes < 60)
            return "".concat(minutes, "m ago");
        if (hours < 24)
            return "".concat(hours, "h ago");
        if (days < 7)
            return "".concat(days, "d ago");
        return date.toLocaleDateString();
    };
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Messages</h1>
          <p className="text-muted-foreground">
            Communicate securely with property owners, agents, and legal experts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <card_1.Card className="lg:col-span-1">
            <card_1.CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.MessageSquare className="w-5 h-5"/>
                  Conversations
                </card_1.CardTitle>
                <button_1.Button variant="ghost" size="sm">
                  <lucide_react_1.MoreVertical className="w-4 h-4"/>
                </button_1.Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                <input_1.Input placeholder="Search conversations..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} className="pl-10"/>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {['all', 'unread', 'starred', 'archived'].map(function (f) { return (<button_1.Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm" onClick={function () { return setFilter(f); }} className="capitalize">
                    {f}
                  </button_1.Button>); })}
              </div>
            </card_1.CardHeader>

            <card_1.CardContent className="p-0">
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {filteredConversations.map(function (conversation) {
            var _a, _b;
            return (<div key={conversation.id} onClick={function () { return setSelectedConversation(conversation.id); }} className={"p-4 cursor-pointer hover:bg-muted/50 border-l-4 transition-colors ".concat(selectedConversation === conversation.id
                    ? 'bg-muted border-l-primary'
                    : 'border-l-transparent')}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <lucide_react_1.Users className="w-5 h-5 text-primary"/>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {(_a = conversation.participants.find(function (p) { return p.name !== 'You'; })) === null || _a === void 0 ? void 0 : _a.name}
                          </h4>
                          <badge_1.Badge variant="outline" className="text-xs">
                            {(_b = conversation.participants.find(function (p) { return p.name !== 'You'; })) === null || _b === void 0 ? void 0 : _b.role}
                          </badge_1.Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {conversation.isStarred && <lucide_react_1.Star className="w-3 h-3 text-yellow-500"/>}
                        {conversation.unreadCount > 0 && (<badge_1.Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </badge_1.Badge>)}
                      </div>
                    </div>

                    {conversation.propertyTitle && (<p className="text-xs text-muted-foreground mb-1">
                        Re: {conversation.propertyTitle}
                      </p>)}

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                      {conversation.lastMessage.content}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatTime(conversation.lastMessage.timestamp)}
                    </p>
                  </div>);
        })}
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Message Thread */}
          <card_1.Card className="lg:col-span-2 flex flex-col">
            {selectedConv ? (<>
                {/* Header */}
                <card_1.CardHeader className="pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {(_a = selectedConv.participants.find(function (p) { return p.name !== 'You'; })) === null || _a === void 0 ? void 0 : _a.name}
                      </h3>
                      {selectedConv.propertyTitle && (<p className="text-sm text-muted-foreground">
                          Re: {selectedConv.propertyTitle}
                        </p>)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.Phone className="w-4 h-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.Video className="w-4 h-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.Archive className="w-4 h-4"/>
                      </button_1.Button>
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.MoreVertical className="w-4 h-4"/>
                      </button_1.Button>
                    </div>
                  </div>
                </card_1.CardHeader>

                {/* Messages */}
                <card_1.CardContent className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.map(function (message) { return (<div key={message.id} className={"flex ".concat(message.senderName === 'You' ? 'justify-end' : 'justify-start')}>
                        <div className={"max-w-[70%] p-3 rounded-lg ".concat(message.senderName === 'You'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted')}>
                          <p className="text-sm">{message.content}</p>
                          <p className={"text-xs mt-1 ".concat(message.senderName === 'You'
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground')}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>); })}
                  </div>
                </card_1.CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <textarea_1.Textarea placeholder="Type your message..." value={newMessage} onChange={function (e) { return setNewMessage(e.target.value); }} className="min-h-[60px] resize-none" onKeyDown={function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                }
            }}/>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button_1.Button variant="ghost" size="sm">
                        <lucide_react_1.Paperclip className="w-4 h-4"/>
                      </button_1.Button>
                      <button_1.Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <lucide_react_1.Send className="w-4 h-4"/>
                      </button_1.Button>
                    </div>
                  </div>
                </div>
              </>) : (<card_1.CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <lucide_react_1.MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                  <h3 className="font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </card_1.CardContent>)}
          </card_1.Card>
        </div>
      </div>
    </div>);
}
