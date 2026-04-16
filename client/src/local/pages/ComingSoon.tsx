import { ArrowLeft, Mail, Bell, Calendar } from "lucide-react"

import { Button } from "../components/ui/button"
import { useNavigationTracking } from "../utils/navigation"

interface ComingSoonProps {
  readonly title: string;
  readonly description: string;
  readonly expectedLaunch?: string;
  readonly features?: readonly string[];
}

export default function ComingSoon({
  title,
  description,
  expectedLaunch = "Coming Soon",
  features = [],
}: ComingSoonProps) {
  const { trackNavigation } = useNavigationTracking();

  const handleNotifyMe = () => {
    trackNavigation(
      window.location.pathname,
      "/auth/register",
      "notify_signup"
    );
    // In a real app, this would open a notification signup modal
    window.alert(`We'll notify you when this feature is available!`);
  };

  const handleGoBack = () => {
    trackNavigation(window.location.pathname, "/", "back_to_home");
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-xl text-gray-600 mb-2">{description}</p>
          <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <Bell className="w-4 h-4 mr-2" />
            {expectedLaunch}
          </div>
        </div>

        {/* Features Preview */}
        {features.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What to expect:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center text-left p-3 bg-white rounded-lg shadow-sm"
                >
                  <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Be the first to know when {title.toLowerCase()} launches
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleNotifyMe} className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Notify Me When Ready
            </Button>
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>

        {/* Alternative Actions */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            In the meantime, explore what{`'`}s available:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/")}
            >
              Home
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/services/basic-checks")}
            >
              Start Verification
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/pricing")}
            >
              View Pricing
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/help")}
            >
              Get Help
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
