"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResourcesPage;
var lucide_react_1 = require("lucide-react");
var accordion_1 = require("../components/ui/accordion");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
function ResourcesPage() {
    var guides = [
        {
            title: "Property Verification Guide",
            description: "Learn how to verify property authenticity step by step",
            type: "PDF",
            icon: lucide_react_1.FileText,
        },
        {
            title: "Understanding Trust Scores",
            description: "Comprehensive guide to our trust scoring system",
            type: "PDF",
            icon: lucide_react_1.FileText,
        },
        {
            title: "Safe Property Investment",
            description: "Best practices for secure property investments",
            type: "Video",
            icon: lucide_react_1.Video,
        },
    ];
    var faqItems = [
        {
            question: "What documents are needed for property verification?",
            answer: "The essential documents include title deed, land rate receipts, survey plans, and any transfer documents. Additional documents may be required based on the property type and location.",
        },
        {
            question: "How long does the verification process take?",
            answer: "The standard verification process typically takes 2-3 business days. However, complex cases might require additional time for thorough verification.",
        },
        {
            question: "What is the Real Estate Karma Score?",
            answer: "The Karma Score is our proprietary trust metric that evaluates property sellers and agents based on their transaction history, document accuracy, and community feedback.",
        },
    ];
    return (<div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Educational Resources</h1>
          <p className="text-muted-foreground">
            Enhance your understanding of property verification and real estate
            investments
          </p>
        </div>

        {/* Featured Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map(function (guide, index) { return (<card_1.Card key={index}>
              <card_1.CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <guide.icon className="h-12 w-12 text-[#2C5282]"/>
                  <div>
                    <h3 className="font-medium">{guide.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {guide.description}
                    </p>
                    <button_1.Button variant="outline" className="w-full">
                      {guide.type === "PDF" ?
                <lucide_react_1.Download className="h-4 w-4 mr-2"/>
                : <lucide_react_1.ExternalLink className="h-4 w-4 mr-2"/>}
                      Access {guide.type}
                    </button_1.Button>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>); })}
        </div>

        {/* Video Tutorials */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Video className="h-5 w-5"/>
              Video Tutorials
            </card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <button_1.Button variant="outline">
                  Watch: Property Verification Process
                </button_1.Button>
              </div>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <button_1.Button variant="outline">Watch: Using Trust Scores</button_1.Button>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Knowledge Base */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Book className="h-5 w-5"/>
              Knowledge Base
            </card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <accordion_1.Accordion type="single" collapsible className="w-full">
              {faqItems.map(function (item, index) { return (<accordion_1.AccordionItem key={index} value={"item-".concat(index)}>
                  <accordion_1.AccordionTrigger>{item.question}</accordion_1.AccordionTrigger>
                  <accordion_1.AccordionContent>{item.answer}</accordion_1.AccordionContent>
                </accordion_1.AccordionItem>); })}
            </accordion_1.Accordion>
          </card_1.CardContent>
        </card_1.Card>

        {/* Additional Resources */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Useful Links</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button_1.Button variant="outline" className="justify-start">
                <lucide_react_1.FileText className="h-4 w-4 mr-2"/>
                Property Buyers Guide
              </button_1.Button>
              <button_1.Button variant="outline" className="justify-start">
                <lucide_react_1.FileText className="h-4 w-4 mr-2"/>
                Legal Documentation Checklist
              </button_1.Button>
              <button_1.Button variant="outline" className="justify-start">
                <lucide_react_1.FileText className="h-4 w-4 mr-2"/>
                Market Analysis Template
              </button_1.Button>
              <button_1.Button variant="outline" className="justify-start">
                <lucide_react_1.FileText className="h-4 w-4 mr-2"/>
                Risk Assessment Guide
              </button_1.Button>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
