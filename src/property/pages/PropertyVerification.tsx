import {
  Shield,
  FileText,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Upload,
  MapPin,
  DollarSign,
  Star,
  Phone,
  Calendar,
} from "lucide-react"
import React, { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"

import { Alert, AlertDescription } from "../../shared/components/ui/alert"
import { Badge } from "../../shared/components/ui/badge"
import { Button } from "../../shared/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card"
import { Input } from "../../shared/components/ui/input"
import { Label } from "../../shared/components/ui/label"
import { Separator } from "../../shared/components/ui/separator"
import { Textarea } from "../../shared/components/ui/textarea"

interface VerificationPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  estimatedTime: string;
}

interface PropertyInfo {
  address: string;
  propertyType: string;
  estimatedValue: string;
  sellerName: string;
  sellerContact: string;
  additionalNotes: string;
}

const VERIFICATION_PACKAGES: VerificationPackage[] = [
  {
    id: "basic",
    name: "Basic Verification",
    description: "Essential property verification for individual buyers",
    price: 2500,
    duration: "24-48 hours",
    icon: <Shield className="w-6 h-6" />,
    features: [
      "Ownership document verification",
      "Basic fraud detection scan",
      "Property title validation",
      "Legal compliance check",
      "Basic property history",
    ],
  },
  {
    id: "comprehensive",
    name: "Comprehensive Verification",
    description:
      "Complete verification with expert review and community intelligence",
    price: 7500,
    duration: "3-5 business days",
    popular: true,
    icon: <FileText className="w-6 h-6" />,
    features: [
      "All Basic Verification features",
      "Expert legal review",
      "Physical property inspection",
      "Community intelligence gathering",
      "Market value assessment",
      "Detailed risk analysis report",
      "Fraud prevention guarantee",
    ],
  },
  {
    id: "premium",
    name: "Premium Verification",
    description: "Enterprise-grade verification with ongoing monitoring",
    price: 15000,
    duration: "5-7 business days",
    icon: <Star className="w-6 h-6" />,
    features: [
      "All Comprehensive features",
      "Blockchain verification record",
      "6-month monitoring service",
      "Priority expert consultation",
      "Insurance coverage up to KES 5M",
      "Dedicated account manager",
      "Custom verification criteria",
    ],
  },
];

// Constants for duplicate strings
const STEP_SELECT_PACKAGE = "select-package" as const;
const STEP_PROPERTY_INFO = "property-info" as const;
const STEP_DOCUMENT_UPLOAD = "document-upload" as const;
const STEP_PAYMENT = "payment" as const;

// Step type definition
type VerificationStepType =
  | typeof STEP_SELECT_PACKAGE
  | typeof STEP_PROPERTY_INFO
  | typeof STEP_DOCUMENT_UPLOAD
  | typeof STEP_PAYMENT;

// Status constants
const STATUS_PENDING = "pending" as const;
const TIME_30_MINUTES = "30 minutes" as const;
const TIME_2_4_HOURS = "2-4 hours" as const;
const TIME_1_2_HOURS = "1-2 hours" as const;
const TIME_24_48_HOURS = "24-48 hours" as const;

const VERIFICATION_STEPS: VerificationStep[] = [
  {
    id: "document-upload",
    title: "Document Upload & Analysis",
    description: "Upload and analyze property documents for authenticity",
    status: STATUS_PENDING,
    estimatedTime: TIME_30_MINUTES,
  },
  {
    id: "ownership-verification",
    title: "Ownership Verification",
    description: "Verify legitimate ownership through government registries",
    status: STATUS_PENDING,
    estimatedTime: TIME_2_4_HOURS,
  },
  {
    id: "fraud-detection",
    title: "Fraud Detection Analysis",
    description: "AI-powered analysis to identify potential fraud indicators",
    status: STATUS_PENDING,
    estimatedTime: TIME_1_2_HOURS,
  },
  {
    id: "expert-review",
    title: "Expert Legal Review",
    description: "Professional review by qualified legal experts",
    status: STATUS_PENDING,
    estimatedTime: TIME_24_48_HOURS,
  },
  {
    id: "final-report",
    title: "Final Verification Report",
    description:
      "Comprehensive report with recommendations and risk assessment",
    status: STATUS_PENDING,
    estimatedTime: TIME_2_4_HOURS,
  },
];

export default function PropertyVerification() {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] =
    useState<string>("comprehensive");
  const [currentStep, setCurrentStep] =
    useState<VerificationStepType>(STEP_SELECT_PACKAGE);
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo>({
    address: "",
    propertyType: "",
    estimatedValue: "",
    sellerName: "",
    sellerContact: "",
    additionalNotes: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Get property ID from URL params if coming from a specific property (for future use)
  // const propertyId = searchParams.get('propertyId');

  const handlePackageSelect = useCallback((packageId: string) => {
    setSelectedPackage(packageId);
  }, []);

  const handleNextStep = useCallback(() => {
    if (currentStep === STEP_SELECT_PACKAGE) {
      setCurrentStep(STEP_PROPERTY_INFO);
    } else if (currentStep === STEP_PROPERTY_INFO) {
      setCurrentStep(STEP_DOCUMENT_UPLOAD);
    } else if (currentStep === STEP_DOCUMENT_UPLOAD) {
      setCurrentStep(STEP_PAYMENT);
    }
  }, [currentStep]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep === STEP_PROPERTY_INFO) {
      setCurrentStep(STEP_SELECT_PACKAGE);
    } else if (currentStep === STEP_DOCUMENT_UPLOAD) {
      setCurrentStep(STEP_PROPERTY_INFO);
    } else if (currentStep === STEP_PAYMENT) {
      setCurrentStep(STEP_DOCUMENT_UPLOAD);
    }
  }, [currentStep]);

  const handlePropertyInfoChange = useCallback(
    (field: keyof PropertyInfo, value: string) => {
      setPropertyInfo((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target;
      if (files) {
        setUploadedFiles((prev) => [...prev, ...Array.from(files)]);
      }
    },
    []
  );

  const handleStartVerification = useCallback(() => {
    // In a real app, this would submit the verification request
    navigate("/land-verification/dashboard");
  }, [navigate]);

  const selectedPackageData = VERIFICATION_PACKAGES.find(
    (pkg) => pkg.id === selectedPackage
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Property Verification
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Verify Your Property Investment
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Protect your investment with comprehensive property verification
              services designed specifically for Kenya's real estate
              market.
            </p>
          </div>
        </div>
      </section>

      {/* Progress Indicator */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              {[
                {
                  id: STEP_SELECT_PACKAGE,
                  label: "Select Package",
                  icon: <Shield className="w-4 h-4" />,
                },
                {
                  id: STEP_PROPERTY_INFO,
                  label: "Property Info",
                  icon: <MapPin className="w-4 h-4" />,
                },
                {
                  id: STEP_DOCUMENT_UPLOAD,
                  label: "Upload Documents",
                  icon: <Upload className="w-4 h-4" />,
                },
                {
                  id: STEP_PAYMENT,
                  label: "Payment",
                  icon: <DollarSign className="w-4 h-4" />,
                },
              ].map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                    ${
                      currentStep === step.id ?
                        "bg-primary border-primary text-white"
                      : "bg-background border-muted-foreground/30 text-muted-foreground"
                    }
                  `}
                  >
                    {step.icon}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      currentStep === step.id ?
                        "text-primary"
                      : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < 3 && (
                    <div className="w-16 h-0.5 bg-muted-foreground/20 mx-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {currentStep === STEP_SELECT_PACKAGE && (
              <div>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4 text-foreground">
                    Choose Your Verification Package
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Select the verification level that best suits your needs and
                    budget.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  {VERIFICATION_PACKAGES.map((pkg) => (
                    <Card
                      key={pkg.id}
                      className={`
                        relative cursor-pointer transition-all duration-300 hover:shadow-lg
                        ${
                          selectedPackage === pkg.id ?
                            "border-primary shadow-lg ring-2 ring-primary/20"
                          : "border-border hover:border-primary/30"
                        }
                      `}
                      onClick={() => handlePackageSelect(pkg.id)}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge
                            variant="default"
                            className="px-4 py-1 text-xs font-semibold"
                          >
                            MOST POPULAR
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="text-center pb-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 mx-auto">
                          {pkg.icon}
                        </div>
                        <CardTitle className="text-xl font-bold">
                          {pkg.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {pkg.description}
                        </p>
                        <div className="mt-4">
                          <span className="text-3xl font-bold text-primary">
                            KES {pkg.price.toLocaleString()}
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {pkg.duration}
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <ul className="space-y-3">
                          {pkg.features.map((feature, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={handleNextStep}
                    className="px-8 py-3"
                  >
                    Continue with {selectedPackageData?.name}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === STEP_PROPERTY_INFO && (
              <div>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4 text-foreground">
                    Property Information
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Provide details about the property you want to verify.
                  </p>
                </div>

                <Card className="max-w-2xl mx-auto">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="address">Property Address *</Label>
                        <Input
                          id="address"
                          placeholder="Enter the full property address"
                          value={propertyInfo.address}
                          onChange={(e) =>
                            handlePropertyInfoChange("address", e.target.value)
                          }
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="propertyType">Property Type *</Label>
                        <Input
                          id="propertyType"
                          placeholder="e.g., Residential, Commercial, Land"
                          value={propertyInfo.propertyType}
                          onChange={(e) =>
                            handlePropertyInfoChange(
                              "propertyType",
                              e.target.value
                            )
                          }
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="estimatedValue">
                          Estimated Value (KES)
                        </Label>
                        <Input
                          id="estimatedValue"
                          placeholder="e.g., 5,000,000"
                          value={propertyInfo.estimatedValue}
                          onChange={(e) =>
                            handlePropertyInfoChange(
                              "estimatedValue",
                              e.target.value
                            )
                          }
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="sellerName">Seller/Owner Name *</Label>
                        <Input
                          id="sellerName"
                          placeholder="Full name of the property seller/owner"
                          value={propertyInfo.sellerName}
                          onChange={(e) =>
                            handlePropertyInfoChange(
                              "sellerName",
                              e.target.value
                            )
                          }
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="sellerContact">
                          Seller Contact Information
                        </Label>
                        <Input
                          id="sellerContact"
                          placeholder="Phone number or email"
                          value={propertyInfo.sellerContact}
                          onChange={(e) =>
                            handlePropertyInfoChange(
                              "sellerContact",
                              e.target.value
                            )
                          }
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="additionalNotes">
                          Additional Notes
                        </Label>
                        <Textarea
                          id="additionalNotes"
                          placeholder="Any additional information about the property or specific concerns"
                          value={propertyInfo.additionalNotes}
                          onChange={(e) =>
                            handlePropertyInfoChange(
                              "additionalNotes",
                              e.target.value
                            )
                          }
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                      <Button
                        variant="outline"
                        onClick={handlePreviousStep}
                        className="flex-1"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={handleNextStep}
                        className="flex-1"
                        disabled={
                          !propertyInfo.address ||
                          !propertyInfo.propertyType ||
                          !propertyInfo.sellerName
                        }
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === STEP_DOCUMENT_UPLOAD && (
              <div>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4 text-foreground">
                    Upload Property Documents
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Upload all relevant property documents for verification.
                  </p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="w-5 h-5" />
                          Document Upload
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground mb-4">
                            Drag and drop files here, or click to browse
                          </p>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                            aria-label="Upload property documents"
                            title="Upload property documents for verification"
                          />
                          <Button
                            variant="outline"
                            onClick={() =>
                              document.getElementById("file-upload")?.click()
                            }
                          >
                            Choose Files
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Supported formats: PDF, JPG, PNG, DOC, DOCX (Max
                            10MB each)
                          </p>
                        </div>

                        {uploadedFiles.length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-medium mb-3">
                              Uploaded Files ({uploadedFiles.length})
                            </h4>
                            <div className="space-y-2">
                              {uploadedFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                      {file.name}
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {(file.size / 1024 / 1024).toFixed(1)} MB
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Required Documents
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            "Title Deed or Certificate of Title",
                            "Sale Agreement or Purchase Contract",
                            "Survey Plan or Site Plan",
                            "Land Control Board Consent (if applicable)",
                            "Property Valuation Report",
                            "Tax Compliance Certificate",
                            "Identity Documents of Seller/Owner",
                          ].map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3"
                            >
                              <div className="w-2 h-2 bg-primary rounded-full" />
                              <span className="text-sm text-muted-foreground">
                                {doc}
                              </span>
                            </div>
                          ))}
                        </div>

                        <Alert className="mt-6">
                          <AlertTriangle className="w-4 h-4" />
                          <AlertDescription>
                            All documents will be encrypted and stored securely.
                            We comply with Kenya's data protection
                            regulations.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex gap-4 mt-8 max-w-2xl mx-auto">
                    <Button
                      variant="outline"
                      onClick={handlePreviousStep}
                      className="flex-1"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={handleNextStep}
                      className="flex-1"
                      disabled={uploadedFiles.length === 0}
                    >
                      Continue to Payment
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === STEP_PAYMENT && selectedPackageData && (
              <div>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4 text-foreground">
                    Complete Your Verification
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Review your order and complete the payment to start
                    verification.
                  </p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card>
                      <CardHeader>
                        <CardTitle>Order Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {selectedPackageData.name}
                          </span>
                          <span className="font-bold">
                            KES {selectedPackageData.price.toLocaleString()}
                          </span>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{propertyInfo.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              Expected completion:{" "}
                              {selectedPackageData.duration}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>
                              {uploadedFiles.length} documents uploaded
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Verification Process</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {VERIFICATION_STEPS.map((step, index) => (
                            <div
                              key={step.id}
                              className="flex items-start gap-3"
                            >
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">
                                  {step.title}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {step.description}
                                </p>
                                <p className="text-xs text-primary mt-1">
                                  ~{step.estimatedTime}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="mt-8">
                    <CardContent className="p-8">
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-4">
                          Ready to Start Verification?
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          Click below to proceed with payment and begin your
                          property verification process.
                        </p>
                        <div className="flex gap-4 justify-center">
                          <Button
                            variant="outline"
                            onClick={handlePreviousStep}
                          >
                            Previous
                          </Button>
                          <Button
                            size="lg"
                            onClick={handleStartVerification}
                            className="px-8"
                          >
                            Start Verification - KES{" "}
                            {selectedPackageData.price.toLocaleString()}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>M-Pesa Payment</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Secure & Encrypted</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Money-back Guarantee</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Why Choose TripleCheck Verification?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Shield className="w-8 h-8 text-green-500" />,
                  title: "Fraud Prevention",
                  description:
                    "Advanced AI and expert analysis to detect and prevent property fraud",
                  stat: "99.8% accuracy rate",
                },
                {
                  icon: <Users className="w-8 h-8 text-blue-500" />,
                  title: "Expert Network",
                  description:
                    "Verified legal experts, surveyors, and local authorities",
                  stat: "500+ professionals",
                },
                {
                  icon: <Clock className="w-8 h-8 text-purple-500" />,
                  title: "Fast Turnaround",
                  description:
                    "Quick verification process without compromising thoroughness",
                  stat: "24-48 hour delivery",
                },
              ].map((item, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground mb-4">
                      {item.description}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-primary border-primary"
                    >
                      {item.stat}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
