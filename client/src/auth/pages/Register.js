"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Register;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var RegistrationWizard_1 = require("../components/RegistrationWizard");
function Register() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var handleRegistrationComplete = function (userData) {
        // Redirect to email verification page or dashboard
        navigate('/auth/verify-email', {
            state: { email: userData.email }
        });
    };
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <RegistrationWizard_1.RegistrationWizard onComplete={handleRegistrationComplete} allowSkipOptional={true}/>
    </div>);
}
