import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  CheckCircle,
  Clock,
  Activity,
  Eye,
  Building,
  Brain,
  Zap,
  Award,
} from "lucide-react";

interface TrustMetric {
  readonly label: string;
  readonly value: string;
  readonly description: string;
  readonly icon: React.ComponentType<{ className?: string | undefined }>;
  readonly trend: "up" | "down" | "stable";
}

export default function FraudProtectionInfo(): JSX.Element {
  const navigate = useNavigate();

  // Trust metrics for the ecosystem (public stats)
  const trustMetrics: readonly TrustMetric[] = useMemo(
    () => [
      {
        label: "Properties Scanned Today",
        value: "1,247",
        description: "Automatic background verification",
        icon: Building,
        trend: "up",
      },
      {
        label: "Average Scan Time",
        value: "3.2 min",
        description: "Fast, thorough analysis",
        icon: Clock,
        trend: "down",
      },
      {
        label: "Clean Properties",
        value: "94.7%",
        description: "Pass all safety checks",
        icon: CheckCircle,
        trend: "stable",
      },
      {
        label: "Issues Prevented",
        value: "₦2.8B",
        description: "Fraud blocked this month",
        icon: Shield,
        trend: "up",
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Automatic Property Protection
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Every property is automatically scanned in the background for
              fraud, legal issues, and safety concerns. Get simple, clear
              reports so you can buy and sell with complete confidence.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-trust-verified/10 px-4 py-2 rounded-full">
                <Activity className="w-5 h-5 text-trust-verified" />
                <span className="text-trust-verified font-medium">
                  Always Scanning
                </span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <Brain className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full">
                <Zap className="w-5 h-5 text-secondary" />
                <span className="text-secondary font-medium">
                  Instant Reports
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={() => navigate("/auth/login")}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Sign In to View Your Reports
              </button>
              <button
                type="button"
                onClick={() => navigate("/auth/register")}
                className="px-8 py-3 bg-background border border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-colors"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Trust Metrics */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Protection You Can Trust
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustMetrics.map((metric) => (
              <div
                key={metric.label}
                className="bg-card border border-card-border rounded-lg p-6 text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <metric.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">
                  {metric.value}
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {metric.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 bg-muted/30 rounded-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How Background Protection Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our system works silently in the background, so you don&apos;t
              have to worry about fraud or legal issues.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 px-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Eye className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Automatic Monitoring
              </h3>
              <p className="text-muted-foreground">
                Every property is automatically scanned when listed, updated, or
                viewed. No action required from you.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-secondary/10 rounded-full">
                  <Brain className="w-8 h-8 text-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                AI Analysis
              </h3>
              <p className="text-muted-foreground">
                Advanced AI checks title records, ownership history, market
                data, and legal compliance in minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-accent/10 rounded-full">
                  <Award className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Simple Reports
              </h3>
              <p className="text-muted-foreground">
                Get clear, easy-to-understand reports with specific
                recommendations for each property.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              What We Check For
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive fraud detection covers all aspects of property
              safety
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card border border-card-border rounded-lg p-6">
              <Shield className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Title Verification
              </h3>
              <p className="text-muted-foreground">
                Verify ownership records, check for liens, and ensure clean
                title history
              </p>
            </div>

            <div className="bg-card border border-card-border rounded-lg p-6">
              <Activity className="w-8 h-8 text-secondary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Market Analysis
              </h3>
              <p className="text-muted-foreground">
                Compare property values and identify unusual pricing patterns
              </p>
            </div>

            <div className="bg-card border border-card-border rounded-lg p-6">
              <Eye className="w-8 h-8 text-accent mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Identity Checks
              </h3>
              <p className="text-muted-foreground">
                Verify seller identity and check for suspicious ownership
                patterns
              </p>
            </div>

            <div className="bg-card border border-card-border rounded-lg p-6">
              <Building className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Property History
              </h3>
              <p className="text-muted-foreground">
                Track ownership transfers and identify potential red flags
              </p>
            </div>

            <div className="bg-card border border-card-border rounded-lg p-6">
              <CheckCircle className="w-8 h-8 text-trust-verified mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Legal Compliance
              </h3>
              <p className="text-muted-foreground">
                Ensure all documentation meets legal requirements and standards
              </p>
            </div>

            <div className="bg-card border border-card-border rounded-lg p-6">
              <Clock className="w-8 h-8 text-secondary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Real-time Updates
              </h3>
              <p className="text-muted-foreground">
                Continuous monitoring with instant alerts for any changes
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-16 text-center bg-primary/5 rounded-2xl py-12 px-6">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Protect Your Property Investments?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust our fraud detection system to keep
            their property transactions safe
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              onClick={() => navigate("/auth/register")}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Free Trial
            </button>
            <button
              type="button"
              onClick={() => navigate("/contact")}
              className="px-8 py-3 bg-background border border-primary text-primary rounded-lg font-semibold hover:bg-primary/5 transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
