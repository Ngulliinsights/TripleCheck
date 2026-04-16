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
exports.MessageComposer = MessageComposer;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var input_1 = require("../../local/components/ui/input");
var label_1 = require("../../local/components/ui/label");
var select_1 = require("../../local/components/ui/select");
var textarea_1 = require("../../local/components/ui/textarea");
function MessageComposer(_a) {
    var _b = _a.recipientId, recipientId = _b === void 0 ? '' : _b, _c = _a.recipientName, recipientName = _c === void 0 ? '' : _c, onSend = _a.onSend, onCancel = _a.onCancel, _d = _a.isLoading, isLoading = _d === void 0 ? false : _d;
    var _e = (0, react_1.useState)({
        recipientId: recipientId,
        recipientName: recipientName,
        subject: '',
        content: '',
        priority: 'medium',
    }), formData = _e[0], setFormData = _e[1];
    var handleSubmit = function (e) {
        e.preventDefault();
        if (!formData.recipientId || !formData.subject.trim() || !formData.content.trim()) {
            return;
        }
        onSend({
            recipientId: formData.recipientId,
            subject: formData.subject.trim(),
            content: formData.content.trim(),
            priority: formData.priority,
        });
    };
    var handleInputChange = function (field, value) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    var isFormValid = formData.recipientId && formData.subject.trim() && formData.content.trim();
    return (<card_1.Card className="w-full max-w-2xl">
      <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <card_1.CardTitle className="text-xl font-semibold">Compose Message</card_1.CardTitle>
        {onCancel && (<button_1.Button variant="ghost" size="sm" onClick={onCancel}>
            <lucide_react_1.X className="h-4 w-4"/>
          </button_1.Button>)}
      </card_1.CardHeader>
      <card_1.CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recipient */}
          <div className="space-y-2">
            <label_1.Label htmlFor="recipient">To</label_1.Label>
            {recipientName ? (<div className="p-2 bg-gray-50 rounded-md">
                <span className="text-sm font-medium">{recipientName}</span>
              </div>) : (<input_1.Input id="recipient" placeholder="Enter recipient name or ID" value={formData.recipientName} onChange={function (e) { return handleInputChange('recipientName', e.target.value); }} disabled={isLoading}/>)}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label_1.Label htmlFor="priority">Priority</label_1.Label>
            <select_1.Select value={formData.priority} onValueChange={function (value) { return handleInputChange('priority', value); }} disabled={isLoading}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="Select priority"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="low">Low</select_1.SelectItem>
                <select_1.SelectItem value="medium">Medium</select_1.SelectItem>
                <select_1.SelectItem value="high">High</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label_1.Label htmlFor="subject">Subject</label_1.Label>
            <input_1.Input id="subject" placeholder="Enter message subject" value={formData.subject} onChange={function (e) { return handleInputChange('subject', e.target.value); }} disabled={isLoading}/>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label_1.Label htmlFor="content">Message</label_1.Label>
            <textarea_1.Textarea id="content" placeholder="Type your message here..." value={formData.content} onChange={function (e) { return handleInputChange('content', e.target.value); }} disabled={isLoading} rows={6} className="resize-none"/>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (<button_1.Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </button_1.Button>)}
            <button_1.Button type="submit" disabled={!isFormValid || isLoading}>
              {isLoading ? (<>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>) : (<>
                  <lucide_react_1.Send className="h-4 w-4 mr-2"/>
                  Send Message
                </>)}
            </button_1.Button>
          </div>
        </form>
      </card_1.CardContent>
    </card_1.Card>);
}
