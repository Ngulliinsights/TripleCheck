import { motion } from 'framer-motion'
import { 
  Network, 
  Users, 
  AlertTriangle, 
  Shield,
  Eye,
  Zap,
  Filter,
  Download,
  RefreshCw,
  Info
} from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'

import { Alert, AlertDescription, AlertTitle } from '../../local/components/ui/alert'
import { Badge } from '../../local/components/ui/badge'
import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../local/components/ui/select'
import { Slider } from '../../local/components/ui/slider'
import { useToast } from '../../local/hooks/use-toast'
import { useFraudDetection, useNetworkAnalysis } from '../hooks/useFraudDetection'

interface NetworkAnalysisVisualizationProps {
  userId?: string;
  timeRange?: string;
  height?: number;
}

interface NetworkNode {
  id: string;
  name: string;
  type: 'user' | 'property' | 'transaction' | 'professional';
  riskScore: number;
  connections: number;
  x: number;
  y: number;
  radius: number;
}

interface NetworkEdge {
  from: string;
  to: string;
  strength: number;
  type: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const NODE_COLORS = {
  user: '#3B82F6',
  property: '#10B981',
  transaction: '#F59E0B',
  professional: '#8B5CF6'
};

const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444'
};

export function NetworkAnalysisVisualization({ 
  userId, 
  timeRange = '7d',
  height = 400 
}: NetworkAnalysisVisualizationProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [riskThreshold, setRiskThreshold] = useState([50]);
  const [connectionFilter, setConnectionFilter] = useState('all');
  const [isAnimating, setIsAnimating] = useState(true);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);

  const { data: networkData, isLoading, refetch } = useNetworkAnalysis({
    userId,
    timeRange
  });

  // Generate mock network data for visualization
  useEffect(() => {
    if (networkData && networkData.length > 0) {
      // Convert real network data to visualization format
      const analysis = networkData[0];
      
      const mockNodes: NetworkNode[] = analysis.participants.map((participant: any, index: number) => ({
        id: participant.id,
        name: participant.name,
        type: participant.type as any,
        riskScore: participant.riskScore,
        connections: participant.networkConnections,
        x: Math.random() * 600 + 50,
        y: Math.random() * 300 + 50,
        radius: Math.max(8, Math.min(20, participant.riskScore / 5))
      }));

      const mockEdges: NetworkEdge[] = [];
      for (let i = 0; i < mockNodes.length; i++) {
        for (let j = i + 1; j < mockNodes.length; j++) {
          if (Math.random() > 0.7) { // 30% chance of connection
            const strength = Math.random();
            mockEdges.push({
              from: mockNodes[i].id,
              to: mockNodes[j].id,
              strength,
              type: 'transaction',
              riskLevel: strength > 0.7 ? 'high' : strength > 0.4 ? 'medium' : 'low'
            });
          }
        }
      }

      setNodes(mockNodes);
      setEdges(mockEdges);
    } else {
      // Generate sample data for demonstration
      const sampleNodes: NetworkNode[] = [
        { id: '1', name: 'John Doe', type: 'user', riskScore: 85, connections: 5, x: 150, y: 100, radius: 15 },
        { id: '2', name: 'Property A', type: 'property', riskScore: 60, connections: 3, x: 300, y: 150, radius: 12 },
        { id: '3', name: 'Transaction X', type: 'transaction', riskScore: 90, connections: 4, x: 450, y: 100, radius: 18 },
        { id: '4', name: 'Agent Smith', type: 'professional', riskScore: 40, connections: 8, x: 200, y: 250, radius: 10 },
        { id: '5', name: 'Jane Smith', type: 'user', riskScore: 75, connections: 6, x: 400, y: 250, radius: 14 }
      ];

      const sampleEdges: NetworkEdge[] = [
        { from: '1', to: '2', strength: 0.8, type: 'ownership', riskLevel: 'high' },
        { from: '2', to: '3', strength: 0.6, type: 'transaction', riskLevel: 'medium' },
        { from: '1', to: '4', strength: 0.4, type: 'professional', riskLevel: 'low' },
        { from: '3', to: '5', strength: 0.9, type: 'transaction', riskLevel: 'high' },
        { from: '4', to: '5', strength: 0.3, type: 'professional', riskLevel: 'low' }
      ];

      setNodes(sampleNodes);
      setEdges(sampleEdges);
    }
  }, [networkData]);

  // Canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Filter edges based on risk threshold
      const filteredEdges = edges.filter((edge: NetworkEdge) => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return false;
        
        const avgRisk = (fromNode.riskScore + toNode.riskScore) / 2;
        return avgRisk >= riskThreshold[0];
      });

      // Draw edges
      filteredEdges.forEach((edge: NetworkEdge) => {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        
        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = RISK_COLORS[edge.riskLevel];
          ctx.lineWidth = edge.strength * 3;
          ctx.globalAlpha = 0.6;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      // Filter and draw nodes
      const filteredNodes = nodes.filter((node: NetworkNode) => node.riskScore >= riskThreshold[0]);
      
      filteredNodes.forEach((node: NetworkNode) => {
        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        ctx.fillStyle = NODE_COLORS[node.type];
        ctx.fill();
        
        // Risk indicator ring
        if (node.riskScore > 70) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 3, 0, 2 * Math.PI);
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Selected node highlight
        if (selectedNode?.id === node.id) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 5, 0, 2 * Math.PI);
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        
        // Node label
        ctx.fillStyle = '#374151';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + node.radius + 15);
      });
    };

    draw();
  }, [nodes, edges, riskThreshold, selectedNode]);

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find((node: NetworkNode) => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.radius;
    });

    setSelectedNode(clickedNode || null);
  };

  const handleExportNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `network-analysis-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();

    toast({
      title: "Network Exported",
      description: "Network visualization has been exported as PNG.",
    });
  };

  const getNetworkStats = () => {
    const highRiskNodes = nodes.filter((n: NetworkNode) => n.riskScore > 70).length;
    const totalConnections = edges.length;
    const avgRiskScore = nodes.length > 0 ? 
      nodes.reduce((sum: number, n: NetworkNode) => sum + n.riskScore, 0) / nodes.length : 0;

    return { highRiskNodes, totalConnections, avgRiskScore };
  };

  const stats = getNetworkStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading network analysis...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Nodes</p>
                <p className="text-2xl font-bold">{nodes.length}</p>
              </div>
              <Network className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk Nodes</p>
                <p className="text-2xl font-bold text-red-600">{stats.highRiskNodes}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connections</p>
                <p className="text-2xl font-bold">{stats.totalConnections}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Risk Score</p>
                <p className="text-2xl font-bold">{Math.round(stats.avgRiskScore)}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Risk Threshold:</span>
                <div className="w-32">
                  <Slider
                    value={riskThreshold}
                    onValueChange={setRiskThreshold}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>
                <span className="text-sm font-medium">{riskThreshold[0]}%</span>
              </div>
              
              <Select value={connectionFilter} onValueChange={setConnectionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Connections</SelectItem>
                  <SelectItem value="high_risk">High Risk Only</SelectItem>
                  <SelectItem value="transactions">Transactions</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAnimating(!isAnimating)}
              >
                {isAnimating ? 'Pause' : 'Animate'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportNetwork}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>Network Visualization</span>
              </CardTitle>
              <CardDescription>
                Interactive network graph showing relationships and risk patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={height}
                  onClick={handleCanvasClick}
                  className="border rounded cursor-pointer"
                  style={{ width: '100%', maxWidth: '700px' }}
                />
                
                {/* Legend */}
                <div className="absolute top-4 right-4 bg-white p-3 rounded shadow-lg border">
                  <h4 className="font-semibold text-sm mb-2">Legend</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>User</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Property</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Transaction</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span>Professional</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Selected Node Details */}
          {selectedNode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Node Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedNode.name}</h4>
                    <Badge variant="outline" className="mt-1">
                      {selectedNode.type}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Score:</span>
                      <Badge 
                        variant={selectedNode.riskScore > 70 ? "destructive" : "outline"}
                      >
                        {selectedNode.riskScore as React.ReactNode}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connections:</span>
                      <span className="font-medium">{selectedNode.connections}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {networkData?.[0]?.suspiciousPatterns.map((pattern: string, index: number) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {pattern}
                    </AlertDescription>
                  </Alert>
                ))}
                
                {(!networkData || networkData[0]?.suspiciousPatterns.length === 0) && (
                  <div className="text-center py-4">
                    <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No suspicious patterns detected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Network Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Network Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Risk</span>
                  <Badge 
                    variant={stats.avgRiskScore > 70 ? "destructive" : "outline"}
                  >
                    {stats.avgRiskScore > 70 ? 'High' : stats.avgRiskScore > 40 ? 'Medium' : 'Low'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Network Density</span>
                  <span className="text-sm font-medium">
                    {nodes.length > 0 ? Math.round((stats.totalConnections / nodes.length) * 100) / 100 : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Risk Distribution</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-4 bg-green-500 rounded"></div>
                    <div className="w-2 h-4 bg-yellow-500 rounded"></div>
                    <div className="w-2 h-4 bg-red-500 rounded"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default NetworkAnalysisVisualization;