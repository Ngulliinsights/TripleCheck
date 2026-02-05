import { Alert, AlertDescription } from '../../shared/components/ui/alert'
import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../shared/components/ui/dialog'
import { Skeleton } from '../../shared/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '../../shared/components/ui/index'

import { 
  LandVerificationDashboard,
  VerificationProgressTracker,
  RiskAssessmentDisplay,
  ExpertCoordinationInterface
} from '../components'

import type { 
  VerificationSessionResponse,
  VerificationLayerWithResults,
  RiskAssessmentResponse,
  ExpertAssignment,
  ExpertProfile,
  ExpertSearchRequest
} from '@/types/land-verification'

export default function LandVerificationDashboardPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<VerificationSessionResponse[]>([]);
  const [selectedSession, setSelectedSession] = useState<VerificationSessionResponse | null>(null);
  const [sessionLayers, setSessionLayers] = useState<VerificationLayerWithResults[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentResponse | null>(null);
  const [expertAssignments, setExpertAssignments] = useState<ExpertAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadSessionDetails(selectedSession.id);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/land-verification/sessions', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load verification sessions');
      }
      
      const data = await response.json();
      setSessions(data.data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load sessions');
      toast.error('Failed to load verification sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessionId: number) => {
    try {
      // Load session layers
      const layersResponse = await fetch(`/api/land-verification/sessions/${sessionId}`, {
        credentials: 'include'
      });
      
      if (layersResponse.ok) {
        const layersData = await layersResponse.json();
        setSessionLayers(layersData.data.verificationLayers || []);
      }

      // Load risk assessment
      const riskResponse = await fetch(`/api/land-verification/sessions/${sessionId}/risk-assessment`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (riskResponse.ok) {
        const riskData = await riskResponse.json();
        setRiskAssessment(riskData.data);
      }

      // Load expert assignments
      const expertsResponse = await fetch(`/api/land-verification/sessions/${sessionId}/experts`, {
        credentials: 'include'
      });
      
      if (expertsResponse.ok) {
        const expertsData = await expertsResponse.json();
        setExpertAssignments(expertsData.data || []);
      }
    } catch (error) {
      console.error('Error loading session details:', error);
      toast.error('Failed to load session details');
    }
  };

  const handleSessionSelect = (sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setShowSessionDetails(true);
    }
  };

  const handleNewVerification = () => {
    navigate('/land-verification/new');
  };

  const handleLayerAction = async (layerId: number, action: 'start' | 'pause' | 'resume' | 'view') => {
    try {
      if (action === 'view') {
        navigate(`/land-verification/layers/${layerId}`);
        return;
      }

      const response = await fetch(`/api/land-verification/sessions/${selectedSession?.id}/layers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          layerId,
          action
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} layer`);
      }

      toast.success(`Layer ${action} successful`);
      if (selectedSession) {
        loadSessionDetails(selectedSession.id);
      }
    } catch (error) {
      console.error(`Error ${action} layer:`, error);
      toast.error(`Failed to ${action} layer`);
    }
  };

  const handleRefreshRiskAssessment = async () => {
    if (!selectedSession) return;
    
    try {
      const response = await fetch(`/api/land-verification/sessions/${selectedSession.id}/risk-assessment`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh risk assessment');
      }
      
      const data = await response.json();
      setRiskAssessment(data.data);
      toast.success('Risk assessment updated');
    } catch (error) {
      console.error('Error refreshing risk assessment:', error);
      toast.error('Failed to refresh risk assessment');
    }
  };

  const handleExportReport = async () => {
    if (!selectedSession) return;
    
    try {
      const response = await fetch(`/api/land-verification/sessions/${selectedSession.id}/report`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `land-verification-report-${selectedSession.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const handleViewRiskDetails = (factorId: number) => {
    navigate(`/land-verification/risk-factors/${factorId}`);
  };

  const handleSearchExperts = async (criteria: ExpertSearchRequest): Promise<ExpertProfile[]> => {
    try {
      const response = await fetch('/api/land-verification/experts/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(criteria)
      });
      
      if (!response.ok) {
        throw new Error('Failed to search experts');
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error searching experts:', error);
      toast.error('Failed to search experts');
      return [];
    }
  };

  const handleAssignExpert = async (expertId: string, layerId?: number) => {
    if (!selectedSession) return;
    
    try {
      const response = await fetch(`/api/land-verification/sessions/${selectedSession.id}/experts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          expertId,
          layerId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign expert');
      }
      
      toast.success('Expert assigned successfully');
      loadSessionDetails(selectedSession.id);
    } catch (error) {
      console.error('Error assigning expert:', error);
      toast.error('Failed to assign expert');
    }
  };

  const handleViewExpertDetails = (expertId: string) => {
    navigate(`/land-verification/experts/${expertId}`);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadSessions} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {!showSessionDetails ? (
        <LandVerificationDashboard
          sessions={sessions}
          onSessionSelect={handleSessionSelect}
          onNewVerification={handleNewVerification}
          loading={loading}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSessionDetails(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {selectedSession?.property?.title || `Property ${selectedSession?.propertyId}`}
              </h1>
              <p className="text-muted-foreground">
                Verification Session #{selectedSession?.id}
              </p>
            </div>
          </div>

          <Tabs defaultValue="progress" className="space-y-6">
            <TabsList>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
              <TabsTrigger value="experts">Expert Coordination</TabsTrigger>
            </TabsList>

            <TabsContent value="progress">
              <VerificationProgressTracker
                sessionId={selectedSession?.id || 0}
                layers={sessionLayers}
                onLayerAction={handleLayerAction}
              />
            </TabsContent>

            <TabsContent value="risk">
              {riskAssessment ? (
                <RiskAssessmentDisplay
                  assessment={riskAssessment}
                  onRefresh={handleRefreshRiskAssessment}
                  onExportReport={handleExportReport}
                  onViewDetails={handleViewRiskDetails}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-48 mx-auto" />
                      <Skeleton className="h-4 w-64 mx-auto" />
                      <Button onClick={handleRefreshRiskAssessment}>
                        Generate Risk Assessment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="experts">
              <ExpertCoordinationInterface
                sessionId={selectedSession?.id || 0}
                assignments={expertAssignments}
                onSearchExperts={handleSearchExperts}
                onAssignExpert={handleAssignExpert}
                onViewExpertDetails={handleViewExpertDetails}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}