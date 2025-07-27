import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { Input } from '../../shared/components/ui/input';
import { 
  Search, 
  MapPin, 
  TreePine, 
  Shield, 
  FileCheck, 
  Users, 
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  SlidersHorizontal,
  Zap
} from 'lucide-react';
import { Skeleton } from '../../shared/components/ui/skeleton';
import { Property } from '../../shared/types/property';

// Types for land listings extending the base Property interface
interface LandListing extends Omit<Property, 'features' | 'status'> {
  readonly size: string;
  readonly verificationStatus: 'verified' | 'pending' | 'unverified' | 'flagged';
  readonly trustScore: number;
  readonly landType: 'agricultural' | 'residential' | 'commercial' | 'industrial';
  readonly titleDeedStatus: 'available' | 'pending' | 'missing';
  readonly lastVerified?: string;
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly landFeatures?: {
    soilType?: string;
    waterAccess?: boolean;
    roadAccess?: boolean;
    electricityAccess?: boolean;
    zoning?: string;
    developmentPotential?: string;
  };
}

interface LandFilters {
  query: string;
  location: string;
  landType: string;
  priceMin: number | null;
  priceMax: number | null;
  verificationStatus: string;
  trustScoreMin: number | null;
}

// Mock data for land listings
const mockLandListings: readonly LandListing[] = [
  {
    id: '1',
    title: '5-Acre Agricultural Land in Kiambu',
    description: 'Prime agricultural land with fertile soil, perfect for farming or development',
    location: 'Kiambu County',
    price: 12000000,
    size: '5 acres',
    images: ['/placeholder-land-1.jpg'],
    verificationStatus: 'verified',
    trustScore: 95,
    landType: 'agricultural',
    titleDeedStatus: 'available',
    lastVerified: '2024-01-15',
    riskLevel: 'low',
    landFeatures: {
      soilType: 'Fertile loam',
      waterAccess: true,
      roadAccess: true,
      electricityAccess: true,
      zoning: 'Agricultural',
      developmentPotential: 'High'
    }
  },
  {
    id: '2',
    title: '2-Acre Residential Plot in Nakuru',
    description: 'Well-located residential plot with access to utilities and good road network',
    location: 'Nakuru County',
    price: 8500000,
    size: '2 acres',
    images: ['/placeholder-land-2.jpg'],
    verificationStatus: 'pending',
    trustScore: 78,
    landType: 'residential',
    titleDeedStatus: 'pending',
    riskLevel: 'medium',
    landFeatures: {
      waterAccess: true,
      roadAccess: true,
      electricityAccess: false,
      zoning: 'Residential',
      developmentPotential: 'Medium'
    }
  },
  {
    id: '3',
    title: '10-Acre Commercial Land in Mombasa',
    description: 'Strategic commercial land near the port with high development potential',
    location: 'Mombasa County',
    price: 45000000,
    size: '10 acres',
    images: ['/placeholder-land-3.jpg'],
    verificationStatus: 'verified',
    trustScore: 92,
    landType: 'commercial',
    titleDeedStatus: 'available',
    lastVerified: '2024-01-20',
    riskLevel: 'low',
    landFeatures: {
      waterAccess: true,
      roadAccess: true,
      electricityAccess: true,
      zoning: 'Commercial',
      developmentPotential: 'Very High'
    }
  }
] as const;

// Verification status configurations
const VERIFICATION_STATUS_CONFIG = {
  verified: {
    label: 'Verified',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Fully verified and safe to purchase'
  },
  pending: {
    label: 'Verification Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    description: 'Verification in progress'
  },
  unverified: {
    label: 'Unverified',
    color: 'bg-gray-100 text-gray-800',
    icon: Eye,
    description: 'Not yet verified'
  },
  flagged: {
    label: 'Flagged',
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
    description: 'Potential issues detected'
  }
} as const;

// Risk level configurations
const RISK_LEVEL_CONFIG = {
  low: { color: 'text-green-600', label: 'Low Risk' },
  medium: { color: 'text-yellow-600', label: 'Medium Risk' },
  high: { color: 'text-red-600', label: 'High Risk' }
} as const;

// Mock API function
const fetchLandListings = async (filters: LandFilters): Promise<LandListing[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  let filteredListings = [...mockLandListings];
  
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filteredListings = filteredListings.filter(land => 
      land.title.toLowerCase().includes(query) ||
      land.description.toLowerCase().includes(query) ||
      land.location.toLowerCase().includes(query)
    );
  }
  
  if (filters.location) {
    filteredListings = filteredListings.filter(land =>
      land.location.toLowerCase().includes(filters.location.toLowerCase())
    );
  }
  
  if (filters.landType) {
    filteredListings = filteredListings.filter(land =>
      land.landType === filters.landType
    );
  }
  
  if (filters.verificationStatus) {
    filteredListings = filteredListings.filter(land =>
      land.verificationStatus === filters.verificationStatus
    );
  }
  
  if (filters.trustScoreMin) {
    filteredListings = filteredListings.filter(land =>
      land.trustScore >= filters.trustScoreMin!
    );
  }
  
  return filteredListings;
};

// Land card component
const LandCard: React.FC<{ land: LandListing; onVerify: (id: string) => void }> = ({ land, onVerify }) => {
  const statusConfig = VERIFICATION_STATUS_CONFIG[land.verificationStatus];
  const riskConfig = RISK_LEVEL_CONFIG[land.riskLevel];
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="relative">
        <img 
          src={land.images[0]} 
          alt={land.title}
          className="w-full h-48 object-cover rounded-t-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-land.jpg';
          }}
        />
        <div className="absolute top-4 left-4">
          <Badge className={statusConfig.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </div>
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-white/90">
            Trust: {land.trustScore}%
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold line-clamp-2">{land.title}</h3>
          <span className={`text-sm font-medium ${riskConfig.color}`}>
            {riskConfig.label}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{land.description}</p>
        
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          {land.location}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500">Size:</span>
            <span className="ml-1 font-medium">{land.size}</span>
          </div>
          <div>
            <span className="text-gray-500">Type:</span>
            <span className="ml-1 font-medium capitalize">{land.landType}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-bold text-blue-600">
            KSh {land.price.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            Title Deed: <span className="capitalize font-medium">{land.titleDeedStatus}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onVerify(land.id)}
          >
            <Shield className="w-4 h-4 mr-1" />
            Verify Land
          </Button>
          <Button size="sm" className="flex-1">
            View Details
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {land.lastVerified && (
          <div className="text-xs text-gray-500 mt-2">
            Last verified: {new Date(land.lastVerified).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Lands(): JSX.Element {
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState<LandFilters>({
    query: '',
    location: '',
    landType: '',
    priceMin: null,
    priceMax: null,
    verificationStatus: '',
    trustScoreMin: null
  });
  
  const [showFilters, setShowFilters] = useState(false);

  const { data: landListings, isLoading, error } = useQuery({
    queryKey: ['land-listings', filters],
    queryFn: () => fetchLandListings(filters),
    staleTime: 5 * 60 * 1000,
  });

  const handleFilterChange = useCallback(<K extends keyof LandFilters>(
    key: K, 
    value: LandFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleVerifyLand = useCallback((landId: string) => {
    navigate(`/land-verification/new?landId=${landId}`);
  }, [navigate]);

  const handleStartVerification = useCallback(() => {
    navigate('/land-verification/new');
  }, [navigate]);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      location: '',
      landType: '',
      priceMin: null,
      priceMax: null,
      verificationStatus: '',
      trustScoreMin: null
    });
  }, []);

  const verificationStats = useMemo(() => {
    if (!landListings) return { verified: 0, pending: 0, total: 0 };
    
    return {
      verified: landListings.filter(land => land.verificationStatus === 'verified').length,
      pending: landListings.filter(land => land.verificationStatus === 'pending').length,
      total: landListings.length
    };
  }, [landListings]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Verified Land
              <span className="text-green-200"> Listings</span>
            </h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto mb-8">
              Browse authenticated land listings with comprehensive verification, fraud detection, 
              and community intelligence. Every plot is thoroughly checked for your security.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="px-8 bg-white text-green-600 hover:bg-gray-100"
                onClick={handleStartVerification}
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Land Verification
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-green-600"
              >
                <FileCheck className="w-5 h-5 mr-2" />
                Learn About Verification
              </Button>
            </div>
          </div>

          {/* Verification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-green-200" />
                <div className="text-2xl font-bold">{verificationStats.verified}</div>
                <div className="text-green-100">Verified Lands</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-200" />
                <div className="text-2xl font-bold">{verificationStats.pending}</div>
                <div className="text-yellow-100">Pending Verification</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-blue-200" />
                <div className="text-2xl font-bold">{verificationStats.total}</div>
                <div className="text-blue-100">Total Listings</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search land listings..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter by location"
                >
                  <option value="">All Counties</option>
                  <option value="Nairobi">Nairobi County</option>
                  <option value="Kiambu">Kiambu County</option>
                  <option value="Nakuru">Nakuru County</option>
                  <option value="Mombasa">Mombasa County</option>
                  <option value="Kisumu">Kisumu County</option>
                </select>
              </div>
              <select
                value={filters.landType}
                onChange={(e) => handleFilterChange('landType', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by land type"
              >
                <option value="">All Land Types</option>
                <option value="agricultural">Agricultural</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
              <Button 
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>

            {showFilters && (
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={filters.verificationStatus}
                  onChange={(e) => handleFilterChange('verificationStatus', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter by verification status"
                >
                  <option value="">All Verification Status</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="unverified">Unverified</option>
                </select>
                <select
                  value={filters.trustScoreMin?.toString() || ''}
                  onChange={(e) => handleFilterChange('trustScoreMin', e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Filter by minimum trust score"
                >
                  <option value="">Any Trust Score</option>
                  <option value="90">90%+ Trust Score</option>
                  <option value="80">80%+ Trust Score</option>
                  <option value="70">70%+ Trust Score</option>
                </select>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Land Listings */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Available Land</h2>
            <div className="text-gray-600">
              {isLoading ? 'Loading...' : `${landListings?.length || 0} listings found`}
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4 animate-pulse">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Listings</h3>
                <p className="text-red-600">Unable to load land listings. Please try again later.</p>
              </div>
            </div>
          )}

          {!isLoading && !error && landListings && (
            <>
              {landListings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {landListings.map((land) => (
                    <LandCard 
                      key={land.id} 
                      land={land} 
                      onVerify={handleVerifyLand}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TreePine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Land Found</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search criteria or browse all available land.
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Land Verification Services?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Our comprehensive verification system combines government records, expert assessments, 
            and community intelligence to ensure your land purchase is secure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8 bg-white text-blue-600 hover:bg-gray-100"
              onClick={handleStartVerification}
            >
              <Shield className="w-5 h-5 mr-2" />
              Start Verification
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600"
              onClick={() => navigate('/land-verification')}
            >
              <Eye className="w-5 h-5 mr-2" />
              View Dashboard
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}