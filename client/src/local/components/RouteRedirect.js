"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteRedirect = void 0;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var RouteRedirect = function (_a) {
    var to = _a.to, _b = _a.replace, replace = _b === void 0 ? true : _b;
    var navigate = (0, react_router_dom_1.useNavigate)();
    (0, react_1.useEffect)(function () {
        navigate(to, { replace: replace });
    }, [navigate, to, replace]);
    return (<div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>);
};
exports.RouteRedirect = RouteRedirect;
exports.default = exports.RouteRedirect;
