import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface TrustScoreProps {
  score: number;
  className?: string;
}

// Configuration object for trust score thresholds and styling
const TRUST_CONFIG = {
  HIGH: { threshold: 80, color: "text-green-600", bg: "bg-green-600", label: "High Trust" },
  MODERATE: { threshold: 60, color: "text-yellow-600", bg: "bg-yellow-600", label: "Moderate Trust" },
  LOW: { threshold: 0, color: "text-red-600", bg: "bg-red-600", label: "Low Trust" }
} as const;

export default function TrustScore({ score, className }: TrustScoreProps) {
  // Clamp score to valid range (0-100) to prevent display issues
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Single function to get trust level configuration based on score
  const getTrustLevel = (score: number) => {
    if (score >= TRUST_CONFIG.HIGH.threshold) return TRUST_CONFIG.HIGH;
    if (score >= TRUST_CONFIG.MODERATE.threshold) return TRUST_CONFIG.MODERATE;
    return TRUST_CONFIG.LOW;
  };

  // Get the appropriate configuration for the current score
  const trustLevel = getTrustLevel(clampedScore);

  return (
    <div className={cn("rounded-lg p-4 bg-muted/50", className)}>
      {/* Header section with icon and title */}
      <div className="flex items-center gap-3 mb-2">
        <Shield className={cn("h-5 w-5", trustLevel.color)} />
        <h3 className="font-semibold">Trust Score</h3>
      </div>
      
      {/* Score display and progress section */}
      <div className="space-y-2">
        {/* Score label and percentage display */}
        <div className="flex justify-between items-center">
          <span className={cn("font-medium", trustLevel.color)}>
            {trustLevel.label}
          </span>
          <span className="font-bold">{clampedScore}%</span>
        </div>
        
        {/* Progress bar with dynamic color */}
        <Progress
          value={clampedScore}
          className={cn("h-2", `[&>div]:${trustLevel.bg}`)}
        />
        
        {/* Explanatory text */}
        <p className="text-sm text-muted-foreground">
          Based on property verification, owner history, and community feedback
        </p>
      </div>
    </div>
  );
}