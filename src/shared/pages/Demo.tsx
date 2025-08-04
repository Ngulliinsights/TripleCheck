import { Play, Shield, FileText, Users, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { VideoModal } from '../components/VideoModal';

const DEMO_VIDEO_URL = "https://youtu.be/IjhSHyfQpaQ";

export default function Demo() {
  const navigate = useNavigate();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const demoFeatures = [
    {
      id: 'land-verification',
      title: 'Land Verification System',
      description: 'See how our comprehensive verification process works for Kenyan properties',
      icon: <Shield className="w-8 h-8" />,
      color: 'bg-green-500',
      route: '/land-verification',
      highlights: [
        'Government registry validation',
        'Expert coordination',
        'Community intelligence',
        'Risk assessment'
      ]
    },
    {
      id: 'fraud-detection',
      title: 'Fraud Detection Engine',
      description: 'Experience our AI-powered fraud detection in action',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'bg-red-500',
      route: '/trust/fraud-detection',
      highlights: [
        'Pattern recognition',
        'Real-time alerts',
        'Case management',
        'ML algorithms'
      ]
    },
    {
      id: 'document-auth',
      title: 'Document Authentication',
      description: 'Watch how we verify document authenticity using advanced techniques',
      icon: <FileText className="w-8 h-8" />,
      color: 'bg-blue-500',
      route: '/trust/document-auth',
      highlights: [
        'Digital forensics',
        'Signature verification',
        'Metadata analysis',
        'Compliance checks'
      ]
    },
    {
      id: 'community-intel',
      title: 'Community Intelligence',
      description: 'Discover how community insights enhance verification accuracy',
      icon: <Users className="w-8 h-8" />,
      color: 'bg-purple-500',
      route: '/community-intelligence',
      highlights: [
        'Local knowledge',
        'Community reports',
        'Historical data',
        'Reputation system'
      ]
    }
  ];

  const handleFeatureDemo = (route: string) => {
    navigate(route);
  };

  const handleInteractiveDemo = (demoId: string) => {
    setActiveDemo(demoId);
    // Navigate to the full MVP demo with the specific section
    navigate(`/mvp-demo?section=${demoId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Play className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              See TripleCheck in Action
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Experience Africa's most comprehensive property verification platform through our interactive demos and video walkthrough.
            </p>
            
            {/* Video CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                onClick={() => setIsVideoModalOpen(true)}
                className="px-8 py-4 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo Video
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/mvp-demo')}
                className="px-8 py-4 text-lg"
              >
                Try Interactive Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">
                <Shield className="w-3 h-3 mr-1" />
                No Signup Required
              </Badge>
              <Badge variant="outline">
                <CheckCircle className="w-3 h-3 mr-1" />
                Real Data Examples
              </Badge>
              <Badge variant="outline">
                <Play className="w-3 h-3 mr-1" />
                5-Minute Overview
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Demos */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Explore Key Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dive deep into each component of our verification system with hands-on demonstrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {demoFeatures.map((feature) => (
            <Card key={feature.id} className="hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-full ${feature.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-6">
                  {feature.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">{highlight}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleFeatureDemo(feature.route)}
                    className="flex-1"
                  >
                    Try Live Demo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleInteractiveDemo(feature.id)}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6">
                Experience the full power of TripleCheck with our comprehensive platform demo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/land-verification')}>
                  Start Verification
                  <Shield className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>
                  Schedule Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoUrl={DEMO_VIDEO_URL}
        title="TripleCheck Platform Demo"
      />
    </div>
  );
}