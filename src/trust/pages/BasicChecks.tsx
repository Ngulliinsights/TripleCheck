import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Shield, CheckCircle, LucideIcon } from 'lucide-react';

// Define types for better type safety and code organization
interface CheckItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

// Extract check items to a constant for easier maintenance and better performance
const CHECK_ITEMS: CheckItem[] = [
  {
    id: 'document-verification',
    title: 'Document Verification',
    description: 'Verify ownership documents, title deeds, and legal certificates',
    icon: CheckCircle,
  },
  {
    id: 'image-authentication', 
    title: 'Image Authentication',
    description: 'Analyze property images for authenticity and detect manipulated photos',
    icon: CheckCircle,
  },
  {
    id: 'background-check',
    title: 'Basic Background Check', 
    description: 'Verify property owner identity and basic credibility checks',
    icon: CheckCircle,
  },
] as const;

// Extract CheckCard as a separate component for better reusability and testing
interface CheckCardProps {
  item: CheckItem;
}

const CheckCard: React.FC<CheckCardProps> = React.memo(({ item }) => {
  const IconComponent = item.icon;
  
  return (
    <Card className="h-full transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <IconComponent 
            className="w-5 h-5 mr-2 text-green-600" 
            aria-hidden="true"
          />
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 leading-relaxed">
          {item.description}
        </p>
      </CardContent>
    </Card>
  );
});

// Add display name for better debugging experience
CheckCard.displayName = 'CheckCard';

// Main component with improved structure and accessibility
const BasicChecks: React.FC = () => {
  // Handler functions for better maintainability and potential future logic
  const handleStartCheck = React.useCallback(() => {
    // Future implementation: navigation or modal opening logic
    console.log('Starting basic property check...');
  }, []);

  const handleLearnMore = React.useCallback(() => {
    // Future implementation: navigation to documentation or help
    console.log('Opening learn more section...');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Hero section with improved semantic structure */}
        <header className="text-center mb-12">
          <Shield 
            className="h-16 w-16 text-blue-600 mx-auto mb-4" 
            aria-hidden="true"
          />
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            Basic Property Checks
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Essential verification services to ensure property authenticity and safety
          </p>
        </header>

        {/* Main content section with improved grid and accessibility */}
        <main>
          <section aria-labelledby="services-heading" className="mb-12">
            <h2 id="services-heading" className="sr-only">
              Available verification services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {CHECK_ITEMS.map((item) => (
                <CheckCard key={item.id} item={item} />
              ))}
            </div>
          </section>

          {/* Call-to-action section with improved button styling and accessibility */}
          <section aria-labelledby="cta-heading" className="text-center">
            <h2 id="cta-heading" className="sr-only">
              Get started with property verification
            </h2>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Button 
                size="lg" 
                onClick={handleStartCheck}
                className="w-full sm:w-auto transition-colors duration-200"
              >
                Start Basic Check
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleLearnMore}
                className="w-full sm:w-auto transition-colors duration-200"
              >
                Learn More
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default BasicChecks;