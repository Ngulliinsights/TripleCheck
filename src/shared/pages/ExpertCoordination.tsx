import React, { useState, useCallback, useMemo } from 'react';
import { 
  Users, 
  Search, 
  MapPin, 
  Star, 
  MessageSquare,
  CheckCircle,
  Award,
  Briefcase,
  Shield,
  FileText,
  DollarSign,
  Phone,
  Mail
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';

interface Expert {
  id: string;
  name: string;
  profession: 'lawyer' | 'surveyor' | 'valuer' | 'inspector';
  specialization: string[];
  location: string;
  rating: number;
  reviewCount: number;
  experience: number;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'unavailable';
  description: string;
  completedProjects: number;
  responseTime: string;
}

const mockExperts: Expert[] = [
  {
    id: 'exp-1',
    name: 'Sarah Wanjiku',
    profession: 'lawyer',
    specialization: ['Property Law', 'Real Estate Transactions', 'Title Disputes'],
    location: 'Nairobi, Kenya',
    rating: 4.9,
    reviewCount: 127,
    experience: 12,
    hourlyRate: 8000,
    availability: 'available',
    description: 'Experienced property lawyer specializing in real estate transactions and title verification.',
    completedProjects: 340,
    responseTime: '< 2 hours'
  },
  {
    id: 'exp-2',
    name: 'David Kimani',
    profession: 'surveyor',
    specialization: ['Land Surveying', 'Boundary Disputes', 'Topographical Surveys'],
    location: 'Nairobi, Kenya',
    rating: 4.8,
    reviewCount: 89,
    experience: 8,
    hourlyRate: 6000,
    availability: 'available',
    description: 'Professional land surveyor with expertise in boundary determination and land mapping.',
    completedProjects: 156,
    responseTime: '< 4 hours'
  },
  {
    id: 'exp-3',
    name: 'Grace Muthoni',
    profession: 'valuer',
    specialization: ['Property Valuation', 'Market Analysis', 'Investment Advisory'],
    location: 'Nairobi, Kenya',
    rating: 4.7,
    reviewCount: 203,
    experience: 15,
    hourlyRate: 7500,
    availability: 'busy',
    description: 'Certified property valuer with extensive experience in residential and commercial properties.',
    completedProjects: 520,
    responseTime: '< 6 hours'
  }
];

const professionIcons = {
  lawyer: Briefcase,
  surveyor: MapPin,
  valuer: DollarSign,
  inspector: CheckCircle
};

export default function ExpertCoordination() {
  const { toast } = useToast();
  const [experts] = useState(mockExperts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfession, setFilterProfession] = useState<string>('all');

  const filteredExperts = useMemo(() => {
    return experts.filter(expert => {
      const matchesSearch = !searchQuery || 
        expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.specialization.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesProfession = filterProfession === 'all' || expert.profession === filterProfession;
      
      return matchesSearch && matchesProfession;
    });
  }, [experts, searchQuery, filterProfession]);

  const handleContactExpert = useCallback((expert: Expert) => {
    toast({
      title: 'Contact request sent',
      description: `Your request to contact ${expert.name} has been sent. They will respond within ${expert.responseTime}.`,
    });
  }, [toast]);

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Expert Coordination
          </h1>
          <p className="text-muted-foreground">
            Connect with verified legal experts, surveyors, and property professionals
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search experts by name or specialization..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={filterProfession} onValueChange={setFilterProfession}>
                <SelectTrigger>
                  <SelectValue placeholder="All Professions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Professions</SelectItem>
                  <SelectItem value="lawyer">Lawyers</SelectItem>
                  <SelectItem value="surveyor">Surveyors</SelectItem>
                  <SelectItem value="valuer">Valuers</SelectItem>
                  <SelectItem value="inspector">Inspectors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Experts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredExperts.map((expert) => {
            const IconComponent = professionIcons[expert.profession];
            return (
              <Card key={expert.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{expert.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {expert.profession}
                        </p>
                      </div>
                    </div>
                    <Badge className={getAvailabilityColor(expert.availability)}>
                      {expert.availability}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {expert.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{expert.rating}</span>
                      <span className="text-muted-foreground">({expert.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-blue-500" />
                      <span>{expert.experience} years</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{expert.location}</span>
                    </div>
                    <div className="font-medium">
                      KES {expert.hourlyRate.toLocaleString()}/hr
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Specializations:</div>
                    <div className="flex flex-wrap gap-1">
                      {expert.specialization.slice(0, 2).map((spec, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {expert.specialization.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{expert.specialization.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{expert.completedProjects} projects completed</span>
                    <span>Responds in {expert.responseTime}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleContactExpert(expert)}
                      disabled={expert.availability === 'unavailable'}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                    <Button size="sm" variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredExperts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No experts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}