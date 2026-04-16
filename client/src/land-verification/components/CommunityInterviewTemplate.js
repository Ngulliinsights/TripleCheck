"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityInterviewTemplate = CommunityInterviewTemplate;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var checkbox_1 = require("../../local/components/ui/checkbox");
var input_1 = require("../../local/components/ui/input");
var progress_1 = require("../../local/components/ui/progress");
var select_1 = require("../../local/components/ui/select");
var textarea_1 = require("../../local/components/ui/textarea");
var use_toast_1 = require("../../local/hooks/use-toast");
var COMMUNITY_SOURCES = [
    { id: 'local_admin', name: 'Local Administrator', icon: lucide_react_1.User, reliability: 0.9 },
    { id: 'neighbor', name: 'Neighbor', icon: lucide_react_1.Users, reliability: 0.7 },
    { id: 'community_leader', name: 'Community Leader', icon: lucide_react_1.User, reliability: 0.85 },
    { id: 'resident', name: 'Long-term Resident', icon: lucide_react_1.Users, reliability: 0.75 }
];
// Template questions based on property type and location
var generateInterviewTemplate = function (propertyType, location) {
    return [
        {
            id: 'basic_info',
            title: 'Basic Property Information',
            description: 'Gather fundamental information about the property',
            estimatedTime: 10,
            completed: false,
            questions: [
                {
                    id: 'ownership_knowledge',
                    category: 'Ownership',
                    question: 'How long have you known about this property and its ownership?',
                    type: 'multiple_choice',
                    required: true,
                    options: ['Less than 1 year', '1-5 years', '5-10 years', 'More than 10 years']
                },
                {
                    id: 'current_owner',
                    category: 'Ownership',
                    question: 'Who do you believe is the current owner of this property?',
                    type: 'text',
                    required: true
                },
                {
                    id: 'ownership_disputes',
                    category: 'Legal',
                    question: 'Are you aware of any ownership disputes or claims on this property?',
                    type: 'boolean',
                    required: true
                },
                {
                    id: 'property_use',
                    category: 'Usage',
                    question: 'How is this property currently being used?',
                    type: 'multiple_choice',
                    required: true,
                    options: ['Residential', 'Agricultural', 'Commercial', 'Vacant/Unused', 'Mixed Use']
                }
            ]
        },
        {
            id: 'boundaries_access',
            title: 'Boundaries and Access',
            description: 'Verify physical boundaries and access rights',
            estimatedTime: 15,
            completed: false,
            questions: [
                {
                    id: 'boundary_markers',
                    category: 'Physical',
                    question: 'Are the property boundaries clearly marked and visible?',
                    type: 'rating',
                    required: true,
                    options: ['1', '2', '3', '4', '5']
                },
                {
                    id: 'boundary_disputes',
                    category: 'Legal',
                    question: 'Have there been any boundary disputes with neighboring properties?',
                    type: 'boolean',
                    required: true
                },
                {
                    id: 'access_rights',
                    category: 'Legal',
                    question: 'Does the property have clear access rights to public roads?',
                    type: 'boolean',
                    required: true
                },
                {
                    id: 'encroachments',
                    category: 'Physical',
                    question: 'Are you aware of any encroachments on or by this property?',
                    type: 'boolean',
                    required: true
                }
            ]
        },
        {
            id: 'community_standing',
            title: 'Community Standing',
            description: 'Assess the property and owner\'s standing in the community',
            estimatedTime: 12,
            completed: false,
            questions: [
                {
                    id: 'owner_reputation',
                    category: 'Social',
                    question: 'How would you rate the current owner\'s reputation in the community?',
                    type: 'rating',
                    required: true,
                    options: ['1', '2', '3', '4', '5']
                },
                {
                    id: 'community_issues',
                    category: 'Social',
                    question: 'Are there any community issues or concerns related to this property?',
                    type: 'boolean',
                    required: true
                },
                {
                    id: 'development_plans',
                    category: 'Development',
                    question: 'Are you aware of any development plans affecting this area?',
                    type: 'boolean',
                    required: true
                },
                {
                    id: 'environmental_concerns',
                    category: 'Environmental',
                    question: 'Are there any environmental concerns related to this property?',
                    type: 'boolean',
                    required: true
                }
            ]
        },
        {
            id: 'historical_context',
            title: 'Historical Context',
            description: 'Understand the property\'s history and any relevant events',
            estimatedTime: 18,
            completed: false,
            questions: [
                {
                    id: 'ownership_history',
                    category: 'History',
                    question: 'Can you describe the ownership history of this property?',
                    type: 'text',
                    required: false
                },
                {
                    id: 'significant_events',
                    category: 'History',
                    question: 'Have there been any significant events related to this property?',
                    type: 'text',
                    required: false
                },
                {
                    id: 'family_inheritance',
                    category: 'Legal',
                    question: 'Is this property part of a family inheritance or succession?',
                    type: 'boolean',
                    required: true
                },
                {
                    id: 'previous_transactions',
                    category: 'Transactions',
                    question: 'Are you aware of any previous sales or transfers of this property?',
                    type: 'boolean',
                    required: true
                }
            ]
        }
    ];
};
function CommunityInterviewTemplate(_a) {
    var sessionId = _a.sessionId, _b = _a.propertyType, propertyType = _b === void 0 ? 'land' : _b, _c = _a.location, location = _c === void 0 ? 'Kenya' : _c, onTemplateComplete = _a.onTemplateComplete, _d = _a.readOnly, readOnly = _d === void 0 ? false : _d;
    var toast = (0, use_toast_1.useToast)().toast;
    var _e = (0, react_1.useState)([]), sections = _e[0], setSections = _e[1];
    var _f = (0, react_1.useState)(0), currentSection = _f[0], setCurrentSection = _f[1];
    var _g = (0, react_1.useState)({
        name: '',
        role: '',
        date: new Date().toISOString().split('T')[0],
        location: location
    }), interviewerInfo = _g[0], setInterviewerInfo = _g[1];
    var _h = (0, react_1.useState)({
        name: '',
        sourceType: '',
        relationship: '',
        yearsInArea: '',
        contactInfo: ''
    }), respondentInfo = _h[0], setRespondentInfo = _h[1];
    var _j = (0, react_1.useState)(false), isRecording = _j[0], setIsRecording = _j[1];
    var _k = (0, react_1.useState)([]), attachments = _k[0], setAttachments = _k[1];
    (0, react_1.useEffect)(function () {
        var template = generateInterviewTemplate(propertyType, location);
        setSections(template);
    }, [propertyType, location]);
    var handleQuestionResponse = function (sectionId, questionId, response, notes) {
        setSections(function (prev) { return prev.map(function (section) {
            if (section.id === sectionId) {
                var updatedQuestions = section.questions.map(function (question) {
                    if (question.id === questionId) {
                        return __assign(__assign({}, question), { response: response, notes: notes });
                    }
                    return question;
                });
                // Check if section is completed
                var requiredQuestions = updatedQuestions.filter(function (q) { return q.required; });
                var answeredRequired = requiredQuestions.filter(function (q) { return q.response !== undefined && q.response !== ''; });
                var completed = answeredRequired.length === requiredQuestions.length;
                return __assign(__assign({}, section), { questions: updatedQuestions, completed: completed });
            }
            return section;
        }); });
    };
    var calculateProgress = function () {
        var totalQuestions = sections.reduce(function (total, section) { return total + section.questions.filter(function (q) { return q.required; }).length; }, 0);
        var answeredQuestions = sections.reduce(function (total, section) {
            return total + section.questions.filter(function (q) { return q.required && q.response !== undefined && q.response !== ''; }).length;
        }, 0);
        return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    };
    var getTotalEstimatedTime = function () {
        return sections.reduce(function (total, section) { return total + section.estimatedTime; }, 0);
    };
    var handleSaveTemplate = function () {
        var templateData = {
            sessionId: sessionId,
            interviewerInfo: interviewerInfo,
            respondentInfo: respondentInfo,
            sections: sections,
            attachments: attachments.map(function (f) { return f.name; }),
            completedAt: new Date().toISOString(),
            progress: calculateProgress()
        };
        // In real implementation, save to backend
        console.log('Saving template:', templateData);
        toast({
            title: "Template Saved",
            description: "Community interview template has been saved successfully.",
        });
        if (onTemplateComplete && calculateProgress() === 100) {
            onTemplateComplete(templateData);
        }
    };
    var handleExportTemplate = function () {
        // In real implementation, generate PDF or document export
        toast({
            title: "Export Started",
            description: "Community interview template is being exported.",
        });
    };
    var renderQuestion = function (section, question) {
        var _a;
        var handleResponse = function (response, notes) {
            handleQuestionResponse(section.id, question.id, response, notes);
        };
        return (<card_1.Card key={question.id} className="mb-4">
        <card_1.CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <badge_1.Badge variant="outline" className="text-xs">
                  {question.category}
                </badge_1.Badge>
                {question.required && (<badge_1.Badge variant="destructive" className="text-xs">
                    Required
                  </badge_1.Badge>)}
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                {question.question}
              </h4>
            </div>
            {question.response !== undefined && (<lucide_react_1.CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0"/>)}
          </div>

          <div className="space-y-3">
            {question.type === 'text' && (<textarea_1.Textarea placeholder="Enter response..." value={question.response || ''} onChange={function (e) { return handleResponse(e.target.value); }} disabled={readOnly} rows={3}/>)}

            {question.type === 'multiple_choice' && (<select_1.Select value={question.response || ''} onValueChange={handleResponse} disabled={readOnly}>
                <select_1.SelectTrigger>
                  <select_1.SelectValue placeholder="Select an option..."/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  {(_a = question.options) === null || _a === void 0 ? void 0 : _a.map(function (option) { return (<select_1.SelectItem key={option} value={option}>
                      {option}
                    </select_1.SelectItem>); })}
                </select_1.SelectContent>
              </select_1.Select>)}

            {question.type === 'boolean' && (<div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <checkbox_1.Checkbox id={"".concat(question.id, "-yes")} checked={question.response === true} onCheckedChange={function (checked) { return handleResponse(checked); }} disabled={readOnly}/>
                  <label htmlFor={"".concat(question.id, "-yes")} className="text-sm">Yes</label>
                </div>
                <div className="flex items-center space-x-2">
                  <checkbox_1.Checkbox id={"".concat(question.id, "-no")} checked={question.response === false} onCheckedChange={function (checked) { return handleResponse(!checked); }} disabled={readOnly}/>
                  <label htmlFor={"".concat(question.id, "-no")} className="text-sm">No</label>
                </div>
              </div>)}

            {question.type === 'rating' && (<div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Poor</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map(function (rating) { return (<button_1.Button key={rating} variant={question.response === rating ? "default" : "outline"} size="sm" onClick={function () { return handleResponse(rating); }} disabled={readOnly} className="w-8 h-8 p-0">
                      {rating}
                    </button_1.Button>); })}
                </div>
                <span className="text-sm text-gray-600">Excellent</span>
              </div>)}

            {question.type === 'date' && (<input_1.Input type="date" value={question.response || ''} onChange={function (e) { return handleResponse(e.target.value); }} disabled={readOnly}/>)}

            {/* Notes section */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Additional Notes (Optional)
              </label>
              <textarea_1.Textarea placeholder="Add any additional context or observations..." value={question.notes || ''} onChange={function (e) { return handleResponse(question.response, e.target.value); }} disabled={readOnly} rows={2} className="text-sm"/>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    };
    if (sections.length === 0) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6 text-center">
          <lucide_react_1.Clock className="h-8 w-8 text-gray-400 mx-auto mb-4"/>
          <p>Loading interview template...</p>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <card_1.Card>
        <card_1.CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <card_1.CardTitle className="flex items-center space-x-2">
                <lucide_react_1.Users className="h-5 w-5"/>
                <span>Community Interview Template</span>
              </card_1.CardTitle>
              <card_1.CardDescription>
                Structured interview for gathering community intelligence about the property
              </card_1.CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <badge_1.Badge variant="outline">
                {getTotalEstimatedTime()} min estimated
              </badge_1.Badge>
              <badge_1.Badge variant={calculateProgress() === 100 ? "default" : "secondary"}>
                {Math.round(calculateProgress())}% Complete
              </badge_1.Badge>
            </div>
          </div>
        </card_1.CardHeader>
        <card_1.CardContent>
          <progress_1.Progress value={calculateProgress()} className="mb-4"/>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">Session ID</div>
              <div className="text-gray-600 font-mono text-xs">{sessionId}</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Property Type</div>
              <div className="text-gray-600">{propertyType}</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Location</div>
              <div className="text-gray-600">{location}</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Date</div>
              <div className="text-gray-600">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Interviewer Information */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="text-lg">Interviewer Information</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Interviewer Name
              </label>
              <input_1.Input value={interviewerInfo.name} onChange={function (e) { return setInterviewerInfo(function (prev) { return (__assign(__assign({}, prev), { name: e.target.value })); }); }} disabled={readOnly} placeholder="Enter your name"/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Role/Organization
              </label>
              <input_1.Input value={interviewerInfo.role} onChange={function (e) { return setInterviewerInfo(function (prev) { return (__assign(__assign({}, prev), { role: e.target.value })); }); }} disabled={readOnly} placeholder="e.g., TripleCheck Verifier"/>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Respondent Information */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="text-lg">Respondent Information</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Respondent Name
              </label>
              <input_1.Input value={respondentInfo.name} onChange={function (e) { return setRespondentInfo(function (prev) { return (__assign(__assign({}, prev), { name: e.target.value })); }); }} disabled={readOnly} placeholder="Enter respondent's name"/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Source Type
              </label>
              <select_1.Select value={respondentInfo.sourceType} onValueChange={function (value) { return setRespondentInfo(function (prev) { return (__assign(__assign({}, prev), { sourceType: value })); }); }} disabled={readOnly}>
                <select_1.SelectTrigger>
                  <select_1.SelectValue placeholder="Select source type..."/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  {COMMUNITY_SOURCES.map(function (source) { return (<select_1.SelectItem key={source.id} value={source.id}>
                      <div className="flex items-center space-x-2">
                        <source.icon className="h-4 w-4"/>
                        <span>{source.name}</span>
                        <badge_1.Badge variant="outline" className="text-xs ml-2">
                          {Math.round(source.reliability * 100)}% reliable
                        </badge_1.Badge>
                      </div>
                    </select_1.SelectItem>); })}
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Years in Area
              </label>
              <input_1.Input value={respondentInfo.yearsInArea} onChange={function (e) { return setRespondentInfo(function (prev) { return (__assign(__assign({}, prev), { yearsInArea: e.target.value })); }); }} disabled={readOnly} placeholder="e.g., 15 years"/>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Relationship to Property
              </label>
              <input_1.Input value={respondentInfo.relationship} onChange={function (e) { return setRespondentInfo(function (prev) { return (__assign(__assign({}, prev), { relationship: e.target.value })); }); }} disabled={readOnly} placeholder="e.g., Neighbor, Former owner"/>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Interview Sections */}
      <div className="space-y-6">
        {sections.map(function (section, index) { return (<card_1.Card key={section.id} className={section.completed ? 'border-green-200 bg-green-50' : ''}>
            <card_1.CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <card_1.CardTitle className="flex items-center space-x-2">
                    {section.completed ? (<lucide_react_1.CheckCircle className="h-5 w-5 text-green-500"/>) : (<lucide_react_1.Clock className="h-5 w-5 text-gray-400"/>)}
                    <span>{section.title}</span>
                  </card_1.CardTitle>
                  <card_1.CardDescription>{section.description}</card_1.CardDescription>
                </div>
                <badge_1.Badge variant="outline">
                  {section.estimatedTime} min
                </badge_1.Badge>
              </div>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                {section.questions.map(function (question) { return renderQuestion(section, question); })}
              </div>
            </card_1.CardContent>
          </card_1.Card>); })}
      </div>

      {/* Actions */}
      {!readOnly && (<card_1.Card>
          <card_1.CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button_1.Button variant="outline" size="sm" onClick={function () { return setIsRecording(!isRecording); }}>
                  <lucide_react_1.Mic className={"h-4 w-4 mr-1 ".concat(isRecording ? 'text-red-500' : '')}/>
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button_1.Button>
                <button_1.Button variant="outline" size="sm">
                  <lucide_react_1.Camera className="h-4 w-4 mr-1"/>
                  Add Photo
                </button_1.Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <button_1.Button variant="outline" onClick={handleExportTemplate}>
                  <lucide_react_1.Download className="h-4 w-4 mr-1"/>
                  Export
                </button_1.Button>
                <button_1.Button onClick={handleSaveTemplate}>
                  <lucide_react_1.Save className="h-4 w-4 mr-1"/>
                  Save Template
                </button_1.Button>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>)}
    </div>);
}
exports.default = CommunityInterviewTemplate;
