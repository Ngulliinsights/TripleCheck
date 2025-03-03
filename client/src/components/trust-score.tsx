import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface TrustScoreProps {
  score: number;
  className?: string;
}

export default function TrustScore({ score, className }: TrustScoreProps) {
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  // Get label based on score
  const getScoreLabel = (score: number) => {
    if (score >= 80) return "High Trust";
    if (score >= 60) return "Moderate Trust";
    return "Low Trust";
  };

  // Get progress color based on score
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <div className={cn("rounded-lg p-4 bg-muted/50", className)}>
      <div className="flex items-center gap-3 mb-2">
        <Shield className={cn("h-5 w-5", getScoreColor(score))} />
        <h3 className="font-semibold">Trust Score</h3>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className={cn("font-medium", getScoreColor(score))}>
            {getScoreLabel(score)}
          </span>
          <span className="font-bold">{score}%</span>
        </div>
        <Progress
          value={score}
          className="h-2"
          indicatorClassName={getProgressColor(score)}
        />
        <p className="text-sm text-muted-foreground">
          Based on property verification, owner history, and community feedback
        </p>
      </div>
    </div>
  );
}
