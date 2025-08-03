import { Search, MapPin, Phone, Mail, Star, Award, Filter, ExternalLink, Users, Scale, Compass } from 'lucide-react';
import React, { useState, useMemo } from 'react';

export interface ProfessionalResource {
  id: string;
  name: string;
  type: 'surveyor' | 'lawyer' | 'valuer' | 'land_agent' | 'consultant';
  specializations: string[];
  location: {
    county: string;
    town: string;
    address?: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  credentials: {
    license: string;
    registrationBody: string;
    yearsExperience: number;
    certifications: string[];
  };
  rating: {
    average: number;
    totalReviews: number;
  };
  services: string[];
  languages: string[];
  availability: 'available' | 'busy' | 'unavailable';
  priceRange: 'budget' | 'moderate' | 'premium';
  description: string;
  recentProjects?: string[];
}

interface ProfessionalResourcesDirectoryProps {
  onSelectProfessional?: (professional: ProfessionalResource) => void;
  filterByType?: string;
  filterByLocation?: string;
  showContactInfo?: boolean;
}

const MOCK_PROFESSIONALS: ProfessionalResource[] = [
  {
    id: 'surveyor-001',
    name: 'John Kamau & Associates',
    type: 'surveyor',
    specializations: ['Land Surveying', 'Boundary Disputes', 'Topographical Surveys', 'GPS Mapping'],
    location: {
      county: 'Nairobi',
      town: 'Nairobi CBD',
      address: 'Kimathi Street, Nairobi'
    },
    contact: {
      phone: '+254 700 123 456',
      email: 'info@kamausurveyors.co.ke',
      website: 'www.kamausurveyors.co.ke'
    },
    credentials: {
      license: 'LS/2018/001',
      registrationBody: 'Institution of Surveyors of Kenya (ISK)',
      yearsExperience: 15,
      certifications: ['Licensed Land Surveyor', 'GPS Specialist', 'GIS Certified']
    },
    rating: {
      average: 4.8,
      totalReviews: 127
    },
    services: [
      'Cadastral Surveys',
      'Boundary Demarcation',
      'Topographical Mapping',
      'GPS Coordinate Verification',
      'Survey Plan Preparation',
      'Dispute Resolution Support'
    ],
    languages: ['English', 'Swahili', 'Kikuyu'],
    availability: 'available',
    priceRange: 'moderate',
    description: 'Experienced land surveying firm with over 15 years of expertise in boundary disputes and land verification. Specializes in complex urban and rural surveying projects.',
    recentProjects: [
      'Kiambu County Land Subdivision Project',
      'Nairobi Industrial Area Boundary Survey',
      'Machakos Agricultural Land Demarcation'
    ]
  },
  {
    id: 'lawyer-001',
    name: 'Grace Wanjiku Advocates',
    type: 'lawyer',
    specializations: ['Property Law', 'Land Disputes', 'Conveyancing', 'Real Estate Transactions'],
    location: {
      county: 'Nairobi',
      town: 'Westlands',
      address: 'Westlands Square, Nairobi'
    },
    contact: {
      phone: '+254 722 987 654',
      email: 'grace@wanjikuadvocates.co.ke',
      website: 'www.wanjikuadvocates.co.ke'
    },
    credentials: {
      license: 'ADV/2015/789',
      registrationBody: 'Law Society of Kenya (LSK)',
      yearsExperience: 12,
      certifications: ['Advocate of the High Court', 'Certified Public Secretary', 'Mediator']
    },
    rating: {
      average: 4.9,
      totalReviews: 89
    },
    services: [
      'Property Due Diligence',
      'Title Deed Verification',
      'Contract Drafting and Review',
      'Land Dispute Resolution',
      'Conveyancing Services',
      'Legal Opinion Letters'
    ],
    languages: ['English', 'Swahili'],
    availability: 'available',
    priceRange: 'premium',
    description: 'Leading property law firm specializing in complex land transactions and dispute resolution. Extensive experience in Kenya\'s land law and regulatory framework.',
    recentProjects: [
      'Multi-million Shilling Commercial Property Transaction',
      'Land Grabbing Case Resolution',
      'Community Land Rights Advocacy'
    ]
  },
  {
    id: 'valuer-001',
    name: 'Peter Mwangi Valuations Ltd',
    type: 'valuer',
    specializations: ['Property Valuation', 'Market Analysis', 'Investment Advisory', 'Feasibility Studies'],
    location: {
      county: 'Kiambu',
      town: 'Thika',
      address: 'Thika Town, Kiambu County'
    },
    contact: {
      phone: '+254 733 456 789',
      email: 'peter@mwangivaluations.co.ke'
    },
    credentials: {
      license: 'VAL/2019/045',
      registrationBody: 'Institution of Valuers of Kenya (IVK)',
      yearsExperience: 10,
      certifications: ['Registered Valuer', 'RICS Associate', 'Property Investment Analyst']
    },
    rating: {
      average: 4.7,
      totalReviews: 156
    },
    services: [
      'Property Valuation Reports',
      'Market Value Assessment',
      'Investment Analysis',
      'Rental Value Determination',
      'Insurance Valuations',
      'Feasibility Studies'
    ],
    languages: ['English', 'Swahili', 'Kikuyu'],
    availability: 'busy',
    priceRange: 'moderate',
    description: 'Professional valuation services with focus on accurate market assessments and investment advisory. Extensive experience in both urban and rural property markets.',
    recentProjects: [
      'Kiambu County Hospital Valuation',
      'Thika Industrial Park Assessment',
      'Agricultural Land Portfolio Valuation'
    ]
  },
  {
    id: 'agent-001',
    name: 'Mary Njeri Land Services',
    type: 'land_agent',
    specializations: ['Land Transactions', 'Property Search', 'Documentation', 'Client Representation'],
    location: {
      county: 'Nakuru',
      town: 'Nakuru Town',
      address: 'Kenyatta Avenue, Nakuru'
    },
    contact: {
      phone: '+254 711 234 567',
      email: 'mary@njerilandservices.co.ke'
    },
    credentials: {
      license: 'LA/2020/123',
      registrationBody: 'Kenya Association of Land Agents (KALA)',
      yearsExperience: 8,
      certifications: ['Licensed Land Agent', 'Property Management Certificate']
    },
    rating: {
      average: 4.6,
      totalReviews: 203
    },
    services: [
      'Property Search and Verification',
      'Documentation Processing',
      'Client Representation',
      'Transaction Coordination',
      'Due Diligence Support',
      'Market Intelligence'
    ],
    languages: ['English', 'Swahili', 'Kikuyu'],
    availability: 'available',
    priceRange: 'budget',
    description: 'Reliable land agency services with strong focus on client satisfaction and transparent transactions. Extensive network in Rift Valley region.',
    recentProjects: [
      'Nakuru County Land Acquisition Project',
      'Agricultural Investment Facilitation',
      'Residential Plot Development Support'
    ]
  }
];

const PROFESSIONAL_TYPES = {
  surveyor: { label: 'Land Surveyors', icon: <Compass className="h-5 w-5" />, color: 'blue' },
  lawyer: { label: 'Property Lawyers', icon: <Scale className="h-5 w-5" />, color: 'purple' },
  valuer: { label: 'Property Valuers', icon: <Award className="h-5 w-5" />, color: 'green' },
  land_agent: { label: 'Land Agents', icon: <Users className="h-5 w-5" />, color: 'orange' },
  consultant: { label: 'Land Consultants', icon: <Users className="h-5 w-5" />, color: 'gray' }
};

const COUNTIES = [
  'Nairobi', 'Kiambu', 'Nakuru', 'Mombasa', 'Kisumu', 'Eldoret', 'Thika', 'Machakos', 'Meru', 'Nyeri'
];

export const ProfessionalResourcesDirectory: React.FC<ProfessionalResourcesDirectoryProps> = ({
  onSelectProfessional,
  filterByType,
  filterByLocation,
  showContactInfo = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>(filterByType || 'all');
  const [selectedCounty, setSelectedCounty] = useState<string>(filterByLocation || 'all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'name'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProfessionals = useMemo(() => {
    const filtered = MOCK_PROFESSIONALS.filter(professional => {
      const matchesSearch = searchTerm === '' || 
        professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        professional.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase())) ||
        professional.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = selectedType === 'all' || professional.type === selectedType;
      const matchesCounty = selectedCounty === 'all' || professional.location.county === selectedCounty;
      const matchesPriceRange = selectedPriceRange === 'all' || professional.priceRange === selectedPriceRange;
      
      return matchesSearch && matchesType && matchesCounty && matchesPriceRange;
    });

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating.average - a.rating.average;
        case 'experience':
          return b.credentials.yearsExperience - a.credentials.yearsExperience;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedType, selectedCounty, selectedPriceRange, sortBy]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getPriceRangeColor = (priceRange: string) => {
    switch (priceRange) {
      case 'budget': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-blue-600 bg-blue-100';
      case 'premium': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-yellow-600 bg-yellow-100';
      case 'unavailable': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Professional Resources Directory</h1>
        <p className="text-gray-600">
          Connect with qualified professionals for your land verification and property needs
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search professionals, specializations, or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {Object.entries(PROFESSIONAL_TYPES).map(([key, type]) => (
                <option key={key} value={key}>{type.label}</option>
              ))}
            </select>
            
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Counties</option>
              {COUNTIES.map(county => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <select
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Price Ranges</option>
                  <option value="budget">Budget</option>
                  <option value="moderate">Moderate</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'rating' | 'experience' | 'name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="experience">Most Experienced</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredProfessionals.length} professional{filteredProfessionals.length !== 1 ? 's' : ''}
          {selectedType !== 'all' && ` in ${PROFESSIONAL_TYPES[selectedType as keyof typeof PROFESSIONAL_TYPES]?.label}`}
          {selectedCounty !== 'all' && ` in ${selectedCounty} County`}
        </p>
      </div>

      {/* Professional Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {filteredProfessionals.map(professional => {
          const typeInfo = PROFESSIONAL_TYPES[professional.type];
          
          return (
            <div key={professional.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-${typeInfo.color}-100 text-${typeInfo.color}-600`}>
                      {typeInfo.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{professional.name}</h3>
                      <p className="text-gray-600">{typeInfo.label}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          {renderStars(professional.rating.average)}
                        </div>
                        <span className="text-sm text-gray-600">
                          {professional.rating.average} ({professional.rating.totalReviews} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getAvailabilityColor(professional.availability)}`}>
                      {professional.availability.charAt(0).toUpperCase() + professional.availability.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriceRangeColor(professional.priceRange)}`}>
                      {professional.priceRange.charAt(0).toUpperCase() + professional.priceRange.slice(1)}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{professional.description}</p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-1">
                      {professional.specializations.slice(0, 3).map(spec => (
                        <span key={spec} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {spec}
                        </span>
                      ))}
                      {professional.specializations.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{professional.specializations.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Experience</h4>
                    <p className="text-sm text-gray-600">
                      {professional.credentials.yearsExperience} years • {professional.credentials.registrationBody}
                    </p>
                    <p className="text-sm text-gray-600">License: {professional.credentials.license}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {professional.location.town}, {professional.location.county} County
                  </div>
                </div>
                
                {showContactInfo && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {professional.contact.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {professional.contact.email}
                      </div>
                      {professional.contact.website && (
                        <div className="flex items-center text-sm text-blue-600">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          <a href={`https://${professional.contact.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {professional.contact.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Languages: {professional.languages.join(', ')}
                  </div>
                  
                  {onSelectProfessional && (
                    <button
                      onClick={() => onSelectProfessional(professional)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Select Professional
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredProfessionals.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No professionals found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
        </div>
      )}
    </div>
  );
};

export default ProfessionalResourcesDirectory;