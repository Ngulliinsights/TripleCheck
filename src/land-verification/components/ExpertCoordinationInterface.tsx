import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { cn } from '@shared/lib/utils';
import { 
  UserCheck, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  DollarSign,
  Award,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import React, { useState } from 'react';

import type { 
  ExpertProfile,
  ExpertAssignment,
  ExpertSearchRequest 
} from '@/types/land-verification';

interface ExpertCoordinationInterfaceProps {
  sessionId: number;
  assignments: ExpertAssignment[];
  onSearchExperts: (criteria: ExpertSearchRequest) => Promise<ExpertProfile[]>;
  onAssignExpert: (expertId: string, layerId?: number) => void;
  onViewExpertDetails: (expertId: string) => void;
  className?: string;
}

export default function ExpertCoordinationInterface({
  sessionId,
  assignments,
  onSearchExperts,
  onAssignExpert,
  onViewExpertDetails,
  className
}: ExpertCoordinationInterfaceProps) {
  const [selectedTab, setSelectedTab] = useState('assignments');
  const [searchResults, setSearchResults] = useState<ExpertProfile[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<ExpertSearchRequest>({
    expertType: 'surveyor',
    location: '',
    specialization: '',
    budget: { min: 0, max: 100000 }
  });
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const results = await onSearchExperts(searchCriteria);
      setSearchResults(results);
    } catch (error) {
      console.error('Expert search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getExpertTypeColor = (type: string): string => {
    switch (type) {
      case 'surveyor':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'lawyer':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'appraiser':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'environmental':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'valuer':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'assigned':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const ExpertCard = ({ expert, showAssignButton = false }: { 
    expert: ExpertProfile; 
    showAssignButton?: boolean;
  }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${expert.name}`} />
            <AvatarFallback>{expert.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium">{expert.name}</h4>
              <Badge className={cn('text-xs', getExpertTypeColor(expert.expertType))}>
                {expert.expertType}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {expert.location}
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {expert.experience.successRate}%
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <span>{expert.experience.yearsOfExperience} years experience</span>
              <span>{expert.experience.relevantCases} cases</span>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {expert.specializations.slice(0, 3).map((spec, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}
              {expert.specializations.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{expert.specializations.length - 3}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {expert.pricing.hourlyRate ? 
                    `KES ${expert.pricing.hourlyRate}/hr` : 
                    `KES ${expert.pricing.fixedFee} fixed`
                  }
                </div>
                {expert.availability.available && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Clock className="h-3 w-3" />
                    Available
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onViewExpertDetails(expert.id)}
                >
                  View
                </Button>
                {showAssignButton && (
                  <Button 
                    size="sm"
                    onClick={() => onAssignExpert(expert.id)}
                  >
                    Assign
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AssignmentCard = ({ assignment }: { assignment: ExpertAssignment }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="font-medium">Expert Assignment</span>
          </div>
          <Badge className={cn('text-xs', getStatusColor(assignment.status))}>
            {assignment.status.toUpperCase()}
          </Badge>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expert:</span>
            <span className="font-medium">{assignment.expertName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <Badge className={cn('text-xs', getExpertTypeColor(assignment.expertType))}>
              {assignment.expertType}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Assigned:</span>
            <span>{new Date(assignment.assignedAt).toLocaleDateString()}</span>
          </div>
          {assignment.expectedCompletionDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due:</span>
              <span>{new Date(assignment.expectedCompletionDate).toLocaleDateString()}</span>
            </div>
          )}
          {assignment.budget && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Budget:</span>
              <span>KES {assignment.budget.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        {assignment.specialInstructions && (
          <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
            <span className="text-muted-foreground">Instructions: </span>
            {assignment.specialInstructions}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expert Coordination</CardTitle>
            <CardDescription>
              Manage professional experts for verification tasks
            </CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Find Expert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Find Expert</DialogTitle>
                <DialogDescription>
                  Search for qualified experts based on your requirements
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Expert Type</label>
                    <Select 
                      value={searchCriteria.expertType} 
                      onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, expertType: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="surveyor">Surveyor</SelectItem>
                        <SelectItem value="lawyer">Lawyer</SelectItem>
                        <SelectItem value="appraiser">Appraiser</SelectItem>
                        <SelectItem value="environmental">Environmental Expert</SelectItem>
                        <SelectItem value="valuer">Valuer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <Input 
                      placeholder="Enter location"
                      value={searchCriteria.location}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Specialization</label>
                    <Input 
                      placeholder="Enter specialization"
                      value={searchCriteria.specialization}
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, specialization: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Max Budget (KES)</label>
                    <Input 
                      type="number"
                      placeholder="Enter max budget"
                      value={searchCriteria.budget?.max}
                      onChange={(e) => setSearchCriteria(prev => ({ 
                        ...prev, 
                        budget: { ...prev.budget!, max: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
                
                <Button onClick={handleSearch} disabled={isSearching} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? 'Searching...' : 'Search Experts'}
                </Button>
                
                {searchResults.length > 0 && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {searchResults.map((expert) => (
                      <ExpertCard key={expert.id} expert={expert} showAssignButton />
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assignments">Current Assignments</TabsTrigger>
            <TabsTrigger value="history">Assignment History</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            {assignments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments
                  .filter(a => a.status !== 'completed' && a.status !== 'cancelled')
                  .map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Active Assignments</h3>
                <p className="mb-4">Find and assign experts to help with verification tasks</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Find Expert</Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {assignments.filter(a => a.status === 'completed' || a.status === 'cancelled').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments
                  .filter(a => a.status === 'completed' || a.status === 'cancelled')
                  .map((assignment) => (
                    <AssignmentCard key={assignment.id} assignment={assignment} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No assignment history available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}