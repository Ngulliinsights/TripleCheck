"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpertCoordinationInterface = ExpertCoordinationInterface;
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var avatar_1 = require("../../local/components/ui/avatar");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var dialog_1 = require("../../local/components/ui/dialog");
var select_1 = require("../../local/components/ui/select");
var textarea_1 = require("../../local/components/ui/textarea");
var use_toast_1 = require("../../local/hooks/use-toast");
var useLandVerification_1 = require("../hooks/useLandVerification");
var EXPERT_TYPES = {
    surveyor: {
        name: 'Professional Surveyor',
        icon: lucide_react_1.MapPin,
        description: 'Licensed land surveyor for boundary verification and mapping',
        averageCost: 2500,
        averageTime: 8,
        specializations: ['Boundary Survey', 'Topographic Survey', 'Construction Survey', 'GPS Survey']
    },
    lawyer: {
        name: 'Legal Expert',
        icon: lucide_react_1.Gavel,
        description: 'Legal professional specializing in property law and transactions',
        averageCost: 3500,
        averageTime: 12,
        specializations: ['Property Law', 'Contract Review', 'Title Examination', 'Dispute Resolution']
    },
    appraiser: {
        name: 'Property Appraiser',
        icon: lucide_react_1.TrendingUp,
        description: 'Certified property appraiser for market value assessment',
        averageCost: 1800,
        averageTime: 6,
        specializations: ['Residential Appraisal', 'Commercial Appraisal', 'Land Valuation', 'Market Analysis']
    }
};
// Mock expert data - in real implementation, this would come from API
var MOCK_EXPERTS = {
    surveyor: [
        {
            id: 'surv-001',
            name: 'John Kamau',
            credentials: 'Licensed Surveyor (LSK)',
            rating: 4.8,
            completedJobs: 156,
            specialization: 'Boundary Survey',
            location: 'Nairobi',
            availability: 'Available',
            hourlyRate: 300,
            avatar: null,
            bio: 'Experienced land surveyor with 12+ years in Kenya. Specialized in complex boundary disputes and GPS surveying.',
            certifications: ['Licensed Surveyor of Kenya', 'GPS Certified', 'Drone Survey Certified']
        },
        {
            id: 'surv-002',
            name: 'Mary Wanjiku',
            credentials: 'Senior Surveyor (LSK)',
            rating: 4.9,
            completedJobs: 203,
            specialization: 'Topographic Survey',
            location: 'Kiambu',
            availability: 'Busy until next week',
            hourlyRate: 350,
            avatar: null,
            bio: 'Senior surveyor with expertise in topographic and construction surveys. Known for precision and reliability.',
            certifications: ['Licensed Surveyor of Kenya', 'Topographic Specialist', 'Construction Survey Expert']
        }
    ],
    lawyer: [
        {
            id: 'law-001',
            name: 'David Mwangi',
            credentials: 'Advocate of High Court',
            rating: 4.7,
            completedJobs: 89,
            specialization: 'Property Law',
            location: 'Nairobi',
            availability: 'Available',
            hourlyRate: 450,
            avatar: null,
            bio: 'Property law specialist with extensive experience in land transactions and title disputes.',
            certifications: ['Advocate of High Court of Kenya', 'Property Law Specialist', 'Conveyancing Expert']
        }
    ],
    appraiser: [
        {
            id: 'app-001',
            name: 'Grace Njeri',
            credentials: 'Certified Property Appraiser',
            rating: 4.6,
            completedJobs: 134,
            specialization: 'Land Valuation',
            location: 'Nakuru',
            availability: 'Available',
            hourlyRate: 280,
            avatar: null,
            bio: 'Certified appraiser specializing in agricultural and residential land valuation across Kenya.',
            certifications: ['Certified Property Appraiser', 'Land Valuation Expert', 'Market Analysis Certified']
        }
    ]
};
function ExpertCoordinationInterface(_a) {
    var _this = this;
    var _b;
    var sessionId = _a.sessionId, onExpertAssigned = _a.onExpertAssigned, _c = _a.showAssignmentControls, showAssignmentControls = _c === void 0 ? true : _c;
    var toast = (0, use_toast_1.useToast)().toast;
    var _d = (0, react_1.useState)('surveyor'), selectedExpertType = _d[0], setSelectedExpertType = _d[1];
    var _e = (0, react_1.useState)(null), selectedExpert = _e[0], setSelectedExpert = _e[1];
    var _f = (0, react_1.useState)(''), assignmentNotes = _f[0], setAssignmentNotes = _f[1];
    var _g = (0, react_1.useState)(false), isAssignDialogOpen = _g[0], setIsAssignDialogOpen = _g[1];
    var _h = (0, useLandVerification_1.useLandVerification)(), useExpertAssignments = _h.useExpertAssignments, assignExpert = _h.assignExpert, isAssigningExpert = _h.isAssigningExpert;
    var _j = useExpertAssignments(sessionId), assignments = _j.data, isLoading = _j.isLoading;
    var handleAssignExpert = function () { return __awaiter(_this, void 0, void 0, function () {
        var assignment, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedExpert)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, assignExpert(sessionId, selectedExpertType)];
                case 2:
                    assignment = _a.sent();
                    if (onExpertAssigned) {
                        onExpertAssigned(assignment);
                    }
                    toast({
                        title: "Expert Assigned",
                        description: "".concat(selectedExpert.name, " has been assigned to your verification."),
                    });
                    setIsAssignDialogOpen(false);
                    setSelectedExpert(null);
                    setAssignmentNotes('');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: "Assignment Failed",
                        description: error_1 instanceof Error ? error_1.message : "Failed to assign expert",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var getStatusColor = function (status) {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'assigned':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    var renderExpertCard = function (expert, expertType) {
        var ExpertIcon = EXPERT_TYPES[expertType].icon;
        return (<card_1.Card key={expert.id} className={"cursor-pointer transition-all duration-200 hover:shadow-md ".concat((selectedExpert === null || selectedExpert === void 0 ? void 0 : selectedExpert.id) === expert.id ? 'ring-2 ring-blue-500 bg-blue-50' : '')} onClick={function () { return setSelectedExpert(expert); }}>
        <card_1.CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <avatar_1.Avatar className="h-12 w-12">
              <avatar_1.AvatarImage src={expert.avatar}/>
              <avatar_1.AvatarFallback>
                {expert.name.split(' ').map(function (n) { return n[0]; }).join('')}
              </avatar_1.AvatarFallback>
            </avatar_1.Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{expert.name}</h4>
                <div className="flex items-center space-x-1">
                  <lucide_react_1.Star className="h-4 w-4 text-yellow-400 fill-current"/>
                  <span className="text-sm font-medium">{expert.rating}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{expert.credentials}</p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center space-x-1">
                  <ExpertIcon className="h-3 w-3"/>
                  <span>{expert.specialization}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <lucide_react_1.MapPin className="h-3 w-3"/>
                  <span>{expert.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <lucide_react_1.Award className="h-3 w-3"/>
                  <span>{expert.completedJobs} jobs</span>
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <badge_1.Badge variant={expert.availability === 'Available' ? 'default' : 'secondary'} className="text-xs">
                  {expert.availability}
                </badge_1.Badge>
                <span className="text-sm font-medium text-gray-900">
                  KSh {expert.hourlyRate}/hour
                </span>
              </div>
            </div>
          </div>
          
          {(selectedExpert === null || selectedExpert === void 0 ? void 0 : selectedExpert.id) === expert.id && (<framer_motion_1.motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.2 }} className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">{expert.bio}</p>
              
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900 text-sm">Certifications</h5>
                <div className="flex flex-wrap gap-1">
                  {expert.certifications.map(function (cert, index) { return (<badge_1.Badge key={index} variant="outline" className="text-xs">
                      {cert}
                    </badge_1.Badge>); })}
                </div>
              </div>
            </framer_motion_1.motion.div>)}
        </card_1.CardContent>
      </card_1.Card>);
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expert Coordination</h2>
          <p className="text-gray-600">
            Coordinate with professional experts for comprehensive land verification
          </p>
        </div>
        
        {showAssignmentControls && (<dialog_1.Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <dialog_1.DialogTrigger asChild>
              <button_1.Button>
                <lucide_react_1.User className="h-4 w-4 mr-2"/>
                Assign Expert
              </button_1.Button>
            </dialog_1.DialogTrigger>
            <dialog_1.DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <dialog_1.DialogHeader>
                <dialog_1.DialogTitle>Assign Professional Expert</dialog_1.DialogTitle>
                <dialog_1.DialogDescription>
                  Select and assign a professional expert to assist with your land verification
                </dialog_1.DialogDescription>
              </dialog_1.DialogHeader>
              
              <div className="space-y-6">
                {/* Expert Type Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Expert Type
                  </label>
                  <select_1.Select value={selectedExpertType} onValueChange={function (value) {
                setSelectedExpertType(value);
                setSelectedExpert(null);
            }}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {Object.entries(EXPERT_TYPES).map(function (_a) {
                var key = _a[0], type = _a[1];
                return (<select_1.SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <type.icon className="h-4 w-4"/>
                            <span>{type.name}</span>
                          </div>
                        </select_1.SelectItem>);
            })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>

                {/* Expert Type Info */}
                <card_1.Card className="bg-blue-50 border-blue-200">
                  <card_1.CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {react_1.default.createElement(EXPERT_TYPES[selectedExpertType].icon, {
                className: "h-5 w-5 text-blue-600"
            })}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-1">
                          {EXPERT_TYPES[selectedExpertType].name}
                        </h4>
                        <p className="text-sm text-blue-700 mb-2">
                          {EXPERT_TYPES[selectedExpertType].description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-blue-600">
                          <span className="flex items-center space-x-1">
                            <lucide_react_1.DollarSign className="h-3 w-3"/>
                            <span>Avg: KSh {EXPERT_TYPES[selectedExpertType].averageCost}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <lucide_react_1.Clock className="h-3 w-3"/>
                            <span>Avg: {EXPERT_TYPES[selectedExpertType].averageTime} hours</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>

                {/* Available Experts */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Available {EXPERT_TYPES[selectedExpertType].name}s
                  </label>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {(_b = MOCK_EXPERTS[selectedExpertType]) === null || _b === void 0 ? void 0 : _b.map(function (expert) {
                return renderExpertCard(expert, selectedExpertType);
            })}
                  </div>
                </div>

                {/* Assignment Notes */}
                {selectedExpert && (<div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Assignment Notes (Optional)
                    </label>
                    <textarea_1.Textarea placeholder="Add any specific requirements or notes for the expert..." value={assignmentNotes} onChange={function (e) { return setAssignmentNotes(e.target.value); }} rows={3}/>
                  </div>)}

                {/* Assignment Summary */}
                {selectedExpert && (<card_1.Card className="bg-green-50 border-green-200">
                    <card_1.CardContent className="p-4">
                      <h4 className="font-semibold text-green-900 mb-2">Assignment Summary</h4>
                      <div className="space-y-1 text-sm text-green-700">
                        <p><strong>Expert:</strong> {selectedExpert.name}</p>
                        <p><strong>Type:</strong> {EXPERT_TYPES[selectedExpertType].name}</p>
                        <p><strong>Estimated Cost:</strong> KSh {selectedExpert.hourlyRate * EXPERT_TYPES[selectedExpertType].averageTime}</p>
                        <p><strong>Estimated Time:</strong> {EXPERT_TYPES[selectedExpertType].averageTime} hours</p>
                      </div>
                    </card_1.CardContent>
                  </card_1.Card>)}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <button_1.Button variant="outline" onClick={function () { return setIsAssignDialogOpen(false); }}>
                    Cancel
                  </button_1.Button>
                  <button_1.Button onClick={handleAssignExpert} disabled={!selectedExpert || isAssigningExpert}>
                    {isAssigningExpert ? (<>
                        <lucide_react_1.Clock className="h-4 w-4 mr-2 animate-spin"/>
                        Assigning...
                      </>) : ('Assign Expert')}
                  </button_1.Button>
                </div>
              </div>
            </dialog_1.DialogContent>
          </dialog_1.Dialog>)}
      </div>

      {/* Current Assignments */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Current Expert Assignments</card_1.CardTitle>
          <card_1.CardDescription>
            Track the progress of assigned experts for this verification session
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          {isLoading ? (<div className="flex items-center justify-center py-8">
              <lucide_react_1.Clock className="h-5 w-5 animate-spin mr-2"/>
              <span>Loading assignments...</span>
            </div>) : assignments && assignments.length > 0 ? (<div className="space-y-4">
              {assignments.map(function (assignment) {
                var expertType = assignment.expertType;
                var ExpertIcon = EXPERT_TYPES[expertType].icon;
                return (<card_1.Card key={assignment.id} className="border-l-4 border-l-blue-500">
                    <card_1.CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <ExpertIcon className="h-5 w-5 text-blue-600"/>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {assignment.expertName}
                              </h4>
                              <badge_1.Badge className={getStatusColor(assignment.status)}>
                                {assignment.status.replace('_', ' ')}
                              </badge_1.Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {EXPERT_TYPES[expertType].name}
                              {assignment.specialization && " \u2022 ".concat(assignment.specialization)}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <lucide_react_1.Calendar className="h-3 w-3"/>
                                <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                              </span>
                              {assignment.expectedCompletionDate && (<span className="flex items-center space-x-1">
                                  <lucide_react_1.Clock className="h-3 w-3"/>
                                  <span>Due: {new Date(assignment.expectedCompletionDate).toLocaleDateString()}</span>
                                </span>)}
                              {assignment.cost && (<span className="flex items-center space-x-1">
                                  <lucide_react_1.DollarSign className="h-3 w-3"/>
                                  <span>KSh {assignment.cost.toLocaleString()}</span>
                                </span>)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {assignment.contactInfo && (<button_1.Button variant="outline" size="sm">
                              <lucide_react_1.MessageSquare className="h-4 w-4 mr-1"/>
                              Contact
                            </button_1.Button>)}
                          {assignment.reportUrl && (<button_1.Button variant="outline" size="sm">
                              <lucide_react_1.FileText className="h-4 w-4 mr-1"/>
                              Report
                            </button_1.Button>)}
                        </div>
                      </div>
                      
                      {assignment.notes && (<div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{assignment.notes}</p>
                        </div>)}
                    </card_1.CardContent>
                  </card_1.Card>);
            })}
            </div>) : (<div className="text-center py-8 text-gray-500">
              <lucide_react_1.User className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
              <p>No experts assigned yet</p>
              <p className="text-sm">Assign professional experts to enhance your verification process</p>
            </div>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
exports.default = ExpertCoordinationInterface;
