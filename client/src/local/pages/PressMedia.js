"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PressMediaPage;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../components/ui/badge");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
var date_utils_1 = require("../utils/date-utils");
// Memoized components for better performance
var PressReleaseCard = (0, react_1.memo)(function (_a) {
    var release = _a.release;
    return (<article className="border-l-4 border-[#2C5282] pl-6 py-2">
    <div className="flex items-start justify-between mb-2">
      <h3 className="text-lg font-semibold text-gray-800 leading-tight">
        {release.title}
      </h3>
      <badge_1.Badge className="bg-[#2C5282] text-white ml-4 shrink-0">
        {release.category}
      </badge_1.Badge>
    </div>
    <div className="flex items-center text-sm text-gray-500 mb-2">
      <lucide_react_1.Calendar className="h-4 w-4 mr-1" aria-hidden="true"/>
      <time dateTime={release.date}>
        {(0, date_utils_1.formatPressDate)(release.date)}
      </time>
    </div>
    <p className="text-gray-600 mb-3 leading-relaxed">{release.excerpt}</p>
    <button_1.Button variant="outline" size="sm" aria-label={"Read full press release: ".concat(release.title)}>
      Read Full Release{" "}
      <lucide_react_1.ExternalLink className="ml-2 h-4 w-4" aria-hidden="true"/>
    </button_1.Button>
  </article>);
});
var MediaKitItemCard = (0, react_1.memo)(function (_a) {
    var item = _a.item;
    var getIcon = function () {
        switch (item.type) {
            case "image":
                return <lucide_react_1.Image className="h-6 w-6 text-[#2C5282]" aria-hidden="true"/>;
            case "document":
                return (<lucide_react_1.FileText className="h-6 w-6 text-[#2C5282]" aria-hidden="true"/>);
            case "video":
                return <lucide_react_1.Video className="h-6 w-6 text-[#2C5282]" aria-hidden="true"/>;
            default:
                return (<lucide_react_1.FileText className="h-6 w-6 text-[#2C5282]" aria-hidden="true"/>);
        }
    };
    return (<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-3">
        {getIcon()}
        <div>
          <p className="font-medium text-gray-800">{item.name}</p>
          <p className="text-sm text-gray-500">{item.size}</p>
        </div>
      </div>
      <button_1.Button variant="ghost" size="sm" aria-label={"Download ".concat(item.name)} className="hover:bg-[#2C5282] hover:text-white transition-colors">
        <lucide_react_1.Download className="h-4 w-4" aria-hidden="true"/>
      </button_1.Button>
    </div>);
});
var MediaFeatureCard = (0, react_1.memo)(function (_a) {
    var feature = _a.feature;
    return (<article className="flex items-center justify-between p-4 border rounded-lg hover:border-[#2C5282] transition-colors">
    <div>
      <h3 className="font-semibold text-gray-800 mb-1">{feature.title}</h3>
      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span className="font-medium">{feature.outlet}</span>
        <span aria-hidden="true">•</span>
        <time dateTime={feature.date}>
          {(0, date_utils_1.formatMediaDate)(feature.date)}
        </time>
        <badge_1.Badge variant="outline">{feature.type}</badge_1.Badge>
      </div>
    </div>
    <button_1.Button variant="outline" size="sm" aria-label={"View ".concat(feature.type.toLowerCase(), ": ").concat(feature.title)}>
      View <lucide_react_1.ExternalLink className="ml-2 h-4 w-4" aria-hidden="true"/>
    </button_1.Button>
  </article>);
});
var ContactCard = (0, react_1.memo)(function (_a) {
    var contact = _a.contact, title = _a.title;
    return (<div>
      <h3 className="font-semibold mb-4 text-gray-800">{title}</h3>
      <address className="not-italic space-y-2">
        <p>
          <strong className="text-gray-800">{contact.name}</strong>
        </p>
        <p className="text-gray-600">{contact.title}</p>
        <p>
          <span className="text-gray-600">Email: </span>
          <a href={"mailto:".concat(contact.email)} className="text-[#2C5282] hover:underline">
            {contact.email}
          </a>
        </p>
        <p>
          <span className="text-gray-600">Phone: </span>
          <a href={"tel:".concat(contact.phone)} className="text-[#2C5282] hover:underline">
            {contact.phone}
          </a>
        </p>
      </address>
    </div>);
});
function PressMediaPage() {
    // Using useMemo to prevent unnecessary re-renders when data doesn't change
    var pressReleases = (0, react_1.useMemo)(function () { return [
        {
            title: "TripleCheck Launches AI-Powered Property Verification in Kenya",
            date: "2024-01-15",
            excerpt: "Revolutionary platform aims to eliminate property fraud through advanced verification technology",
            category: "Product Launch",
            id: "launch-ai-verification",
        },
        {
            title: "Partnership with Kenya Association of Real Estate Agents Announced",
            date: "2024-02-28",
            excerpt: "Strategic alliance to enhance property verification standards across Kenya",
            category: "Partnership",
            id: "partnership-karea",
        },
        {
            title: "TripleCheck Prevents KSh 50M in Property Fraud in First Quarter",
            date: "2024-03-30",
            excerpt: "Platform's fraud detection capabilities save thousands of Kenyan property buyers",
            category: "Impact Report",
            id: "q1-impact-report",
        },
    ]; }, []);
    var mediaKit = (0, react_1.useMemo)(function () { return [
        {
            name: "Company Logo Package",
            type: "image",
            size: "2.3 MB",
            id: "logo-package",
        },
        {
            name: "Product Screenshots",
            type: "image",
            size: "8.7 MB",
            id: "product-screenshots",
        },
        {
            name: "Executive Photos",
            type: "image",
            size: "5.1 MB",
            id: "executive-photos",
        },
        {
            name: "Company Fact Sheet",
            type: "document",
            size: "1.2 MB",
            id: "fact-sheet",
        },
        {
            name: "Platform Demo Video",
            type: "video",
            size: "45 MB",
            id: "demo-video",
        },
    ]; }, []);
    var mediaFeatures = (0, react_1.useMemo)(function () { return [
        {
            outlet: "Business Daily",
            title: "Tech Startup Tackles Kenya's Property Fraud Crisis",
            date: "2024-01-20",
            type: "Article",
            id: "business-daily-article",
        },
        {
            outlet: "KTN News",
            title: "TripleCheck: Securing Real Estate Transactions",
            date: "2024-02-15",
            type: "TV Interview",
            id: "ktn-interview",
        },
        {
            outlet: "Capital FM",
            title: "Property Verification Revolution in Kenya",
            date: "2024-03-05",
            type: "Radio Interview",
            id: "capital-fm-interview",
        },
    ]; }, []);
    // Contact information with proper typing
    var contacts = (0, react_1.useMemo)(function () { return ({
        press: {
            name: "Sarah Wanjiku",
            title: "Chief Technology Officer",
            email: "press@triplecheck.co.ke",
            phone: "+254 700 123 456",
        },
        partnerships: {
            name: "John Kariuki",
            title: "Chief Executive Officer",
            email: "partnerships@triplecheck.co.ke",
            phone: "+254 700 654 321",
        },
    }); }, []);
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header section with improved semantic structure */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#2C5282] mb-4">
            Press & Media
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Latest news, press releases, and media resources about TripleCheck's
            mission to transform Kenya's real estate market
          </p>
        </header>

        {/* Press Releases Section */}
        <section className="mb-12">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-2xl text-[#2C5282] flex items-center">
                <lucide_react_1.FileText className="mr-2" aria-hidden="true"/>
                Latest Press Releases
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <ul className="space-y-6 list-none">
                {pressReleases.map(function (release) { return (<li key={release.id || release.title}>
                    <PressReleaseCard release={release}/>
                  </li>); })}
              </ul>
            </card_1.CardContent>
          </card_1.Card>
        </section>

        {/* Media Kit Section */}
        <section className="mb-12">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-2xl text-[#2C5282] flex items-center">
                <lucide_react_1.Download className="mr-2" aria-hidden="true"/>
                Media Kit
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Download high-resolution images, logos, and other media assets
                for your stories about TripleCheck.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mediaKit.map(function (item) { return (<MediaKitItemCard key={item.id || item.name} item={item}/>); })}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </section>

        {/* Media Coverage Section */}
        <section className="mb-12">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-2xl text-[#2C5282]">
                Media Coverage
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <ul className="space-y-4 list-none">
                {mediaFeatures.map(function (feature) { return (<li key={feature.id || feature.title}>
                    <MediaFeatureCard feature={feature}/>
                  </li>); })}
              </ul>
            </card_1.CardContent>
          </card_1.Card>
        </section>

        {/* Contact Information Section */}
        <section>
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-2xl text-[#2C5282]">
                Media Contact
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ContactCard contact={contacts.press} title="For Press Inquiries"/>
                <ContactCard contact={contacts.partnerships} title="For Partnership Inquiries"/>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </section>
      </div>
    </div>);
}
