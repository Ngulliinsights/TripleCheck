"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Login;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var card_1 = require("../../local/components/ui/card");
var LoginForm_1 = require("../components/LoginForm");
function Login() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var handleLoginSuccess = function (user) {
        // Redirect based on user role or to dashboard
        var redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(redirectPath);
    };
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <card_1.Card className="w-full max-w-md">
        <card_1.CardContent className="p-6">
          <LoginForm_1.LoginForm onSuccess={handleLoginSuccess} showSocialLogin={true} enableTwoFactor={true} enableBiometric={true}/>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
