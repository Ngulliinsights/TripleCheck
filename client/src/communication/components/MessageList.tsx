import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, User } from 'lucide-react'
import React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '../../local/components/ui/avatar'
import { Badge } from '../../local/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../local/components/ui/card'

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface MessageListProps {
  messages: Message[];
  onMessageClick?: (message: Message) => void;
  emptyMessage?: string;
}

export function MessageList({ 
  messages, 
  onMessageClick, 
  emptyMessage = "No messages found" 
}: MessageListProps) {
  const getPriorityColor = (priority: Message['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (messages.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages ({messages.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
              !message.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
            }`}
            onClick={() => onMessageClick?.(message)}
          >
            <div className="flex items-start space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                <AvatarFallback>
                  {getInitials(message.senderName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-sm font-medium truncate ${
                      !message.isRead ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {message.senderName}
                    </h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(message.priority)}`}
                    >
                      {message.priority}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </span>
                </div>
                
                <h5 className={`text-sm mb-1 truncate ${
                  !message.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                }`}>
                  {message.subject}
                </h5>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {message.content}
                </p>
                
                {!message.isRead && (
                  <div className="flex items-center mt-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-xs text-blue-600 font-medium">Unread</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}