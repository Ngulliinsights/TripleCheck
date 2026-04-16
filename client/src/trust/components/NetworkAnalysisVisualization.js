"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkAnalysisVisualization = NetworkAnalysisVisualization;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var select_1 = require("../../local/components/ui/select");
var slider_1 = require("../../local/components/ui/slider");
var use_toast_1 = require("../../local/hooks/use-toast");
var useFraudDetection_1 = require("../hooks/useFraudDetection");
var NODE_COLORS = {
    user: '#3B82F6',
    property: '#10B981',
    transaction: '#F59E0B',
    professional: '#8B5CF6'
};
var RISK_COLORS = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444'
};
function NetworkAnalysisVisualization(_a) {
    var _b, _c;
    var userId = _a.userId, _d = _a.timeRange, timeRange = _d === void 0 ? '7d' : _d, _e = _a.height, height = _e === void 0 ? 400 : _e;
    var toast = (0, use_toast_1.useToast)().toast;
    var canvasRef = (0, react_1.useRef)(null);
    var _f = (0, react_1.useState)(null), selectedNode = _f[0], setSelectedNode = _f[1];
    var _g = (0, react_1.useState)([50]), riskThreshold = _g[0], setRiskThreshold = _g[1];
    var _h = (0, react_1.useState)('all'), connectionFilter = _h[0], setConnectionFilter = _h[1];
    var _j = (0, react_1.useState)(true), isAnimating = _j[0], setIsAnimating = _j[1];
    var _k = (0, react_1.useState)([]), nodes = _k[0], setNodes = _k[1];
    var _l = (0, react_1.useState)([]), edges = _l[0], setEdges = _l[1];
    var useNetworkAnalysis = (0, useFraudDetection_1.useFraudDetection)().useNetworkAnalysis;
    var _m = useNetworkAnalysis({
        userId: userId,
        timeRange: timeRange
    }), networkData = _m.data, isLoading = _m.isLoading, refetch = _m.refetch;
    // Generate mock network data for visualization
    (0, react_1.useEffect)(function () {
        if (networkData && networkData.length > 0) {
            // Convert real network data to visualization format
            var analysis = networkData[0];
            var mockNodes = analysis.participants.map(function (participant, index) { return ({
                id: participant.id,
                name: participant.name,
                type: participant.type,
                riskScore: participant.riskScore,
                connections: participant.networkConnections,
                x: Math.random() * 600 + 50,
                y: Math.random() * 300 + 50,
                radius: Math.max(8, Math.min(20, participant.riskScore / 5))
            }); });
            var mockEdges = [];
            for (var i = 0; i < mockNodes.length; i++) {
                for (var j = i + 1; j < mockNodes.length; j++) {
                    if (Math.random() > 0.7) { // 30% chance of connection
                        var strength = Math.random();
                        mockEdges.push({
                            from: mockNodes[i].id,
                            to: mockNodes[j].id,
                            strength: strength,
                            type: 'transaction',
                            riskLevel: strength > 0.7 ? 'high' : strength > 0.4 ? 'medium' : 'low'
                        });
                    }
                }
            }
            setNodes(mockNodes);
            setEdges(mockEdges);
        }
        else {
            // Generate sample data for demonstration
            var sampleNodes = [
                { id: '1', name: 'John Doe', type: 'user', riskScore: 85, connections: 5, x: 150, y: 100, radius: 15 },
                { id: '2', name: 'Property A', type: 'property', riskScore: 60, connections: 3, x: 300, y: 150, radius: 12 },
                { id: '3', name: 'Transaction X', type: 'transaction', riskScore: 90, connections: 4, x: 450, y: 100, radius: 18 },
                { id: '4', name: 'Agent Smith', type: 'professional', riskScore: 40, connections: 8, x: 200, y: 250, radius: 10 },
                { id: '5', name: 'Jane Smith', type: 'user', riskScore: 75, connections: 6, x: 400, y: 250, radius: 14 }
            ];
            var sampleEdges = [
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
    (0, react_1.useEffect)(function () {
        var canvas = canvasRef.current;
        if (!canvas)
            return;
        var ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        var draw = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Filter edges based on risk threshold
            var filteredEdges = edges.filter(function (edge) {
                var fromNode = nodes.find(function (n) { return n.id === edge.from; });
                var toNode = nodes.find(function (n) { return n.id === edge.to; });
                if (!fromNode || !toNode)
                    return false;
                var avgRisk = (fromNode.riskScore + toNode.riskScore) / 2;
                return avgRisk >= riskThreshold[0];
            });
            // Draw edges
            filteredEdges.forEach(function (edge) {
                var fromNode = nodes.find(function (n) { return n.id === edge.from; });
                var toNode = nodes.find(function (n) { return n.id === edge.to; });
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
            var filteredNodes = nodes.filter(function (node) { return node.riskScore >= riskThreshold[0]; });
            filteredNodes.forEach(function (node) {
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
                if ((selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.id) === node.id) {
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
    var handleCanvasClick = function (event) {
        var canvas = canvasRef.current;
        if (!canvas)
            return;
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        // Find clicked node
        var clickedNode = nodes.find(function (node) {
            var distance = Math.sqrt(Math.pow((x - node.x), 2) + Math.pow((y - node.y), 2));
            return distance <= node.radius;
        });
        setSelectedNode(clickedNode || null);
    };
    var handleExportNetwork = function () {
        var canvas = canvasRef.current;
        if (!canvas)
            return;
        var link = document.createElement('a');
        link.download = "network-analysis-".concat(new Date().toISOString().split('T')[0], ".png");
        link.href = canvas.toDataURL();
        link.click();
        toast({
            title: "Network Exported",
            description: "Network visualization has been exported as PNG.",
        });
    };
    var getNetworkStats = function () {
        var highRiskNodes = nodes.filter(function (n) { return n.riskScore > 70; }).length;
        var totalConnections = edges.length;
        var avgRiskScore = nodes.length > 0 ?
            nodes.reduce(function (sum, n) { return sum + n.riskScore; }, 0) / nodes.length : 0;
        return { highRiskNodes: highRiskNodes, totalConnections: totalConnections, avgRiskScore: avgRiskScore };
    };
    var stats = getNetworkStats();
    if (isLoading) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="flex items-center justify-center" style={{ height: height }}>
            <div className="text-center">
              <lucide_react_1.RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400"/>
              <p className="text-gray-500">Loading network analysis...</p>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<div className="space-y-6">
      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <card_1.Card>
          <card_1.CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Nodes</p>
                <p className="text-2xl font-bold">{nodes.length}</p>
              </div>
              <lucide_react_1.Network className="h-8 w-8 text-blue-500"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>
        
        <card_1.Card>
          <card_1.CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Risk Nodes</p>
                <p className="text-2xl font-bold text-red-600">{stats.highRiskNodes}</p>
              </div>
              <lucide_react_1.AlertTriangle className="h-8 w-8 text-red-500"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>
        
        <card_1.Card>
          <card_1.CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connections</p>
                <p className="text-2xl font-bold">{stats.totalConnections}</p>
              </div>
              <lucide_react_1.Zap className="h-8 w-8 text-yellow-500"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>
        
        <card_1.Card>
          <card_1.CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Risk Score</p>
                <p className="text-2xl font-bold">{Math.round(stats.avgRiskScore)}</p>
              </div>
              <lucide_react_1.Shield className="h-8 w-8 text-green-500"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Controls */}
      <card_1.Card>
        <card_1.CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <lucide_react_1.Filter className="h-4 w-4 text-gray-500"/>
                <span className="text-sm text-gray-700">Risk Threshold:</span>
                <div className="w-32">
                  <slider_1.Slider value={riskThreshold} onValueChange={setRiskThreshold} max={100} min={0} step={5} className="w-full"/>
                </div>
                <span className="text-sm font-medium">{riskThreshold[0]}%</span>
              </div>
              
              <select_1.Select value={connectionFilter} onValueChange={setConnectionFilter}>
                <select_1.SelectTrigger className="w-40">
                  <select_1.SelectValue />
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="all">All Connections</select_1.SelectItem>
                  <select_1.SelectItem value="high_risk">High Risk Only</select_1.SelectItem>
                  <select_1.SelectItem value="transactions">Transactions</select_1.SelectItem>
                  <select_1.SelectItem value="professional">Professional</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button_1.Button variant="outline" size="sm" onClick={function () { return setIsAnimating(!isAnimating); }}>
                {isAnimating ? 'Pause' : 'Animate'}
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={function () { return refetch(); }}>
                <lucide_react_1.RefreshCw className="h-4 w-4 mr-1"/>
                Refresh
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={handleExportNetwork}>
                <lucide_react_1.Download className="h-4 w-4 mr-1"/>
                Export
              </button_1.Button>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Network Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center space-x-2">
                <lucide_react_1.Network className="h-5 w-5"/>
                <span>Network Visualization</span>
              </card_1.CardTitle>
              <card_1.CardDescription>
                Interactive network graph showing relationships and risk patterns
              </card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="relative">
                <canvas ref={canvasRef} width={700} height={height} onClick={handleCanvasClick} className="border rounded cursor-pointer" style={{ width: '100%', maxWidth: '700px' }}/>
                
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
            </card_1.CardContent>
          </card_1.Card>
        </div>

        <div className="space-y-6">
          {/* Selected Node Details */}
          {selectedNode && (<card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-lg">Node Details</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedNode.name}</h4>
                    <badge_1.Badge variant="outline" className="mt-1">
                      {selectedNode.type}
                    </badge_1.Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Score:</span>
                      <badge_1.Badge variant={selectedNode.riskScore > 70 ? "destructive" : "outline"}>
                        {selectedNode.riskScore}
                      </badge_1.Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connections:</span>
                      <span className="font-medium">{selectedNode.connections}</span>
                    </div>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>)}

          {/* Risk Patterns */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-lg">Risk Patterns</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-3">
                {(_b = networkData === null || networkData === void 0 ? void 0 : networkData[0]) === null || _b === void 0 ? void 0 : _b.suspiciousPatterns.map(function (pattern, index) { return (<alert_1.Alert key={index}>
                    <lucide_react_1.AlertTriangle className="h-4 w-4"/>
                    <alert_1.AlertDescription className="text-sm">
                      {pattern}
                    </alert_1.AlertDescription>
                  </alert_1.Alert>); })}
                
                {(!networkData || ((_c = networkData[0]) === null || _c === void 0 ? void 0 : _c.suspiciousPatterns.length) === 0) && (<div className="text-center py-4">
                    <lucide_react_1.Shield className="h-8 w-8 text-green-500 mx-auto mb-2"/>
                    <p className="text-sm text-gray-600">No suspicious patterns detected</p>
                  </div>)}
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Network Health */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-lg">Network Health</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Risk</span>
                  <badge_1.Badge variant={stats.avgRiskScore > 70 ? "destructive" : "outline"}>
                    {stats.avgRiskScore > 70 ? 'High' : stats.avgRiskScore > 40 ? 'Medium' : 'Low'}
                  </badge_1.Badge>
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
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </div>);
}
exports.default = NetworkAnalysisVisualization;
