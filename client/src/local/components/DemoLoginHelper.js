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
exports.DemoLoginHelper = DemoLoginHelper;
var badge_1 = require("./ui/badge");
var button_1 = require("./ui/button");
var card_1 = require("./ui/card");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var DEMO_ACCOUNTS = [
    {
        username: 'demo_user',
        password: import.meta.env.VITE_DEMO_USER_PASSWORD || 'demo123',
        role: 'Tenant',
        trustScore: 750,
        description: 'Regular user looking for properties',
        isAgent: false
    },
    {
        username: 'demo_agent',
        password: import.meta.env.VITE_DEMO_AGENT_PASSWORD || 'agent123',
        role: 'Verified Agent',
        trustScore: 950,
        description: 'Verified real estate agent',
        isAgent: true
    },
    {
        username: 'john_tenant',
        password: import.meta.env.VITE_DEMO_USER_PASSWORD || 'demo123',
        role: 'Tenant',
        trustScore: 750,
        description: 'Experienced tenant with good history',
        isAgent: false
    },
    {
        username: 'sarah_agent',
        password: import.meta.env.VITE_DEMO_AGENT_PASSWORD || 'agent123',
        role: 'Verified Agent',
        trustScore: 950,
        description: 'Top-rated property agent',
        isAgent: true
    }
];
function DemoLoginHelper(_a) {
    var _this = this;
    var onLogin = _a.onLogin, className = _a.className;
    var _b = (0, react_1.useState)(null), copiedAccount = _b[0], setCopiedAccount = _b[1];
    var copyCredentials = function (account) { return __awaiter(_this, void 0, void 0, function () {
        var credentials, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    credentials = "Username: ".concat(account.username, "\nPassword: ").concat(account.password);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, navigator.clipboard.writeText(credentials)];
                case 2:
                    _a.sent();
                    setCopiedAccount(account.username);
                    setTimeout(function () { return setCopiedAccount(null); }, 2000);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    // Fallback for browsers that don't support clipboard API
                    console.log('Credentials:', credentials);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleQuickLogin = function (account) {
        if (onLogin) {
            onLogin(account.username, account.password);
        }
    };
    return (<card_1.Card className={"w-full max-w-2xl mx-auto ".concat(className)}>
      <card_1.CardHeader>
        <card_1.CardTitle className="flex items-center gap-2">
          <lucide_react_1.User className="h-5 w-5"/>
          Demo Accounts for Testing
        </card_1.CardTitle>
        <p className="text-sm text-muted-foreground">
          Use these pre-configured accounts to test the application features
        </p>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="grid gap-4">
          {DEMO_ACCOUNTS.map(function (account) { return (<div key={account.username} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{account.username}</span>
                  {account.isAgent && (<badge_1.Badge variant="secondary" className="text-xs">
                      <lucide_react_1.Shield className="h-3 w-3 mr-1"/>
                      Verified Agent
                    </badge_1.Badge>)}
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {account.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Role: {account.role}</span>
                  <span>Trust Score: {account.trustScore}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button_1.Button variant="outline" size="sm" onClick={function () { return copyCredentials(account); }} className="flex items-center gap-1">
                  {copiedAccount === account.username ? (<>
                      <lucide_react_1.Check className="h-3 w-3"/>
                      Copied
                    </>) : (<>
                      <lucide_react_1.Copy className="h-3 w-3"/>
                      Copy
                    </>)}
                </button_1.Button>
                
                {onLogin && (<button_1.Button size="sm" onClick={function () { return handleQuickLogin(account); }} className="bg-customSecondary hover:bg-customSecondaryHover">
                    Quick Login
                  </button_1.Button>)}
              </div>
            </div>); })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Testing Features:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Regular Users:</strong> Can search properties, leave reviews, view details</li>
            <li>• <strong>Verified Agents:</strong> Can list properties, access advanced features</li>
            <li>• <strong>Trust Scores:</strong> Affect transaction limits and verification status</li>
            <li>• <strong>Search:</strong> Try "apartment", "Nairobi", "luxury", "beach"</li>
          </ul>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> These are demo accounts for testing purposes only. 
            In production, use secure passwords and proper authentication.
          </p>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
