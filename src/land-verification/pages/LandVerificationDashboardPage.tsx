import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, RefreshCw, FileText, Plus } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '../../shared/components/ui/alert';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent } from '../../shared/components/ui/card';
import { Skeleton } from '../../shared/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs';
import { useToast } from '../../shared/hooks/use-toast';

import { 
  LandVerificationDashboard,
  VerificationProgressTracker,
  RiskAssessmentDisplay,
  ExpertCoordinationInterface
} from '../components';

import type { 
  VerificationSessionResponse,
  VerificationLayerWithResults,
  RiskAssessmentResponse,
  ExpertAssignment,
  ExpertProfile,
  ExpertSearchRequest
} from '@/types/land-verification';

export default function LandVerificationDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // --- State Management ---
  const [sessions, setSessions] = useState<VerificationSessionResponse[]>([]);
  const [selectedSession, setSelectedSession] = useState<VerificationSessionResponse | null>(null);
  const [sessionLayers, setSessionLayers] = useState<VerificationLayerWithResults[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentResponse | null>(null);
  const [expertAssignments, setExpertAssignments] = useState<ExpertAssignment[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/land-verification/sessions', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load sessions');
      const data = await response.json();
      setSessions(data.data || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to server';
      setError(msg);
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadSessionDetails = useCallback(async (sessionId: string) => {
    setIsDetailLoading(true);
    
    try {
      // Parallel fetch for all resources to minimize waterfall loading
      const [layersRes, expertsRes, riskRes] = await Promise.allSettled([
        fetch(`/api/land-verification/sessions/${sessionId}`, { credentials: 'include' }),
        fetch(`/api/land-verification/sessions/${sessionId}/experts`, { credentials: 'include' }),
        fetch(`/api/land-verification/sessions/${sessionId}/risk-assessment`, { 
          method: 'POST', 
          credentials: 'include' 
        })
      ]);

      let syncWarning = false;

      // Handle Layers
      if (layersRes.status === 'fulfilled' && layersRes.value.ok) {
        const layersData = await layersRes.value.json();
        setSessionLayers(layersData.data.verificationLayers || []);
      } else {
        syncWarning = true;
      }

      // Handle Experts
      if (expertsRes.status === 'fulfilled' && expertsRes.value.ok) {
        const expertsData = await expertsRes.value.json();
        setExpertAssignments(expertsData.data || []);
      } else {
        syncWarning = true;
      }

      // Handle Risk Assessment
      if (riskRes.status === 'fulfilled' && riskRes.value.ok) {
        const riskData = await riskRes.value.json();
        setRiskAssessment(riskData.data);
      } else {
        setRiskAssessment(null); 
      }

      if (syncWarning) {
        toast({ 
          variant: 'destructive', 
          title: 'Sync Warning', 
          description: 'Some session details could not be loaded.' 
        });
      }

    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch session details.' });
    } finally {
      setIsDetailLoading(false);
    }
  }, [toast]);

  // --- Lifecycle ---

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Handle URL deep linking (e.g., /dashboard?session=123)
  useEffect(() => {
    const sessionId = searchParams.get('session');
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === sessionId);
      
      if (session && session.id !== selectedSession?.id) {
        setSelectedSession(session);
        loadSessionDetails(session.id);
      }
    }
  }, [searchParams, sessions, loadSessionDetails, selectedSession?.id]);

  // --- Handlers ---

  const handleSessionSelect = useCallback((sessionId: string) => {
    setSearchParams({ session: sessionId });
  }, [setSearchParams]);

  const handleBack = useCallback(() => {
    setSearchParams({});
    setSelectedSession(null);
    setSessionLayers([]);
    setRiskAssessment(null);
    setExpertAssignments([]);
  }, [setSearchParams]);

  const handleLayerAction = useCallback(async (layerId: number, action: 'start' | 'pause' | 'resume' | 'view') => {
    if (action === 'view') {
      navigate(`/land-verification/layers/${layerId}`);
      return;
    }

    if (!selectedSession) return;

    try {
      const response = await fetch(`/api/land-verification/sessions/${selectedSession.id}/layers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ layerId, action })
      });

      if (!response.ok) throw new Error(`Could not ${action} layer`);

      toast({ title: 'Layer Updated', description: `Successfully performed ${action} action.` });
      loadSessionDetails(selectedSession.id);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Action Failed', description: 'Please try again later.' });
    }
  }, [selectedSession, navigate, toast, loadSessionDetails]);

  const handleSearchExperts = useCallback(async (criteria: ExpertSearchRequest): Promise<ExpertProfile[]> => {
    try {
      const response = await fetch('/api/land-verification/experts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(criteria)
      });
      const data = await response.json();
      return data.data || [];
    } catch {
      return [];
    }
  }, []);

  const handleAssignExpert = useCallback(async (expertId: string, layerId?: number) => {
    if (!selectedSession) return;
    try {
      const response = await fetch(`/api/land-verification/sessions/${selectedSession.id}/experts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ expertId, layerId })
      });
      if (!response.ok) throw new Error('Assignment failed');
      toast({ title: 'Expert Assigned', description: 'Expert notified successfully.' });
      loadSessionDetails(selectedSession.id);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Assignment Error', description: 'Failed to assign expert.' });
    }
  }, [selectedSession, toast, loadSessionDetails]);

  // --- UI Components ---

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadSessions} className="mt-6">
          <RefreshCw className="mr-2 h-4 w-4" /> Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {!selectedSession ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Verification Dashboard</h1>
            <Button onClick={() => navigate('/land-verification/new')}>
              <Plus className="mr-2 h-4 w-4" /> New Verification
            </Button>
          </div>
          <LandVerificationDashboard
            sessions={sessions}
            // @ts-expect-error - Assuming prop type will be updated in child component
            onSessionSelect={handleSessionSelect}
            onNewVerification={() => navigate('/land-verification/new')}
            loading={isLoading}
          />
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between border-b pb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedSession.property?.title || `Session #${selectedSession.id}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Status: <span className="capitalize font-medium text-foreground">{selectedSession.status}</span>
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="hidden md:flex">
              <FileText className="mr-2 h-4 w-4" /> Download Full Report
            </Button>
          </div>

          <Tabs defaultValue="progress" className="w-full">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="progress">Layer Progress</TabsTrigger>
              <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
              <TabsTrigger value="experts">Expert Network</TabsTrigger>
            </TabsList>

            <TabsContent value="progress" className="mt-6">
              {isDetailLoading && sessionLayers.length === 0 ? (
                <div className="space-y-4">
                  <Skeleton className="h-[150px] w-full" />
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : (
                <VerificationProgressTracker
                  sessionId={selectedSession.id}
                  // @ts-expect-error - Assuming prop type will be updated in child component
                  layers={sessionLayers}
                  onLayerAction={handleLayerAction}
                />
              )}
            </TabsContent>

            <TabsContent value="risk" className="mt-6">
              {riskAssessment ? (
                <RiskAssessmentDisplay
                  // @ts-expect-error - Assuming prop type will be updated in child component
                  assessment={riskAssessment}
                  onRefresh={() => loadSessionDetails(selectedSession.id)}
                  onExportReport={() => toast({ title: "Coming Soon", description: "PDF Export is being prepared." })}
                  onViewDetails={(fid: string) => navigate(`/land-verification/risk-factors/${fid}`)}
                />
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-20 text-center">
                    <div className="space-y-4">
                      <RefreshCw className="h-10 w-10 text-muted-foreground mx-auto" />
                      <h3 className="text-lg font-semibold">No Risk Data</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        A risk assessment can be generated once initial verification layers are processed.
                      </p>
                      <Button variant="secondary" onClick={() => loadSessionDetails(selectedSession.id)}>
                        Try Manual Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="experts" className="mt-6">
              <ExpertCoordinationInterface
                sessionId={selectedSession.id}
                // @ts-expect-error - Assuming prop type will be updated in child component
                assignments={expertAssignments}
                onSearchExperts={handleSearchExperts}
                onAssignExpert={handleAssignExpert}
                onViewExpertDetails={(eid: string) => navigate(`/land-verification/experts/${eid}`)}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}