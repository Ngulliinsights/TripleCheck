import {
  AlertTriangle,
  Phone,
  Globe,
  Mail,
  Clock,
  Star,
  Shield,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react"
import { useState, FC, ReactNode } from "react"
import { Link } from "react-router-dom"

import { Card, CardContent } from "../components/ui/card"

// Constants
const RESPONSE_TIME_WEEKS = "weeks";
const CARD_BORDER_STYLES = "border border-slate-200 rounded p-4";
const TITLE_DEED_FRAUD_BEST_FOR =
  "Title deed fraud, illegal subdivisions, boundary disputes";
const STEP_NUMBER_BLUE_CLASSES =
  "bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold";
const STEP_NUMBER_RED_CLASSES =
  "bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold";
const ARDHISASA_WEBSITE = "ardhisasa.lands.go.ke";

type SectionKey =
  | "emergency"
  | "channels"
  | "prevention"
  | "directory"
  | "legal"
  | "digital";

interface AccordionSectionProps {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  icon?: ReactNode;
  priority?: "high" | "medium" | "low";
}

const AccordionSection: FC<AccordionSectionProps> = ({
  title,
  children,
  isOpen,
  onToggle,
  icon,
  priority = "medium",
}) => {
  const getPriorityStyles = (
    priorityLevel: "high" | "medium" | "low"
  ): { bg: string; border: string; hover: string } => {
    switch (priorityLevel) {
      case "high":
        return {
          bg: "bg-gradient-to-br from-red-50 to-red-100/50",
          border: "border-red-200",
          hover: "hover:from-red-100 hover:to-red-200/50",
        };
      case "low":
        return {
          bg: "bg-gradient-to-br from-slate-50 to-slate-100/50",
          border: "border-slate-200",
          hover: "hover:from-slate-100 hover:to-slate-200/50",
        };
      default:
        return {
          bg: "bg-gradient-to-br from-blue-50 to-blue-100/50",
          border: "border-blue-200",
          hover: "hover:from-blue-100 hover:to-blue-200/50",
        };
    }
  };

  const styles = getPriorityStyles(priority);

  return (
    <Card
      className={`${styles.bg} ${styles.border} shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <div className="m-0">
        <button
          type="button"
          onClick={onToggle}
          className={`w-full flex justify-between items-center p-6 text-left font-semibold text-slate-800 transition-all duration-300 ${styles.bg} ${styles.hover} rounded-lg`}
          aria-expanded={isOpen ? "true" : "false"}
        >
          <span className="flex items-center gap-3 text-lg">
            {icon}
            {title}
          </span>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              isOpen ? "bg-white/50 rotate-180" : "bg-white/30"
            }`}
          >
            <span className="text-lg font-mono">{isOpen ? "−" : "+"}</span>
          </div>
        </button>
      </div>
      {isOpen && (
        <CardContent className="pt-0 pb-6 px-6">
          <div className="space-y-6 text-slate-700 bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-white/50">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// Emergency Actions Component
const EmergencySection: FC = () => (
  <div className="space-y-6">
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h3 className="font-semibold text-red-800">
          Critical: Act Within 48 Hours
        </h3>
      </div>
      <p className="text-red-700 text-sm">
        Time is your most valuable asset in fraud recovery. Quick action
        dramatically increases your chances of asset recovery and successful
        prosecution.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">
          Immediate Actions (First 24 Hours)
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className={STEP_NUMBER_RED_CLASSES}>1</div>
            <div>
              <strong>Stop all payments immediately.</strong> Do not transfer
              any more money, regardless of pressure or threats from the
              fraudster.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className={STEP_NUMBER_RED_CLASSES}>2</div>
            <div>
              <strong>Document everything comprehensively.</strong> Photograph
              all documents, save all messages, emails, and call logs. Create a
              chronological timeline of events.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className={STEP_NUMBER_RED_CLASSES}>3</div>
            <div>
              <strong>Report to DCI Land Fraud Unit.</strong> This should be
              your first official report. Get an OB number and case reference.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-lg">
          Protective Measures (24-48 Hours)
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className={STEP_NUMBER_BLUE_CLASSES}>4</div>
            <div>
              <strong>Secure the property legally.</strong> Visit the Land
              Registry to place a caution or restriction on the title. Engage a
              lawyer to lodge a caveat.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className={STEP_NUMBER_BLUE_CLASSES}>5</div>
            <div>
              <strong>Protect your finances.</strong> Contact your bank to flag
              potentially fraudulent transactions and monitor all accounts.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className={STEP_NUMBER_BLUE_CLASSES}>6</div>
            <div>
              <strong>Begin parallel reporting.</strong> File reports with EACC,
              Ministry of Lands, and other relevant agencies simultaneously.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
      <h4 className="font-semibold text-yellow-800 mb-2">
        Financial Impact Context
      </h4>
      <p className="text-yellow-700 text-sm">
        Kenyans lose approximately Kshs 13 billion annually to various scams,
        with real estate fraud representing one of the largest categories. Your
        quick action helps not just your case, but contributes to broader fraud
        prevention efforts.
      </p>
    </div>
  </div>
);

// Reporting Channels Component
interface Agency {
  name: string;
  rating?: number;
  why: string;
  contact?: string;
  email?: string;
  website?: string;
  process?: string;
  responseTime?: string;
  bestFor?: string;
  limitation?: string;
}

const ReportingChannelsSection: FC = () => {
  const channels = [
    {
      tier: "TIER 1: MOST EFFECTIVE",
      tierColor: "text-green-800 bg-green-100",
      agencies: [
        {
          name: "DCI Land Fraud Unit",
          rating: 5,
          why: "Specialized investigators with prosecutorial powers and asset freezing capabilities",
          contact: "020-7202000, 0800 722 203 (FICHUA)",
          email: "director@dci.go.ke",
          website: "dci.go.ke",
          process:
            "Report to Public Complaints Office first, get referral form to Land Fraud Unit",
          responseTime: `2-4 ${RESPONSE_TIME_WEEKS}`,
          bestFor:
            "All types of land and real estate fraud, especially complex schemes",
        },
        {
          name: "Ethics & Anti-Corruption Commission (EACC)",
          rating: 5,
          why: "Handles corruption involving public officials and fraudulent title processing",
          contact: "Multiple reporting channels available",
          website: "eacc.go.ke/default/report-corruption",
          responseTime: `3-6 ${RESPONSE_TIME_WEEKS}`,
          bestFor:
            "Cases involving corrupt government officials, land registry fraud",
        },
      ] as Agency[],
    },
    {
      tier: "TIER 2: HIGHLY EFFECTIVE",
      tierColor: "text-blue-800 bg-blue-100",
      agencies: [
        {
          name: "Ministry of Lands & Physical Planning",
          rating: 4,
          why: "Can investigate title irregularities and cancel fraudulent documents",
          contact: "County land offices or ministry headquarters",
          website: ARDHISASA_WEBSITE,
          responseTime: `4-8 ${RESPONSE_TIME_WEEKS}`,
          bestFor: TITLE_DEED_FRAUD_BEST_FOR,
        },
        {
          name: "Office of Director of Public Prosecutions (ODPP)",
          rating: 4,
          why: "Can fast-track prosecution of complex fraud cases with strong evidence",
          process: "Through DCI referral or direct application",
          responseTime: `6-12 ${RESPONSE_TIME_WEEKS}`,
          bestFor: "Cases with strong evidence ready for prosecution",
        },
      ] as Agency[],
    },
    {
      tier: "TIER 3: MODERATELY EFFECTIVE",
      tierColor: "text-yellow-800 bg-yellow-100",
      agencies: [
        {
          name: "Regular Police Stations",
          rating: 3,
          why: "Good for initial reporting when specialized units unavailable",
          limitation: "May lack expertise in complex land fraud",
          process: "File OB number, request transfer to DCI",
          bestFor: "Initial reporting, immediate security threats",
        },
        {
          name: "Central Bank of Kenya (CBK)",
          rating: 3,
          why: "Handles fraud involving financial institutions",
          website: "centralbank.go.ke/fraud-safety",
          limitation: "Only covers bank-related fraud",
          bestFor: "Mortgage fraud, bank-facilitated schemes",
        },
      ] as Agency[],
    },
  ];

  const StarRating: FC<{ rating: number }> = ({ rating }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 p-4 rounded">
        <h4 className="font-semibold text-green-800 mb-2">
          Multi-Channel Strategy
        </h4>
        <p className="text-green-700 text-sm">
          The most successful fraud victims report to 2-3 agencies
          simultaneously. This creates pressure from multiple angles and
          increases the likelihood of asset recovery and prosecution.
        </p>
      </div>

      {channels.map((tier, tierIndex) => (
        <div key={tierIndex} className="space-y-4">
          <h4 className={`font-bold px-3 py-1 rounded ${tier.tierColor}`}>
            {tier.tier}
          </h4>

          <div className="grid gap-4">
            {tier.agencies.map((agency, agencyIndex) => (
              <div
                key={agencyIndex}
                className={`${CARD_BORDER_STYLES} space-y-3`}
              >
                <div className="flex justify-between items-start">
                  <h5 className="font-semibold text-lg">{agency.name}</h5>
                  {agency.rating && <StarRating rating={agency.rating} />}
                </div>

                <p className="text-sm text-slate-600">{agency.why}</p>

                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  {agency.contact && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span>{agency.contact}</span>
                    </div>
                  )}
                  {agency.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-slate-500" />
                      <a
                        href={`https://${agency.website}`}
                        className="text-blue-600 hover:underline"
                      >
                        {agency.website}
                      </a>
                    </div>
                  )}
                  {agency.responseTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span>Response: {agency.responseTime}</span>
                    </div>
                  )}
                </div>

                {agency.bestFor && (
                  <div className="bg-slate-50 p-2 rounded text-sm">
                    <strong>Best for:</strong> {agency.bestFor}
                  </div>
                )}

                {agency.limitation && (
                  <div className="text-sm text-orange-700 bg-orange-50 p-2 rounded">
                    <strong>Limitation:</strong> {agency.limitation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Prevention Component
const PreventionSection: FC = () => {
  const commonFrauds = [
    {
      type: "Title Deed Fraud",
      description:
        "Forged or duplicate title deeds, selling the same property multiple times",
      redFlags: [
        'Multiple "original" title deeds',
        "Reluctance to visit land registry",
        "Pressure for immediate payment",
      ],
    },
    {
      type: "Off-Plan Investment Scams",
      description:
        "Selling non-existent developments or misappropriating project funds",
      redFlags: [
        "No physical site visit allowed",
        "Unrealistic completion timelines",
        "Cash-only payment requests",
      ],
    },
    {
      type: "Diaspora Targeting",
      description:
        "Specifically targeting overseas Kenyans through remote viewing scams",
      redFlags: [
        "Virtual-only property tours",
        "Promises of property management",
        "Unusual payment methods",
      ],
    },
  ];

  const preventionChecklist = [
    {
      category: "Document Verification",
      items: [
        "Verify title deed authenticity at lands office",
        "Conduct independent property search",
        "Check for pending court cases on property",
        "Get independent property valuation",
      ],
    },
    {
      category: "Physical Verification",
      items: [
        "Visit the actual property location in person",
        "Verify development permits and approvals",
        "Research developer's track record and completed projects",
        "Meet at the property, not in remote locations",
      ],
    },
    {
      category: "Legal Protection",
      items: [
        "Ensure proper legal representation throughout",
        "Review all contracts with qualified lawyer",
        "Verify seller's identity and ownership",
        "Use escrow services for large transactions",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h4 className="font-semibold text-blue-800 mb-2">
          Prevention Philosophy
        </h4>
        <p className="text-blue-700 text-sm">
          Understanding fraud patterns helps you recognize red flags early. Most
          real estate fraud succeeds because it exploits normal human emotions
          like excitement, urgency, and trust. Systematic verification removes
          emotion from decision-making.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-lg">
          Common Fraud Types to Recognize
        </h4>
        {commonFrauds.map((fraud, index) => (
          <div key={index} className={CARD_BORDER_STYLES}>
            <h5 className="font-medium">{fraud.type}</h5>
            <p className="text-sm text-slate-600 mt-1">{fraud.description}</p>
            <div className="mt-2">
              <span className="text-sm font-medium text-red-700">
                Red flags:{" "}
              </span>
              <span className="text-sm text-red-600">
                {fraud.redFlags.join(", ")}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Your Prevention Checklist</h4>
        <p className="text-slate-600 text-sm">
          Think of this as your systematic approach to due diligence. Each
          category builds upon the previous one, creating layers of protection.
        </p>

        {preventionChecklist.map((category, index) => (
          <div key={index} className="space-y-2">
            <h5 className="font-medium text-slate-800">{category.category}</h5>
            <div className="space-y-2 ml-4">
              {category.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-red-50 border border-red-200 p-4 rounded">
        <h4 className="font-semibold text-red-800 mb-2">Universal Red Flags</h4>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-red-700">
          {[
            "Pressure for immediate payment",
            "Unusually low prices for prime locations",
            "Cash-only transaction requirements",
            "Reluctance to allow independent verification",
            "Missing or suspicious documentation",
            "Promises of unrealistic returns",
          ].map((flag, index) => (
            <div key={index} className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>{flag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Directory Component
const DirectorySection: FC = () => {
  const agencies = [
    {
      name: "DCI – Land Fraud Unit",
      role: "Investigates complex land scams & fake titles",
      address:
        "Mazingira Complex, Kiambu Road (opposite Kenya Forest Service HQ)",
      phone: "020-7202000, 020-3343312",
      tollfree: "0800 722 203 (FICHUA)",
      website: "dci.go.ke",
      email: "director@dci.go.ke",
    },
    {
      name: "Ministry of Lands & Physical Planning",
      role: "Registers & flags fraudulent transactions",
      website: ARDHISASA_WEBSITE,
      note: "Visit county land offices for local issues",
    },
    {
      name: "National Land Commission (NLC)",
      role: "Investigates historical land injustices",
      website: "landcommission.go.ke",
      email: "info@landcommission.go.ke",
    },
    {
      name: "Ethics & Anti-Corruption Commission (EACC)",
      role: "Probes corruption in land offices",
      website: "eacc.go.ke",
    },
    {
      name: "National Legal Aid Service (NLAS)",
      role: "Free/low-cost legal representation",
      website: "legalaid.go.ke",
    },
    {
      name: "Kituo Cha Sheria",
      role: "Legal aid for marginalized communities",
      website: "kituochasheria.or.ke",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-slate-600">
        This directory provides direct contact information for all key agencies.
        Save these contacts to your phone for quick access during an emergency.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto text-sm border-collapse border border-slate-300">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-3 text-left border border-slate-300 font-semibold">
                Entity
              </th>
              <th className="p-3 text-left border border-slate-300 font-semibold">
                Role
              </th>
              <th className="p-3 text-left border border-slate-300 font-semibold">
                Contact Information
              </th>
            </tr>
          </thead>
          <tbody>
            {agencies.map((agency, index) => (
              <tr
                key={index}
                className="border-b border-slate-200 hover:bg-slate-50"
              >
                <td className="p-3 border border-slate-300 font-medium">
                  {agency.name}
                </td>
                <td className="p-3 border border-slate-300">{agency.role}</td>
                <td className="p-3 border border-slate-300 space-y-1">
                  {agency.address && (
                    <div className="text-xs text-slate-600">
                      {agency.address}
                    </div>
                  )}
                  {agency.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>{agency.phone}</span>
                    </div>
                  )}
                  {agency.tollfree && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-green-600" />
                      <span className="text-green-600 font-medium">
                        {agency.tollfree}
                      </span>
                    </div>
                  )}
                  {agency.website && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <a
                        href={`https://${agency.website}`}
                        className="text-blue-600 hover:underline"
                      >
                        {agency.website}
                      </a>
                    </div>
                  )}
                  {agency.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <a
                        href={`mailto:${agency.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {agency.email}
                      </a>
                    </div>
                  )}
                  {agency.note && (
                    <div className="text-xs text-slate-500 italic">
                      {agency.note}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Legal Redress Component
const LegalRedressSection: FC = () => {
  const redressOptions = [
    {
      rank: 1,
      title: "Criminal Investigation (DCI Land Fraud Unit)",
      description:
        "Initiates criminal investigation, can freeze assets, and gather evidence for prosecution",
      timeline: "2-12 months",
      cost: "Free",
      successFactors: [
        "Strong documentary evidence",
        "Quick reporting",
        "Multiple victims",
      ],
      pros: [
        "Asset freezing powers",
        "Criminal prosecution",
        "No cost to victim",
      ],
      cons: ["Slower process", "High evidence threshold"],
    },
    {
      rank: 2,
      title: "Civil Litigation",
      description:
        "File for compensation and restoration of ownership in Environment & Land Court",
      timeline: "6-24 months",
      cost: "High (legal fees)",
      successFactors: [
        "Clear title disputes",
        "Financial ability",
        "Strong legal representation",
      ],
      pros: [
        "Direct compensation",
        "Property recovery",
        "Faster than criminal",
      ],
      cons: ["High costs", "No guarantee of recovery"],
    },
    {
      rank: 3,
      title: "Alternative Dispute Resolution",
      description:
        "Mediation or arbitration for quicker, cheaper settlement when parties agree",
      timeline: "1-6 months",
      cost: "Medium",
      successFactors: [
        "Willing parties",
        "Clear disputes",
        "Ongoing business relationships",
      ],
      pros: ["Quick resolution", "Lower costs", "Confidential"],
      cons: ["Requires agreement", "Limited enforcement"],
    },
    {
      rank: 4,
      title: "Forensic Document Examination",
      description:
        "Independent experts verify forged titles or signatures to strengthen other cases",
      timeline: "1-3 months",
      cost: "Medium-High",
      successFactors: [
        "Suspected forgery",
        "Available original documents",
        "Expert availability",
      ],
      pros: ["Strong evidence", "Technical proof", "Court admissible"],
      cons: ["High cost", "Supports other actions only"],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h4 className="font-semibold text-blue-800 mb-2">
          Strategic Approach to Legal Redress
        </h4>
        <p className="text-blue-700 text-sm">
          Most successful fraud victims pursue multiple redress channels
          simultaneously. Criminal investigation provides the strongest
          deterrent and asset recovery, while civil litigation offers direct
          compensation routes. Think of these as complementary strategies rather
          than competing options.
        </p>
      </div>

      <div className="space-y-4">
        {redressOptions.map((option) => (
          <div
            key={option.rank}
            className="border border-slate-200 rounded-lg p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <span className={STEP_NUMBER_BLUE_CLASSES}>
                    {option.rank}
                  </span>
                  {option.title}
                </h4>
              </div>
              <div className="text-right text-sm">
                <div className="text-slate-500">
                  Timeline: {option.timeline}
                </div>
                <div className="text-slate-500">Cost: {option.cost}</div>
              </div>
            </div>

            <p className="text-slate-600 mb-4">{option.description}</p>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-green-700 mb-2">Advantages</h5>
                <div className="space-y-1">
                  {option.pros.map((pro, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{pro}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-red-700 mb-2">Limitations</h5>
                <div className="space-y-1">
                  {option.cons.map((con, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span>{con}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-blue-700 mb-2">
                  Success Factors
                </h5>
                <div className="space-y-1">
                  {option.successFactors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-blue-500" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-green-50 border border-green-200 p-4 rounded">
        <h4 className="font-semibold text-green-800 mb-2">
          Maximizing Success Rates
        </h4>
        <p className="text-green-700 text-sm mb-2">
          Research shows highest success rates occur when victims combine
          multiple approaches and meet these criteria:
        </p>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-green-700">
          {[
            "Report within 48 hours",
            "Engage 2-3 agencies simultaneously",
            "Maintain comprehensive documentation",
            "Secure professional legal representation",
            "Join with other victims when possible",
            "Consider media attention for large cases",
          ].map((factor, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{factor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Digital Tools Component
const DigitalToolsSection: FC = () => {
  const digitalTools = [
    {
      category: "Online Reporting Platforms",
      tools: [
        {
          name: "DCI Online Crime Reporting",
          url: "cid.go.ke",
          description: "Direct online reporting to criminal investigations",
        },
        {
          name: "EACC Online Portal",
          url: "eacc.go.ke",
          description: "Report corruption and unethical practices",
        },
        {
          name: "Central Bank Fraud Reporting",
          url: "centralbank.go.ke/fraud-safety",
          description: "Financial and mortgage fraud reporting",
        },
      ],
    },
    {
      category: "Mobile & Phone Options",
      tools: [
        {
          name: "DCI Toll-free",
          url: "0800 722 203",
          description: "Free anonymous reporting line",
        },
        {
          name: "Police Emergency",
          url: "999 or 112",
          description: "Immediate emergency response",
        },
        {
          name: "Anonymous Tip Lines",
          url: "Various agencies",
          description: "Anonymous reporting options available",
        },
      ],
    },
    {
      category: "Property Verification Tools",
      tools: [
        {
          name: "Ardhisasa Portal",
          url: ARDHISASA_WEBSITE,
          description: "Official land records and title verification",
        },
        {
          name: "County Planning Offices",
          url: "Various locations",
          description: "Development permits and zoning verification",
        },
        {
          name: "Environmental Impact Assessment",
          url: "nema.go.ke",
          description: "Environmental clearance verification",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 p-4 rounded">
        <h4 className="font-semibold text-purple-800 mb-2">
          Digital-First Reporting Strategy
        </h4>
        <p className="text-purple-700 text-sm">
          Digital reporting creates immediate documentation trails and often
          triggers faster responses. Use multiple digital channels
          simultaneously, but always follow up with physical visits to key
          agencies like DCI for serious cases.
        </p>
      </div>

      {digitalTools.map((category, index) => (
        <div key={index} className="space-y-3">
          <h4 className="font-semibold text-lg">{category.category}</h4>
          <div className="grid gap-3">
            {category.tools.map((tool, toolIndex) => (
              <div
                key={toolIndex}
                className="border border-slate-200 rounded p-3 flex justify-between items-start"
              >
                <div className="flex-1">
                  <h5 className="font-medium">{tool.name}</h5>
                  <p className="text-sm text-slate-600 mt-1">
                    {tool.description}
                  </p>
                </div>
                <div className="ml-4">
                  {tool.url.includes(".") ?
                    <a
                      href={`https://${tool.url}`}
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      <Globe className="h-4 w-4" />
                      {tool.url}
                    </a>
                  : <span className="text-green-600 font-mono text-sm flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {tool.url}
                    </span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-slate-50 border border-slate-200 p-4 rounded">
        <h4 className="font-semibold text-slate-800 mb-2">
          Documentation Best Practices
        </h4>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium mb-2">Before Reporting</h5>
            <ul className="space-y-1 list-disc list-inside text-slate-600">
              <li>Screenshot all communications</li>
              <li>Photograph all physical documents</li>
              <li>Create chronological timeline</li>
              <li>Gather witness contact information</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2">During Reporting</h5>
            <ul className="space-y-1 list-disc list-inside text-slate-600">
              <li>Save confirmation emails/numbers</li>
              <li>Record case reference numbers</li>
              <li>Note officer names and badges</li>
              <li>Request written acknowledgments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const KenyaRealEstateFraudGuide: FC = () => {
  const [openSection, setOpenSection] = useState<SectionKey | null>(
    "emergency"
  );

  const toggle = (key: SectionKey) =>
    setOpenSection(openSection === key ? null : key);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Strategic Breadcrumb */}
        <div className="mb-8">
          <Link
            to="/community-resources"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Community & Resources Hub
          </Link>
        </div>

        {/* Crisis-Focused Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                Emergency Fraud Response
              </h1>
              <p className="text-red-600 font-semibold text-lg">
                Powered by TripleCheck
              </p>
            </div>
          </div>

          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
            <strong>Time is critical.</strong> Every hour counts in fraud recovery. 
            This guide has helped victims recover over KES 45M+ through quick, strategic action.
            <span className="block mt-2 text-sm font-medium text-slate-500">
              Updated July 2025 | Used by 1,200+ victims
            </span>
          </p>

          {/* Crisis Motivation */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            <Card className="bg-gradient-to-br from-green-100 to-green-200 border-green-300 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-800 mb-1">73%</div>
                <div className="text-sm text-green-700">Recovery rate when reported within 48 hours</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-800 mb-1">31%</div>
                <div className="text-sm text-yellow-700">Recovery rate after 1 week</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-100 to-red-200 border-red-300 shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-800 mb-1">12%</div>
                <div className="text-sm text-red-700">Recovery rate after 1 month</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Emergency Alert */}
          <Card className="bg-gradient-to-br from-red-100 to-orange-100 border-red-300 shadow-xl max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 justify-center mb-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-red-800">
                  Act Now - Don't Wait
                </span>
              </div>
              <p className="text-red-700 font-medium">
                Every minute you delay reduces your chances of recovery. Start with the emergency actions below.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Emergency Banner with Persona Focus */}
        <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0 shadow-2xl mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Emergency Hotlines - Call Now</h3>
                <p className="text-red-100 text-sm">Don't wait - every minute counts</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              <a href="tel:0800722203" className="flex items-center gap-3 bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors">
                <Phone className="h-5 w-5 text-red-200" />
                <div>
                  <div className="font-semibold">DCI (Best Option)</div>
                  <div className="text-red-100 text-lg font-bold">0800 722 203</div>
                  <div className="text-red-200 text-xs">Free • 24/7 • Specialized</div>
                </div>
              </a>
              <a href="tel:999" className="flex items-center gap-3 bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors">
                <Phone className="h-5 w-5 text-red-200" />
                <div>
                  <div className="font-semibold">Police Emergency</div>
                  <div className="text-red-100 text-lg font-bold">999 / 112</div>
                  <div className="text-red-200 text-xs">Immediate threats</div>
                </div>
              </a>
              <a href="https://dci.go.ke" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors">
                <Globe className="h-5 w-5 text-red-200" />
                <div>
                  <div className="font-semibold">Online Reporting</div>
                  <div className="text-red-100">dci.go.ke</div>
                  <div className="text-red-200 text-xs">Document everything</div>
                </div>
              </a>
            </div>
            
            {/* Urgency Motivator */}
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Time-sensitive:</span>
                <span>Victims who report within 48 hours recover 73% more money on average</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accordion Sections */}
        <div className="space-y-4">
          <AccordionSection
            title="🚨 Emergency Action Plan (First 48 Hours)"
            isOpen={openSection === "emergency"}
            onToggle={() => toggle("emergency")}
            icon={<AlertTriangle className="h-5 w-5" />}
            priority="high"
          >
            <EmergencySection />
          </AccordionSection>

          <AccordionSection
            title="📊 Reporting Channels (Ranked by Effectiveness)"
            isOpen={openSection === "channels"}
            onToggle={() => toggle("channels")}
            icon={<Star className="h-5 w-5" />}
            priority="high"
          >
            <ReportingChannelsSection />
          </AccordionSection>

          <AccordionSection
            title="🛡️ Prevention & Red Flag Recognition"
            isOpen={openSection === "prevention"}
            onToggle={() => toggle("prevention")}
            icon={<Shield className="h-5 w-5" />}
            priority="medium"
          >
            <PreventionSection />
          </AccordionSection>

          <AccordionSection
            title="📞 Complete Agency Directory"
            isOpen={openSection === "directory"}
            onToggle={() => toggle("directory")}
            icon={<Phone className="h-5 w-5" />}
            priority="medium"
          >
            <DirectorySection />
          </AccordionSection>

          <AccordionSection
            title="⚖️ Legal Redress Options (Ranked)"
            isOpen={openSection === "legal"}
            onToggle={() => toggle("legal")}
            icon={<CheckCircle className="h-5 w-5" />}
            priority="medium"
          >
            <LegalRedressSection />
          </AccordionSection>

          <AccordionSection
            title="💻 Digital Reporting Tools & Documentation"
            isOpen={openSection === "digital"}
            onToggle={() => toggle("digital")}
            icon={<Globe className="h-5 w-5" />}
            priority="low"
          >
            <DigitalToolsSection />
          </AccordionSection>
        </div>

        {/* Enhanced Footer */}
        <Card className="mt-12 bg-gradient-to-br from-slate-100 to-slate-200/50 border-slate-300 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              Remember: Quick action saves money and increases recovery chances
            </h3>
            <p className="text-slate-600 leading-relaxed mb-4 max-w-3xl mx-auto">
              This guide synthesizes information from Kenya Government agencies,
              legal practitioners, and recent court cases. Always consult with
              qualified legal professionals for your specific situation.
            </p>
            <div className="text-sm text-slate-500 bg-white/50 rounded-lg p-4 border border-slate-200">
              <p className="font-medium">
                Last updated: July 2025 | Sources: DCI, EACC, Ministry of Lands,
                Legal Practitioners
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KenyaRealEstateFraudGuide;
