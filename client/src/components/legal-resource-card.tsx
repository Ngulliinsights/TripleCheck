import { LegalResource } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Scale, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LegalResourceCardProps {
  resource: LegalResource;
}

export default function LegalResourceCard({ resource }: LegalResourceCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'constitutional':
        return Scale;
      case 'statutory':
        return FileText;
      case 'reporting':
        return AlertCircle;
      default:
        return FileText;
    }
  };

  const Icon = getCategoryIcon(resource.category);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {resource.title}
          </CardTitle>
          {resource.link && (
            <a
              href={resource.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View Source
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <Badge variant="secondary" className="capitalize">
          {resource.category}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{resource.description}</p>
        <div className="prose prose-sm max-w-none">
          <p>{resource.content}</p>
        </div>
      </CardContent>
    </Card>
  );
}
