import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, AlertCircle, Clock, ShieldCheck, FileCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  status: string;
  className?: string;
  language?: 'en' | 'sw';
}

export default function VerificationBadge({ status, className, language = 'en' }: VerificationBadgeProps) {
  const getStatusConfig = (status: string, language: string) => {
    const translations = {
      verified: {
        en: {
          text: 'Verified',
          tooltip: 'This property has been verified through document checks, site visits, and our AI system'
        },
        sw: {
          text: 'Imethibitishwa',
          tooltip: 'Mali hii imethibitishwa kupitia ukaguzi wa nyaraka, ziara za tovuti, na mfumo wetu wa AI'
        }
      },
      pending: {
        en: {
          text: 'Pending',
          tooltip: 'Property verification is in progress. Documents are being reviewed.'
        },
        sw: {
          text: 'Inasubiri',
          tooltip: 'Uthibitisho wa mali unaendelea. Nyaraka zinakaguliwa.'
        }
      },
      partial: {
        en: {
          text: 'Partial',
          tooltip: 'Some documents have been verified. Additional verification needed.'
        },
        sw: {
          text: 'Kiasi',
          tooltip: 'Baadhi ya nyaraka zimethibitishwa. Uhakiki wa ziada unahitajika.'
        }
      },
      rejected: {
        en: {
          text: 'Unverified',
          tooltip: 'This property has not passed our verification checks. Exercise caution.'
        },
        sw: {
          text: 'Haijathibitishwa',
          tooltip: 'Mali hii haijapitisha ukaguzi wetu. Kuwa mwangalifu.'
        }
      }
    };

    switch (status.toLowerCase()) {
      case 'verified':
        return {
          icon: ShieldCheck,
          text: translations.verified[language].text,
          color: 'bg-[#38A169] text-white',
          tooltip: translations.verified[language].tooltip
        };
      case 'pending':
        return {
          icon: Clock,
          text: translations.pending[language].text,
          color: 'bg-[#DD6B20] text-white',
          tooltip: translations.pending[language].tooltip
        };
      case 'partial':
        return {
          icon: FileCheck,
          text: translations.partial[language].text,
          color: 'bg-[#4299E1] text-white',
          tooltip: translations.partial[language].tooltip
        };
      default:
        return {
          icon: X,
          text: translations.rejected[language].text,
          color: 'bg-red-600 text-white',
          tooltip: translations.rejected[language].tooltip
        };
    }
  };

  const config = getStatusConfig(status, language);
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge
            variant="secondary"
            className={cn(
              "flex items-center gap-1.5 font-medium px-3 py-1",
              config.color,
              className
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{config.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm">
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}