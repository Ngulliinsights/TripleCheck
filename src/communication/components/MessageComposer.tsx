import { Send, X } from 'lucide-react'
import React, { useState } from 'react'

import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Input } from '../../shared/components/ui/input'
import { Label } from '../../shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select'
import { Textarea } from '../../shared/components/ui/textarea'

interface MessageComposerProps {
  recipientId?: string;
  recipientName?: string;
  onSend: (message: {
    recipientId: string;
    subject: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function MessageComposer({
  recipientId = '',
  recipientName = '',
  onSend,
  onCancel,
  isLoading = false,
}: MessageComposerProps) {
  const [formData, setFormData] = useState({
    recipientId,
    recipientName,
    subject: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipientId || !formData.subject.trim() || !formData.content.trim()) {
      return;
    }

    onSend({
      recipientId: formData.recipientId,
      subject: formData.subject.trim(),
      content: formData.content.trim(),
      priority: formData.priority,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.recipientId && formData.subject.trim() && formData.content.trim();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold">Compose Message</CardTitle>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient */}
          <div className="space-y-2">
            <Label htmlFor="recipient">To</Label>
            {recipientName ? (
              <div className="p-2 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">{recipientName}</span>
              </div>
            ) : (
              <Input
                id="recipient"
                placeholder="Enter recipient name or ID"
                value={formData.recipientName}
                onChange={(e) => handleInputChange('recipientName', e.target.value)}
                disabled={isLoading}
              />
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleInputChange('priority', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter message subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Type your message here..."
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              disabled={isLoading}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={!isFormValid || isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}