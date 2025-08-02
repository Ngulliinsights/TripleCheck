import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
  ArrowRight,
  Shield,
  Users,
  Headphones,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

import FormField from "../components/forms/FormField";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { useForm } from "../hooks/useForm";
import { ValidationRule } from "../utils/form-validation";
import { useNavigationTracking } from "../utils/navigation";

// Constants
const BASIC_CHECKS_URL = "/services/basic-checks";

export default function Contact() {
  const { trackNavigation } = useNavigationTracking();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form validation rules
  const validationRules: Record<string, ValidationRule> = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
    },
    email: {
      required: true,
      email: true,
    },
    phone: {
      phone: true, // Optional but validated if provided
    },
    subject: {
      required: true,
      minLength: 5,
      maxLength: 200,
    },
    message: {
      required: true,
      minLength: 10,
      maxLength: 2000,
    },
    inquiryType: {
      required: true,
    },
  };

  const {
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
    getFieldProps,
    getFieldError,
    handleSubmit,
    handleReset,
  } = useForm({
    initialValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      inquiryType: "general",
    },
    validationRules,
    onSubmit: async (formData) => {
      try {
        // Track form submission
        trackNavigation("/contact", "/contact", "form_submission");

        // Simulate API call
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            // Simulate occasional failures for testing
            // Note: Using Math.random() for demo purposes only
            // In production, use proper error handling
            // eslint-disable-next-line sonarjs/pseudo-random
            if (Math.random() > 0.9) {
              reject(
                new Error("Server temporarily unavailable. Please try again.")
              );
            } else {
              resolve(formData);
            }
          }, 2000);
        });

        setIsSubmitted(true);
        trackNavigation("/contact", "/contact", "form_success");

        toast({
          title: "Message sent successfully!",
          description: `We'll get back to you within 4 hours during business hours.`,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ?
            error.message
          : "Failed to send message. Please try again.";

        toast({
          title: "Failed to send message",
          description: errorMessage,
          variant: "destructive",
        });

        throw error; // Re-throw to let form handle it
      }
    },
    validateOnChange: true,
    validateOnBlur: true,
  });

  const contactMethods = [
    {
      title: "Live Chat Support",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      details: "Available 24/7",
      action: "Start Chat",
      primary: true,
    },
    {
      title: "Phone Support",
      description: "Speak directly with our verification experts",
      icon: Phone,
      details: "+254 (0) 800 TRIPLE (874753)",
      action: "Call Now",
      primary: false,
    },
    {
      title: "Email Support",
      description: "Send us detailed questions or documents",
      icon: Mail,
      details: "support@triplecheck.africa",
      action: "Send Email",
      primary: false,
    },
  ];

  const officeLocations = [
    {
      city: "Nairobi",
      address: "123 Westlands Avenue, Westlands, Nairobi",
      phone: "+254 (0) 20 123 4567",
      hours: "Mon-Fri: 8AM-6PM EAT",
    },
    {
      city: "Mombasa",
      address: "456 Nyali Road, Nyali, Mombasa",
      phone: "+254 (0) 41 234 5678",
      hours: "Mon-Fri: 8AM-6PM EAT",
    },
  ];

  const inquiryTypes = [
    { value: "general", label: "General Inquiry" },
    { value: "verification", label: "Property Verification" },
    { value: "technical", label: "Technical Support" },
    { value: "billing", label: "Billing & Payments" },
    { value: "partnership", label: "Partnership Opportunities" },
    { value: "enterprise", label: "Enterprise Solutions" },
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-8">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thank You for Contacting Us!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            We\u2019ve received your message and will get back to you within 4
            hours during business hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => {
                trackNavigation(
                  "/contact",
                  BASIC_CHECKS_URL,
                  "post_contact_verification"
                );
                window.location.href = BASIC_CHECKS_URL;
              }}
              className="flex items-center"
            >
              Start Property Verification
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                trackNavigation("/contact", "/", "back_to_home");
                window.location.href = "/";
              }}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <MessageCircle className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Get in Touch with Our Experts
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto leading-relaxed">
              Have questions about property verification? Need help with our
              services? Our team of experts is here to help you make informed
              real estate decisions.
            </p>

            {/* Quick Contact Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {"< 4hrs"}
                </div>
                <div className="text-white/80">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-white/80">Live Chat Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">99.8%</div>
                <div className="text-white/80">Customer Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 -mt-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => {
              const IconComponent = method.icon;
              return (
                <div
                  key={index}
                  className={`group bg-white rounded-2xl shadow-xl border-2 p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer ${
                    method.primary ?
                      "border-primary ring-2 ring-primary/20"
                    : "border-gray-100"
                  }`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 transition-colors duration-300 ${
                      method.primary ?
                        "bg-gradient-to-br from-primary to-primary/80 text-white"
                      : "bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:from-primary/20 group-hover:to-primary/10"
                    }`}
                  >
                    <IconComponent className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {method.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {method.description}
                  </p>
                  <p className="text-sm text-gray-500 mb-8 bg-gray-50 rounded-full px-4 py-2 inline-block">
                    {method.details}
                  </p>
                  <Button
                    className="w-full group-hover:shadow-lg transition-shadow duration-300"
                    variant={method.primary ? "default" : "outline"}
                  >
                    {method.action}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Send Us a Message
              </h2>
              <p className="text-gray-600 mb-8">
                Fill out the form below and we\u2019ll get back to you as soon
                as possible.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Full Name"
                    required
                    placeholder="Your full name"
                    error={getFieldError("name")}
                    touched={touched.name}
                    {...getFieldProps("name")}
                  />

                  <FormField
                    label="Email Address"
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    error={getFieldError("email")}
                    touched={touched.email}
                    {...getFieldProps("email")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Phone Number"
                    type="tel"
                    placeholder="+254 xxx xxx xxxx"
                    error={getFieldError("phone")}
                    touched={touched.phone}
                    {...getFieldProps("phone")}
                  />

                  <FormField
                    label="Inquiry Type"
                    type="select"
                    required
                    options={inquiryTypes}
                    error={getFieldError("inquiryType")}
                    touched={touched.inquiryType}
                    {...getFieldProps("inquiryType")}
                  />
                </div>

                <FormField
                  label="Subject"
                  required
                  placeholder="Brief description of your inquiry"
                  error={getFieldError("subject")}
                  touched={touched.subject}
                  {...getFieldProps("subject")}
                />

                <FormField
                  label="Message"
                  type="textarea"
                  required
                  rows={6}
                  placeholder="Please provide details about your inquiry..."
                  error={getFieldError("message")}
                  touched={touched.message}
                  {...getFieldProps("message")}
                />

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1"
                    disabled={isSubmitting || !isValid}
                  >
                    {isSubmitting ?
                      "Sending Message..."
                    : <>
                        Send Message
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    }
                  </Button>

                  {isDirty && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleReset}
                      disabled={isSubmitting}
                    >
                      Reset Form
                    </Button>
                  )}
                </div>

                {/* Form Status */}
                {!isValid && Object.keys(errors).length > 0 && (
                  <div className="flex items-start space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Please fix the following errors:
                      </p>
                      <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                        {Object.entries(errors).map(([field, error]) => (
                          <li key={field}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Contact Information
              </h2>

              {/* Office Locations */}
              <div className="space-y-8 mb-12">
                {officeLocations.map((office, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      {office.city} Office
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{office.address}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{office.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{office.hours}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Why Choose Us */}
              <div className="bg-primary/5 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Why Choose TripleCheck?
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      icon: Shield,
                      title: "Trusted Verification",
                      description: "99.8% accuracy rate with expert validation",
                    },
                    {
                      icon: Users,
                      title: "Expert Support",
                      description: "Real estate professionals ready to help",
                    },
                    {
                      icon: Headphones,
                      title: "24/7 Availability",
                      description: "Support when you need it most",
                    },
                  ].map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div key={index} className="flex items-start">
                        <div className="p-2 bg-primary/10 rounded-lg mr-4">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {feature.title}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Verify Your Property?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Don\u2019t wait for problems to arise. Start your property
            verification today and invest with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => {
                trackNavigation(
                  "/contact",
                  BASIC_CHECKS_URL,
                  "cta_verification"
                );
                window.location.href = BASIC_CHECKS_URL;
              }}
              className="flex items-center"
            >
              Start Verification Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                trackNavigation("/contact", "/pricing", "cta_pricing");
                window.location.href = "/pricing";
              }}
            >
              View Pricing Plans
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
