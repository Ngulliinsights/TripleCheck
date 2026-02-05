/**
 * Message Thread Component
 * Displays a conversation thread with real-time messaging
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Paperclip, MoreVertical, Phone, Video, Info } from 'lucide-react'
import { useMessages, useMessaging, useTypingIndicators, Message, MessageType } from '../hooks/useMessaging'
import { Button } from '../../shared/components/ui/button'
import { Input } from '../../shared/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../shared/components/ui/avatar'
import { Badge } from '../../shared/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../shared/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../shared/components/ui/dropdown-menu'
import { ScrollArea } from '../../shared/components/ui/scroll-area'

interface MessageThreadProps {
  threadId: string;
  recipientId: string;
  recipientName?: string;
  recipientAvatar?: string;
  propertyId?: string;
  onClose?: () => void;
  className?: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onRetry?: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, showAvatar = true, onRetry }) => {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = () => {
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

  const getMessageTypeIcon = () => {
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

  return (
    <div className={`flex items-end gap-2 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {showAvatar && !isOwn && (
        <Avatar className="w-8 h-8">
          <AvatarImage src={`/api/users/${message.senderId}/avatar`} />
          <AvatarFallback>{message.senderId.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          } ${message.status === 'failed' ? 'border-2 border-red-300' : ''}`}
        >
          {getMessageTypeIcon() && (
            <div className="flex items-center gap-2 mb-1 text-sm opacity-75">
              <span>{getMessageTypeIcon()}</span>
              <span className="capitalize">{message.messageType.replace('_', ' ')}</span>
            </div>
          )}
          
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 text-xs opacity-75">
                  <Paperclip className="w-3 h-3" />
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate"
                  >
                    {attachment.fileName}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <span>{formatTime(message.createdAt)}</span>
          {isOwn && <span className="ml-1">{getStatusIcon()}</span>}
        </div>
      </div>
    </div>
  );
};

const TypingIndicator: React.FC<{ users: string[] }> = ({ users }) => {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
      <Avatar className="w-8 h-8">
        <AvatarFallback>{users[0].substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-sm">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-gray-500 ml-2">
            {users.length === 1 ? 'typing...' : `${users.length} people typing...`}
          </span>
        </div>
      </div>
    </div>
  );
};

export const MessageThread: React.FC<MessageThreadProps> = ({
  threadId,
  recipientId,
  recipientName = 'User',
  recipientAvatar,
  propertyId,
  onClose,
  className = ''
}) => {
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { messages, isLoading, refetch } = useMessages(threadId);
  const { sendMessage, markMessagesAsRead, setTypingIndicator, isSending } = useMessaging();
  const typingUsers = useTypingIndicators(threadId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Mark messages as read when thread is viewed
  useEffect(() => {
    const unreadMessages = messages.filter(msg => 
      msg.recipientId === 'current_user_id' && !msg.readAt
    );
    
    if (unreadMessages.length > 0) {
      markMessagesAsRead(unreadMessages.map(msg => msg.id));
    }
  }, [messages, markMessagesAsRead]);

  // Handle typing indicator
  const handleTypingStart = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      setTypingIndicator(threadId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTypingIndicator(threadId, false);
    }, 3000);
  }, [isTyping, threadId, setTypingIndicator]);

  const handleTypingStop = useCallback(() => {
    if (isTyping) {
      setIsTyping(false);
      setTypingIndicator(threadId, false);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [isTyping, threadId, setTypingIndicator]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() && attachments.length === 0) return;

    const messageType: MessageType = propertyId ? 'property_inquiry' : 'text';

    try {
      await sendMessage({
        threadId,
        recipientId,
        content: messageText.trim(),
        messageType,
        propertyId,
        attachments: attachments.length > 0 ? attachments : undefined
      });

      setMessageText('');
      setAttachments([]);
      handleTypingStop();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [messageText, attachments, threadId, recipientId, propertyId, sendMessage, handleTypingStop]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const retryMessage = useCallback(async (messageId: string) => {
    // In a real implementation, you'd retry sending the failed message
    console.log('Retrying message:', messageId);
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <CardHeader className="flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={recipientAvatar} />
              <AvatarFallback>{recipientName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{recipientName}</CardTitle>
              <p className="text-sm text-gray-500">
                {typingUsers.length > 0 ? 'typing...' : 'Active now'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice call</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Video className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Video call</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Info className="w-4 h-4 mr-2" />
                  Thread Info
                </DropdownMenuItem>
                <DropdownMenuItem>Archive Thread</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Block User</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => {
                const isOwn = message.senderId === 'current_user_id'; // Replace with actual current user ID
                const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                
                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    onRetry={() => retryMessage(message.id)}
                  />
                );
              })}
              
              <TypingIndicator users={typingUsers} />
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Message Input */}
      <div className="flex-shrink-0 border-t p-4">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                <span className="truncate max-w-20">{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.doc,.docx"
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <div className="flex-1">
            <Input
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                if (e.target.value.trim()) {
                  handleTypingStart();
                } else {
                  handleTypingStop();
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isSending}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={(!messageText.trim() && attachments.length === 0) || isSending}
            size="sm"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};