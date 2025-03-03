import { CommunityPost } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityPostCardProps {
  post: CommunityPost;
}

export default function CommunityPostCard({ post }: CommunityPostCardProps) {
  const getCategoryConfig = (category: string) => {
    switch (category.toLowerCase()) {
      case 'fraud':
        return {
          icon: AlertTriangle,
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        };
      case 'success_story':
        return {
          icon: CheckCircle2,
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        };
      default:
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        };
    }
  };

  const config = getCategoryConfig(post.category);
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{post.title}</CardTitle>
          <Badge variant="secondary" className={cn("flex items-center gap-1", config.color)}>
            <Icon className="h-3.5 w-3.5" />
            <span className="capitalize">{post.category}</span>
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {post.location} • {new Date(post.createdAt).toLocaleDateString()}
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
        <div className="mt-4 text-sm text-muted-foreground">
          Posted by {post.isAnonymous ? "Anonymous User" : `User #${post.userId}`}
        </div>
      </CardContent>
    </Card>
  );
}
