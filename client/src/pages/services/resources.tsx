import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Video, Book, Download, ExternalLink } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ResourcesPage() {
  const guides = [
    {
      title: "Property Verification Guide",
      description: "Learn how to verify property authenticity step by step",
      type: "PDF",
      icon: FileText
    },
    {
      title: "Understanding Trust Scores",
      description: "Comprehensive guide to our trust scoring system",
      type: "PDF",
      icon: FileText
    },
    {
      title: "Safe Property Investment",
      description: "Best practices for secure property investments",
      type: "Video",
      icon: Video
    }
  ];

  const faqItems = [
    {
      question: "What documents are needed for property verification?",
      answer: "The essential documents include title deed, land rate receipts, survey plans, and any transfer documents. Additional documents may be required based on the property type and location."
    },
    {
      question: "How long does the verification process take?",
      answer: "The standard verification process typically takes 2-3 business days. However, complex cases might require additional time for thorough verification."
    },
    {
      question: "What is the Real Estate Karma Score?",
      answer: "The Karma Score is our proprietary trust metric that evaluates property sellers and agents based on their transaction history, document accuracy, and community feedback."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Educational Resources</h1>
          <p className="text-muted-foreground">
            Enhance your understanding of property verification and real estate investments
          </p>
        </div>

        {/* Featured Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <guide.icon className="h-12 w-12 text-[#2C5282]" />
                  <div>
                    <h3 className="font-medium">{guide.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {guide.description}
                    </p>
                    <Button variant="outline" className="w-full">
                      {guide.type === "PDF" ? (
                        <Download className="h-4 w-4 mr-2" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Access {guide.type}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Video Tutorials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Tutorials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Button variant="outline">
                  Watch: Property Verification Process
                </Button>
              </div>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Button variant="outline">
                  Watch: Using Trust Scores
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Base */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Knowledge Base
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader>
            <CardTitle>Useful Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Property Buyers Guide
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Legal Documentation Checklist
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Market Analysis Template
              </Button>
              <Button variant="outline" className="justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Risk Assessment Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
