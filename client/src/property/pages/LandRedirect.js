"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LandRedirect;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
/**
 * LandRedirect Component
 *
 * Redirects legacy /land/:id routes to the unified /property/:id pattern
 * Maintains deep-link compatibility while standardizing routes
 */
function LandRedirect() {
    var id = (0, react_router_dom_1.useParams)().id;
    (0, react_1.useEffect)(function () {
        // Log the redirect for analytics/debugging
        if (process.env.NODE_ENV === 'development') {
            console.log("Redirecting /land/".concat(id, " to /property/").concat(id));
        }
    }, [id]);
    // Redirect to unified property route
    if (!id) {
        return <react_router_dom_1.Navigate to="/properties" replace/>;
    }
    return <react_router_dom_1.Navigate to={"/property/".concat(id)} replace/>;
}
