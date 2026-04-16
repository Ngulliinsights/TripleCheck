"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VerificationBadge;
var badge_1 = require("../../local/components/ui/badge");
var tooltip_1 = require("../../local/components/ui/tooltip");
var utils_1 = require("../../local/lib/utils");
var lucide_react_1 = require("lucide-react");
function VerificationBadge(_a) {
    var status = _a.status, className = _a.className;
    var getStatusConfig = function (status) {
        switch ((status === null || status === void 0 ? void 0 : status.toLowerCase()) || "") {
            case "verified":
                return {
                    icon: lucide_react_1.CheckCircle2,
                    text: "Verified",
                    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                    tooltip: "This property has been verified by our AI system and manual checks",
                };
            case "pending":
                return {
                    icon: lucide_react_1.Clock,
                    text: "Pending",
                    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
                    tooltip: "Property verification is in progress",
                };
            default:
                return {
                    icon: lucide_react_1.AlertCircle,
                    text: "Unverified",
                    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                    tooltip: "This property has not passed our verification checks",
                };
        }
    };
    var config = getStatusConfig(status);
    var Icon = config.icon;
    return (<tooltip_1.TooltipProvider>
      <tooltip_1.Tooltip>
        <tooltip_1.TooltipTrigger>
          <badge_1.Badge variant="secondary" className={(0, utils_1.cn)("flex items-center gap-1 font-medium", config.color, className)}>
            <Icon className="h-3.5 w-3.5"/>
            <span>{config.text}</span>
          </badge_1.Badge>
        </tooltip_1.TooltipTrigger>
        <tooltip_1.TooltipContent>
          <p>{config.tooltip}</p>
        </tooltip_1.TooltipContent>
      </tooltip_1.Tooltip>
    </tooltip_1.TooltipProvider>);
}
