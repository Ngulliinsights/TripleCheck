"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TrustScore;
var progress_1 = require("../../local/components/ui/progress");
var utils_1 = require("../../local/lib/utils");
var lucide_react_1 = require("lucide-react");
// Configuration object for trust score thresholds and styling
var TRUST_CONFIG = {
    HIGH: { threshold: 80, color: "text-green-600", bg: "bg-green-600", label: "High Trust" },
    MODERATE: { threshold: 60, color: "text-yellow-600", bg: "bg-yellow-600", label: "Moderate Trust" },
    LOW: { threshold: 0, color: "text-red-600", bg: "bg-red-600", label: "Low Trust" }
};
function TrustScore(_a) {
    var score = _a.score, className = _a.className;
    // Clamp score to valid range (0-100) to prevent display issues
    var clampedScore = Math.max(0, Math.min(100, score));
    // Single function to get trust level configuration based on score
    var getTrustLevel = function (score) {
        if (score >= TRUST_CONFIG.HIGH.threshold)
            return TRUST_CONFIG.HIGH;
        if (score >= TRUST_CONFIG.MODERATE.threshold)
            return TRUST_CONFIG.MODERATE;
        return TRUST_CONFIG.LOW;
    };
    // Get the appropriate configuration for the current score
    var trustLevel = getTrustLevel(clampedScore);
    return (<div className={(0, utils_1.cn)("rounded-lg p-4 bg-muted/50", className)}>
      {/* Header section with icon and title */}
      <div className="flex items-center gap-3 mb-2">
        <lucide_react_1.Shield className={(0, utils_1.cn)("h-5 w-5", trustLevel.color)}/>
        <h3 className="font-semibold">Trust Score</h3>
      </div>
      
      {/* Score display and progress section */}
      <div className="space-y-2">
        {/* Score label and percentage display */}
        <div className="flex justify-between items-center">
          <span className={(0, utils_1.cn)("font-medium", trustLevel.color)}>
            {trustLevel.label}
          </span>
          <span className="font-bold">{clampedScore}%</span>
        </div>
        
        {/* Progress bar with dynamic color */}
        <progress_1.Progress value={clampedScore} className={(0, utils_1.cn)("h-2", "[&>div]:".concat(trustLevel.bg))}/>
        
        {/* Explanatory text */}
        <p className="text-sm text-muted-foreground">
          Based on property verification, owner history, and community feedback
        </p>
      </div>
    </div>);
}
