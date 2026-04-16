"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageList = MessageList;
var date_fns_1 = require("date-fns");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var avatar_1 = require("../../local/components/ui/avatar");
var badge_1 = require("../../local/components/ui/badge");
var card_1 = require("../../local/components/ui/card");
function MessageList(_a) {
    var messages = _a.messages, onMessageClick = _a.onMessageClick, _b = _a.emptyMessage, emptyMessage = _b === void 0 ? "No messages found" : _b;
    var getPriorityColor = function (priority) {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    var getInitials = function (name) {
        return name
            .split(' ')
            .map(function (n) { return n.charAt(0); })
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };
    if (messages.length === 0) {
        return (<card_1.Card className="w-full">
        <card_1.CardContent className="flex flex-col items-center justify-center py-12">
          <lucide_react_1.MessageCircle className="h-12 w-12 text-gray-400 mb-4"/>
          <p className="text-gray-500 text-center">{emptyMessage}</p>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<card_1.Card className="w-full">
      <card_1.CardHeader>
        <card_1.CardTitle className="flex items-center gap-2">
          <lucide_react_1.MessageCircle className="h-5 w-5"/>
          Messages ({messages.length})
        </card_1.CardTitle>
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-2">
        {messages.map(function (message) { return (<div key={message.id} className={"p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ".concat(!message.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200')} onClick={function () { return onMessageClick === null || onMessageClick === void 0 ? void 0 : onMessageClick(message); }}>
            <div className="flex items-start space-x-3">
              <avatar_1.Avatar className="h-10 w-10">
                <avatar_1.AvatarImage src={message.senderAvatar} alt={message.senderName}/>
                <avatar_1.AvatarFallback>
                  {getInitials(message.senderName)}
                </avatar_1.AvatarFallback>
              </avatar_1.Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={"text-sm font-medium truncate ".concat(!message.isRead ? 'text-gray-900' : 'text-gray-700')}>
                      {message.senderName}
                    </h4>
                    <badge_1.Badge variant="outline" className={"text-xs ".concat(getPriorityColor(message.priority))}>
                      {message.priority}
                    </badge_1.Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {(0, date_fns_1.formatDistanceToNow)(message.timestamp, { addSuffix: true })}
                  </span>
                </div>
                
                <h5 className={"text-sm mb-1 truncate ".concat(!message.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700')}>
                  {message.subject}
                </h5>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {message.content}
                </p>
                
                {!message.isRead && (<div className="flex items-center mt-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-xs text-blue-600 font-medium">Unread</span>
                  </div>)}
              </div>
            </div>
          </div>); })}
      </card_1.CardContent>
    </card_1.Card>);
}
