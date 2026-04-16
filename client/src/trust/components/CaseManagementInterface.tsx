import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, 
  User, 
  Clock, 
  AlertTriangle,
  FileText,
  MessageSquare,
  Search,
  Plus,
  Edit,
  Archive
} from 'lucide-react'
import React, { useState } from 'react'

import { Badge } from '../../shared/components/ui/badge'
import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Input } from '../../shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'
import { useToast } from '../../shared/hooks/use-toast'

// Interface definitions with proper readonly properties for better TypeScript safety
interface CaseManagementInterfaceProps {
  readonly userId?: string;
  readonly showCreateCase?: boolean;
}

interface InvestigationCase {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: 'open' | 'investigating' | 'resolved' | 'closed';
  readonly priority: 'low' | 'medium' | 'high' | 'urgent';
  readonly assignedTo: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly dueDate?: Date;
  readonly alertIds: readonly string[];
  readonly evidence: readonly Evidence[];
  readonly notes: readonly CaseNote[];
  readonly tags: readonly string[];
}

interface Evidence {
  readonly id: string;
  readonly type: 'document' | 'screenshot' | 'log' | 'witness' | 'other';
  readonly name: string;
  readonly description: string;
  readonly uploadedAt: Date;
  readonly uploadedBy: string;
  readonly fileUrl?: string;
}

interface CaseNote {
  readonly id: string;
  readonly content: string;
  readonly createdAt: Date;
  readonly createdBy: string;
  readonly type: 'note' | 'action' | 'decision';
}

// Mock data with proper readonly arrays and immutable structure
const MOCK_CASES: readonly InvestigationCase[] = [
  {
    id: 'case-001',
    title: 'Suspicious Property Flipping Network',
    description: 'Investigation into coordinated property flipping activities involving multiple participants',
    status: 'investigating',
    priority: 'high',
    assignedTo: 'John Investigator',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    dueDate: new Date('2024-02-15'),
    alertIds: ['alert-001', 'alert-002', 'alert-003'],
    evidence: [],
    notes: [],
    tags: ['property_flipping', 'network_analysis', 'high_value']
  },
  {
    id: 'case-002', 
    title: 'Document Forgery Investigation',
    description: 'Multiple forged title deeds detected in the same geographic area',
    status: 'open',
    priority: 'urgent',
    assignedTo: 'Sarah Detective',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    dueDate: new Date('2024-01-25'),
    alertIds: ['alert-004', 'alert-005'],
    evidence: [],
    notes: [],
    tags: ['document_forgery', 'title_deeds', 'geographic_cluster']
  }
] as const;

// Configuration objects with proper typing - these help maintain consistency and type safety
const STATUS_CONFIG = {
  open: { color: 'bg-blue-100 text-blue-800', label: 'Open' },
  investigating: { color: 'bg-yellow-100 text-yellow-800', label: 'Investigating' },
  resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
  closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed' }
} as const;

const PRIORITY_CONFIG = {
  low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
  medium: { color: 'bg-blue-100 text-blue-800', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' }
} as const;

export function CaseManagementInterface({ 
  userId: _userId, // Prefixed with underscore to indicate intentionally unused
  showCreateCase = true 
}: CaseManagementInterfaceProps) {
  const { toast } = useToast();
  
  // State management - using proper typing and immutable patterns
  const [cases] = useState<readonly InvestigationCase[]>(MOCK_CASES);
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Filtering logic with improved type safety and null checking
  const filteredCases = cases.filter((case_: InvestigationCase) => {
    const matchesSearch = case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         case_.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || case_.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Event handlers with proper error handling and user feedback
  const handleCreateCase = (): void => {
    toast({
      title: "Create New Case",
      description: "Case creation dialog would open here.",
    });
  };

  // Utility functions for date formatting and calculations
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // Safe calculation with null checking to avoid runtime errors
  const getDaysUntilDue = (dueDate?: Date): number | null => {
    if (!dueDate) return null;
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    return Math.ceil(diffMs / 86400000);
  };

  return (
    <div className="space-y-6">
      {/* Header section with conditional rendering for create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Case Management</h2>
          <p className="text-gray-600">
            Manage fraud investigation cases and track progress
          </p>
        </div>
        
        {showCreateCase && (
          <Button onClick={handleCreateCase}>
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        )}
      </div>

      {/* Filters section with improved accessibility and UX */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Status filter with proper value handling */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority filter with consistent pattern */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List with improved performance through proper key usage */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Investigation Cases</CardTitle>
              <CardDescription>
                {filteredCases.length} case(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {filteredCases.map((case_: InvestigationCase) => {
                    const statusConfig = STATUS_CONFIG[case_.status];
                    const priorityConfig = PRIORITY_CONFIG[case_.priority];
                    const daysUntilDue = getDaysUntilDue(case_.dueDate);
                    
                    return (
                      <motion.div
                        key={case_.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card 
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedCase?.id === case_.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedCase(case_)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge className={statusConfig.color}>
                                    {statusConfig.label}
                                  </Badge>
                                  <Badge className={priorityConfig.color}>
                                    {priorityConfig.label}
                                  </Badge>
                                  {/* Safe null checking prevents runtime errors */}
                                  {daysUntilDue !== null && daysUntilDue <= 3 && (
                                    <Badge variant="destructive" className="text-xs">
                                      Due in {daysUntilDue} days
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {case_.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {case_.description}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <User className="h-3 w-3" />
                                  <span>{case_.assignedTo}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>{case_.alertIds.length} alerts</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Updated {formatTimeAgo(case_.updatedAt)}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Tag display with proper array handling */}
                            {case_.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {case_.tags.slice(0, 3).map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag.replace('_', ' ')}
                                  </Badge>
                                ))}
                                {case_.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{case_.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                
                {/* Empty state with proper user guidance */}
                {filteredCases.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No cases found matching your criteria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Case Details with conditional rendering and proper null checking */}
        <div>
          {selectedCase ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Case Details</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Archive className="h-3 w-3 mr-1" />
                      Archive
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="evidence">Evidence</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {selectedCase.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {selectedCase.description}
                      </p>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <Badge className={STATUS_CONFIG[selectedCase.status].color}>
                            {STATUS_CONFIG[selectedCase.status].label}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Priority:</span>
                          <Badge className={PRIORITY_CONFIG[selectedCase.priority].color}>
                            {PRIORITY_CONFIG[selectedCase.priority].label}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned to:</span>
                          <span className="font-medium">{selectedCase.assignedTo}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span>{selectedCase.createdAt.toLocaleDateString()}</span>
                        </div>
                        
                        {/* Safe due date handling with proper null checking */}
                        {selectedCase.dueDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Due date:</span>
                            <span className={getDaysUntilDue(selectedCase.dueDate) !== null && getDaysUntilDue(selectedCase.dueDate)! <= 3 ? 'text-red-600 font-medium' : ''}>
                              {selectedCase.dueDate.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Related alerts:</span>
                          <span className="font-medium">{selectedCase.alertIds.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h5 className="font-medium text-gray-900 mb-2">Tags</h5>
                      <div className="flex flex-wrap gap-1">
                        {selectedCase.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Evidence tab with proper placeholder state */}
                  <TabsContent value="evidence">
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No evidence uploaded yet</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Evidence
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Notes tab with consistent placeholder pattern */}
                  <TabsContent value="notes">
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No notes added yet</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Plus className="h-3 w-3 mr-1" />
                        Add Note
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            // Empty state when no case is selected
            <Card>
              <CardContent className="p-8 text-center">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Case
                </h3>
                <p className="text-gray-600">
                  Choose a case from the list to view details and manage the investigation.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default CaseManagementInterface;