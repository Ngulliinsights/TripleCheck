"use strict";
/**
 * Message Thread Component
 * Displays a conversation thread with real-time messaging
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageThread = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var useMessaging_1 = require("../hooks/useMessaging");
var button_1 = require("../../local/components/ui/button");
var input_1 = require("../../local/components/ui/input");
var card_1 = require("../../local/components/ui/card");
var avatar_1 = require("../../local/components/ui/avatar");
var badge_1 = require("../../local/components/ui/badge");
var tooltip_1 = require("../../local/components/ui/tooltip");
var dropdown_menu_1 = require("../../local/components/ui/dropdown-menu");
var scroll_area_1 = require("../../local/components/ui/scroll-area");
var MessageBubble = function (_a) {
    var message = _a.message, isOwn = _a.isOwn, _b = _a.showAvatar, showAvatar = _b === void 0 ? true : _b, onRetry = _a.onRetry;
    var formatTime = function (dateString) {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    var getStatusIcon = function () {
        switch (message.status) {
            case 'sent':
                return '✓';
            case 'delivered':
                return '✓✓';
            case 'read':
                return <span className="text-blue-500">✓✓</span>;
            case 'failed':
                return <span className="text-red-500 cursor-pointer" onClick={onRetry}>⚠</span>;
            default:
                return '⏳';
        }
    };
    var getMessageTypeIcon = function () {
        switch (message.messageType) {
            case 'property_inquiry':
                return '🏠';
            case 'verification_request':
                return '✅';
            case 'appointment_request':
                return '📅';
            case 'system_message':
                return '🤖';
            default:
                return null;
        }
    };
    return (<div className={"flex items-end gap-2 mb-4 ".concat(isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {showAvatar && !isOwn && (<avatar_1.Avatar className="w-8 h-8">
          <avatar_1.AvatarImage src={"/api/users/".concat(message.senderId, "/avatar")}/>
          <avatar_1.AvatarFallback>{message.senderId.substring(0, 2).toUpperCase()}</avatar_1.AvatarFallback>
        </avatar_1.Avatar>)}
      
      <div className={"max-w-[70%] ".concat(isOwn ? 'items-end' : 'items-start', " flex flex-col")}>
        <div className={"px-4 py-2 rounded-lg ".concat(isOwn
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm', " ").concat(message.status === 'failed' ? 'border-2 border-red-300' : '')}>
          {getMessageTypeIcon() && (<div className="flex items-center gap-2 mb-1 text-sm opacity-75">
              <span>{getMessageTypeIcon()}</span>
              <span className="capitalize">{message.messageType.replace('_', ' ')}</span>
            </div>)}
          
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          
          {message.attachments && message.attachments.length > 0 && (<div className="mt-2 space-y-1">
              {message.attachments.map(function (attachment) { return (<div key={attachment.id} className="flex items-center gap-2 text-xs opacity-75">
                  <lucide_react_1.Paperclip className="w-3 h-3"/>
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                    {attachment.fileName}
                  </a>
                </div>); })}
            </div>)}
        </div>
        
        <div className={"flex items-center gap-1 mt-1 text-xs text-gray-500 ".concat(isOwn ? 'flex-row-reverse' : 'flex-row')}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && <span className="ml-1">{getStatusIcon()}</span>}
        </div>
      </div>
    </div>);
};
var TypingIndicator = function (_a) {
    var users = _a.users;
    if (users.length === 0)
        return null;
    return (<div className="flex items-center gap-2 mb-4">
      <avatar_1.Avatar className="w-8 h-8">
        <avatar_1.AvatarFallback>{users[0].substring(0, 2).toUpperCase()}</avatar_1.AvatarFallback>
      </avatar_1.Avatar>
      <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-sm">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
          </div>
          <span className="text-xs text-gray-500 ml-2">
            {users.length === 1 ? 'typing...' : "".concat(users.length, " people typing...")}
          </span>
        </div>
      </div>
    </div>);
};
var MessageThread = function (_a) {
    var threadId = _a.threadId, recipientId = _a.recipientId, _b = _a.recipientName, recipientName = _b === void 0 ? 'User' : _b, recipientAvatar = _a.recipientAvatar, propertyId = _a.propertyId, onClose = _a.onClose, _c = _a.className, className = _c === void 0 ? '' : _c;
    var _d = (0, react_1.useState)(''), messageText = _d[0], setMessageText = _d[1];
    var _e = (0, react_1.useState)(false), isTyping = _e[0], setIsTyping = _e[1];
    var _f = (0, react_1.useState)([]), attachments = _f[0], setAttachments = _f[1];
    var messagesEndRef = (0, react_1.useRef)(null);
    var fileInputRef = (0, react_1.useRef)(null);
    var typingTimeoutRef = (0, react_1.useRef)();
    var _g = (0, useMessaging_1.useMessages)(threadId), messages = _g.messages, isLoading = _g.isLoading, refetch = _g.refetch;
    var _h = (0, useMessaging_1.useMessaging)(), sendMessage = _h.sendMessage, markMessagesAsRead = _h.markMessagesAsRead, setTypingIndicator = _h.setTypingIndicator, isSending = _h.isSending;
    var typingUsers = (0, useMessaging_1.useTypingIndicators)(threadId);
    // Auto-scroll to bottom when new messages arrive
    (0, react_1.useEffect)(function () {
        var _a;
        (_a = messagesEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);
    // Mark messages as read when thread is viewed
    (0, react_1.useEffect)(function () {
        var unreadMessages = messages.filter(function (msg) {
            return msg.recipientId === 'current_user_id' && !msg.readAt;
        });
        if (unreadMessages.length > 0) {
            markMessagesAsRead(unreadMessages.map(function (msg) { return msg.id; }));
        }
    }, [messages, markMessagesAsRead]);
    // Handle typing indicator
    var handleTypingStart = (0, react_1.useCallback)(function () {
        if (!isTyping) {
            setIsTyping(true);
            setTypingIndicator(threadId, true);
        }
        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        // Set new timeout to stop typing indicator
        typingTimeoutRef.current = setTimeout(function () {
            setIsTyping(false);
            setTypingIndicator(threadId, false);
        }, 3000);
    }, [isTyping, threadId, setTypingIndicator]);
    var handleTypingStop = (0, react_1.useCallback)(function () {
        if (isTyping) {
            setIsTyping(false);
            setTypingIndicator(threadId, false);
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    }, [isTyping, threadId, setTypingIndicator]);
    var handleSendMessage = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var messageType, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!messageText.trim() && attachments.length === 0)
                        return [2 /*return*/];
                    messageType = propertyId ? 'property_inquiry' : 'text';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, sendMessage({
                            threadId: threadId,
                            recipientId: recipientId,
                            content: messageText.trim(),
                            messageType: messageType,
                            propertyId: propertyId,
                            attachments: attachments.length > 0 ? attachments : undefined
                        })];
                case 2:
                    _a.sent();
                    setMessageText('');
                    setAttachments([]);
                    handleTypingStop();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to send message:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [messageText, attachments, threadId, recipientId, propertyId, sendMessage, handleTypingStop]);
    var handleKeyPress = (0, react_1.useCallback)(function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);
    var handleFileSelect = (0, react_1.useCallback)(function (e) {
        var files = Array.from(e.target.files || []);
        setAttachments(function (prev) { return __spreadArray(__spreadArray([], prev, true), files, true); });
    }, []);
    var removeAttachment = (0, react_1.useCallback)(function (index) {
        setAttachments(function (prev) { return prev.filter(function (_, i) { return i !== index; }); });
    }, []);
    var retryMessage = (0, react_1.useCallback)(function (messageId) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // In a real implementation, you'd retry sending the failed message
            console.log('Retrying message:', messageId);
            refetch();
            return [2 /*return*/];
        });
    }); }, [refetch]);
    if (isLoading) {
        return (<card_1.Card className={className}>
        <card_1.CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<card_1.Card className={"flex flex-col h-full ".concat(className)}>
      {/* Header */}
      <card_1.CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <avatar_1.Avatar>
              <avatar_1.AvatarImage src={recipientAvatar}/>
              <avatar_1.AvatarFallback>{recipientName.substring(0, 2).toUpperCase()}</avatar_1.AvatarFallback>
            </avatar_1.Avatar>
            <div>
              <card_1.CardTitle className="text-lg">{recipientName}</card_1.CardTitle>
              <p className="text-sm text-gray-500">
                {typingUsers.length > 0 ? 'typing...' : 'Active now'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <tooltip_1.TooltipProvider>
              <tooltip_1.Tooltip>
                <tooltip_1.TooltipTrigger asChild>
                  <button_1.Button variant="ghost" size="sm">
                    <lucide_react_1.Phone className="w-4 h-4"/>
                  </button_1.Button>
                </tooltip_1.TooltipTrigger>
                <tooltip_1.TooltipContent>Voice call</tooltip_1.TooltipContent>
              </tooltip_1.Tooltip>
            </tooltip_1.TooltipProvider>

            <tooltip_1.TooltipProvider>
              <tooltip_1.Tooltip>
                <tooltip_1.TooltipTrigger asChild>
                  <button_1.Button variant="ghost" size="sm">
                    <lucide_react_1.Video className="w-4 h-4"/>
                  </button_1.Button>
                </tooltip_1.TooltipTrigger>
                <tooltip_1.TooltipContent>Video call</tooltip_1.TooltipContent>
              </tooltip_1.Tooltip>
            </tooltip_1.TooltipProvider>

            <dropdown_menu_1.DropdownMenu>
              <dropdown_menu_1.DropdownMenuTrigger asChild>
                <button_1.Button variant="ghost" size="sm">
                  <lucide_react_1.MoreVertical className="w-4 h-4"/>
                </button_1.Button>
              </dropdown_menu_1.DropdownMenuTrigger>
              <dropdown_menu_1.DropdownMenuContent align="end">
                <dropdown_menu_1.DropdownMenuItem>
                  <lucide_react_1.Info className="w-4 h-4 mr-2"/>
                  Thread Info
                </dropdown_menu_1.DropdownMenuItem>
                <dropdown_menu_1.DropdownMenuItem>Archive Thread</dropdown_menu_1.DropdownMenuItem>
                <dropdown_menu_1.DropdownMenuItem className="text-red-600">Block User</dropdown_menu_1.DropdownMenuItem>
              </dropdown_menu_1.DropdownMenuContent>
            </dropdown_menu_1.DropdownMenu>

            {onClose && (<button_1.Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </button_1.Button>)}
          </div>
        </div>
      </card_1.CardHeader>

      {/* Messages */}
      <card_1.CardContent className="flex-1 overflow-hidden p-0">
        <scroll_area_1.ScrollArea className="h-full p-4">
          {messages.length === 0 ? (<div className="flex items-center justify-center h-full text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>) : (<div>
              {messages.map(function (message, index) {
                var isOwn = message.senderId === 'current_user_id'; // Replace with actual current user ID
                var showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                return (<MessageBubble key={message.id} message={message} isOwn={isOwn} showAvatar={showAvatar} onRetry={function () { return retryMessage(message.id); }}/>);
            })}
              
              <TypingIndicator users={typingUsers}/>
              <div ref={messagesEndRef}/>
            </div>)}
        </scroll_area_1.ScrollArea>
      </card_1.CardContent>

      {/* Message Input */}
      <div className="flex-shrink-0 border-t p-4">
        {/* Attachments Preview */}
        {attachments.length > 0 && (<div className="mb-3 flex flex-wrap gap-2">
            {attachments.map(function (file, index) { return (<badge_1.Badge key={index} variant="secondary" className="flex items-center gap-1">
                <lucide_react_1.Paperclip className="w-3 h-3"/>
                <span className="truncate max-w-20">{file.name}</span>
                <button onClick={function () { return removeAttachment(index); }} className="ml-1 hover:text-red-600">
                  ×
                </button>
              </badge_1.Badge>); })}
          </div>)}

        <div className="flex items-end gap-2">
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf,.doc,.docx"/>
          
          <button_1.Button variant="ghost" size="sm" onClick={function () { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }} className="flex-shrink-0">
            <lucide_react_1.Paperclip className="w-4 h-4"/>
          </button_1.Button>

          <div className="flex-1">
            <input_1.Input value={messageText} onChange={function (e) {
            setMessageText(e.target.value);
            if (e.target.value.trim()) {
                handleTypingStart();
            }
            else {
                handleTypingStop();
            }
        }} onKeyPress={handleKeyPress} placeholder="Type a message..." disabled={isSending} className="resize-none"/>
          </div>

          <button_1.Button onClick={handleSendMessage} disabled={(!messageText.trim() && attachments.length === 0) || isSending} size="sm">
            {isSending ? (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/>) : (<lucide_react_1.Send className="w-4 h-4"/>)}
          </button_1.Button>
        </div>
      </div>
    </card_1.Card>);
};
exports.MessageThread = MessageThread;
