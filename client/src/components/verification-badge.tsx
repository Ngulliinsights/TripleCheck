import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  status: string;
  className?: string;
}

export default function VerificationBadge({ status, className }: VerificationBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
        return {
          icon: CheckCircle2,
          text: 'Verified',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          tooltip: 'This property has been verified by our AI system and manual checks'
        };
      case 'pending':
        return {
          icon: Clock,
          text: 'Pending',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          tooltip: 'Property verification is in progress'
        };
      default:
        return {
          icon: AlertCircle,
          text: 'Unverified',
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          tooltip: 'This property has not passed our verification checks'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant="secondary"
            className={cn(
              "flex items-center gap-1 font-medium",
              config.color,
              className
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{config.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
