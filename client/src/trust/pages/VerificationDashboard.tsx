import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../local/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../local/components/ui/card';
import { Badge } from '../../local/components/ui/badge';
import { Button } from '../../local/components/ui/button';
import { Alert, AlertDescription } from '../../local/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Shield, 
  TrendingUp,
  Loader2,
  RefreshCw,
  Download,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../local/hooks/use-toast';

// Lazy-loaded sub-components for better performance
const FraudDetectionDashboard = React.lazy(() => 
  import('../components/FraudDetectionDashboard').then(m => ({
    default: m.default || m.FraudDetectionDashboard
  }))
);

const LandVerificationDashboard = React.lazy(() =>
  import('../../land-verification/components/LandVerificationDashboard').then(m => ({
    default: m.default || m.LandVerificationDashboard
  }))
);

const DocumentVerificationResults = React.lazy(() =>
  import('../components/DocumentVerificationResults').then(m => ({
    default: m.default || m.DocumentVerificationResults
  }))
);

interface VerificationProgress {
  type: 'verification_started' | 'verification_completed' | 'verification_error' | 'channel_closing';
  message: string;
  timestamp: Date;
  status?: string;
  error?: string;
  result?: Record<string, any>;
}

interface DashboardState {
  workflowId?: string;
  status: 'idle' | 'in_progress' | 'completed' | 'error';
  documentVerificationComplete: boolean;
  landVerificationComplete: boolean;
  fraudDetectionComplete: boolean;
  progressEvents: VerificationProgress[];
  completionTime?: number;
  overallRiskScore?: number;
}

interface VerificationDashboardProps {
  propertyId?: string;
  userId?: string;
  workflowId?: string;
  onVerificationComplete?: (results: any) => void;
}

/**
 * Unified Verification Dashboard - Phase 3 Implementation
 * 
 * Consolidates Document Verification, Land Verification, and Fraud Detection
 * into a single view with real-time WebSocket progress streaming.
 * 
 * RATIONALE: Moving users through 4 discrete pages requires manual state hydration
 * and network request re-evaluation on every unmount/mount cycle. A unified view
 * keeps the React Context active and the WebSocket channel hot, vastly improving
 * perceived performance.
 * 
 * PERFORMANCE: Uses lazy loading and dynamic mounting to reduce initial bundle impact.
 */
export default function VerificationDashboard({
  propertyId,
  userId,
  workflowId: initialWorkflowId,
  onVerificationComplete
}: VerificationDashboardProps) {
  const { toast } = useToast();
  const [state, setState] = useState<DashboardState>({
    status: 'idle',
    documentVerificationComplete: false,
    landVerificationComplete: false,
    fraudDetectionComplete: false,
    progressEvents: [],
  });
  const [activeTab, setActiveTab] = useState('overview');
  const socketRef = useRef<Socket | null>(null);
  const progressScrollRef = useRef<HTMLDivElement>(null);

  /**
   * Establish Socket.IO connection to real-time verification stream
   */
  useEffect(() => {
    if (!initialWorkflowId) return;

    setState(prev => ({ ...prev, workflowId: initialWorkflowId, status: 'in_progress' }));

    // Get JWT token from localStorage or auth context
    const token = localStorage.getItem('jwt_token') || '';

    const socket = io({
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to verification stream');
    });

    // Listen for verification events on the workflow-specific channel
    const eventHandler = (message: any) => {
      try {
        const progressEvent: VerificationProgress = {
          type: message.type,
          message: message.message,
          timestamp: new Date(message.timestamp || Date.now()),
          status: message.status,
          error: message.error,
          result: message.result,
        };

        setState(prev => {
          const newState = { ...prev };
          
          // Update progress events
          newState.progressEvents = [...prev.progressEvents, progressEvent];

          // Update completion status based on event type
          if (message.type === 'document_verification_completed') {
            newState.documentVerificationComplete = true;
          } else if (message.type === 'land_verification_completed') {
            newState.landVerificationComplete = true;
          } else if (message.type === 'fraud_detection_completed') {
            newState.fraudDetectionComplete = true;
          }

          // Handle final completion
          if (message.type === 'verification_completed') {
            newState.status = 'completed';
            newState.overallRiskScore = message.result?.overallRiskScore;
            
            if (progressEvent.timestamp && prev.progressEvents[0]) {
              const startTime = new Date(prev.progressEvents[0].timestamp).getTime();
              newState.completionTime = progressEvent.timestamp.getTime() - startTime;
            }
          } else if (message.type === 'verification_error') {
            newState.status = 'error';
          }

          return newState;
        });

        // Scroll progress list to bottom
        if (progressScrollRef.current) {
          setTimeout(() => {
            progressScrollRef.current?.scrollTo({
              top: progressScrollRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }, 0);
        }

        // Show toast for significant events
        if (message.type === 'verification_completed') {
          toast({
            title: 'Verification Complete',
            description: 'All checks have finished. Review the results below.',
            variant: 'default',
          });
          
          if (onVerificationComplete && message.result) {
            onVerificationComplete(message.result);
          }
        } else if (message.type === 'verification_error') {
          toast({
            title: 'Verification Error',
            description: message.error || 'An error occurred during verification.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to parse verification event:', error);
      }
    };

    // Listen on verification workflow channel
    socket.on(`verification:${initialWorkflowId}`, eventHandler);

    socket.on('disconnect', () => {
      console.log('Disconnected from verification stream');
    });

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
      toast({
        title: 'Connection Error',
        description: 'Lost connection to verification stream.',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, status: 'error' }));
    });

    socketRef.current = socket;

    return () => {
      socket.off(`verification:${initialWorkflowId}`, eventHandler);
      socket.disconnect();
    };
  }, [initialWorkflowId, onVerificationComplete, toast]);

  const handleRefresh = useCallback(() => {
    // Reconnect Socket.IO and restart monitoring
    setState(prev => ({
      ...prev,
      status: 'in_progress',
      progressEvents: [],
      documentVerificationComplete: false,
      landVerificationComplete: false,
      fraudDetectionComplete: false,
    }));

    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', {
        channel: `verification:${state.workflowId}`,
      });
    }
  }, [state.workflowId]);

  const handleExport = useCallback(() => {
    if (!state.progressEvents.length) {
      toast({
        title: 'No Data',
        description: 'No verification results to export.',
        variant: 'default',
      });
      return;
    }

    const exportData = {
      workflowId: state.workflowId,
      propertyId,
      userId,
      status: state.status,
      completionTime: state.completionTime,
      overallRiskScore: state.overallRiskScore,
      events: state.progressEvents,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verification_${state.workflowId}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: 'Verification results have been exported.',
      variant: 'default',
    });
  }, [state, propertyId, userId, toast]);

  const progressPercentage = (() => {
    let completed = 0;
    if (state.documentVerificationComplete) completed++;
    if (state.landVerificationComplete) completed++;
    if (state.fraudDetectionComplete) completed++;
    return (completed / 3) * 100;
  })();

  const riskLevel = state.overallRiskScore 
    ? state.overallRiskScore >= 800 ? 'low' :
      state.overallRiskScore >= 600 ? 'medium' : 'high'
    : undefined;

  const riskColor = riskLevel === 'low' ? 'text-green-600' :
                    riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="w-full h-full space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Verification Dashboard</h1>
            <p className="text-gray-500 mt-2">
              Property ID: {propertyId} | Workflow: {state.workflowId}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={state.status === 'idle'}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
              disabled={!state.progressEvents.length}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Verification Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {state.status === 'in_progress' && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              )}
              {state.status === 'completed' && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {state.status === 'error' && (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-semibold capitalize">{state.status}</span>
            </div>
            {riskLevel && (
              <div className="flex items-center gap-2">
                <Shield className={`w-5 h-5 ${riskColor}`} />
                <span className={`font-semibold capitalize ${riskColor}`}>
                  {riskLevel} Risk
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Completion Time */}
          {state.completionTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Completed in {(state.completionTime / 1000).toFixed(1)}s</span>
            </div>
          )}

          {/* Sub-process Status */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Document Verification</span>
              </div>
              <Badge variant={state.documentVerificationComplete ? 'default' : 'outline'}>
                {state.documentVerificationComplete ? 'Complete' : 'In Progress'}
              </Badge>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Land Verification</span>
              </div>
              <Badge variant={state.landVerificationComplete ? 'default' : 'outline'}>
                {state.landVerificationComplete ? 'Complete' : 'In Progress'}
              </Badge>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Fraud Detection</span>
              </div>
              <Badge variant={state.fraudDetectionComplete ? 'default' : 'outline'}>
                {state.fraudDetectionComplete ? 'Complete' : 'In Progress'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="land">Land Verification</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verification Progress</CardTitle>
              <CardDescription>Real-time event stream from verification workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={progressScrollRef}
                className="space-y-2 max-h-96 overflow-y-auto"
              >
                <AnimatePresence>
                  {state.progressEvents.map((event, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {event.type === 'verification_completed' && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {event.type === 'verification_error' && (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        {event.type === 'verification_started' && (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        )}
                        {event.type === 'channel_closing' && (
                          <Clock className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {event.timestamp.toLocaleTimeString()}
                        </p>
                        {event.error && (
                          <p className="text-xs text-red-600 mt-1">{event.error}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {state.progressEvents.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Waiting for verification events...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Verification Tab */}
        <TabsContent value="documents">
          <React.Suspense fallback={<LoadingPlaceholder />}>
            {propertyId && (
              <DocumentVerificationResults 
                documentId={propertyId}
                showActions
              />
            )}
          </React.Suspense>
        </TabsContent>

        {/* Land Verification Tab */}
        <TabsContent value="land">
          <React.Suspense fallback={<LoadingPlaceholder />}>
            <LandVerificationDashboard 
              sessions={[]}
              onSessionSelect={() => {}}
              onNewVerification={() => {}}
            />
          </React.Suspense>
        </TabsContent>

        {/* Fraud Detection Tab */}
        <TabsContent value="fraud">
          <React.Suspense fallback={<LoadingPlaceholder />}>
            <FraudDetectionDashboard 
              userId={userId}
              showControls
            />
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Loading placeholder for lazy-loaded components
 */
function LoadingPlaceholder() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading verification data...</p>
        </div>
      </CardContent>
    </Card>
  );
}
