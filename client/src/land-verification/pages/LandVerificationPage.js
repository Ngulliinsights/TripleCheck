"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandVerificationPage = LandVerificationPage;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var LandVerificationDashboardPage_1 = require("./LandVerificationDashboardPage");
var NewVerificationPage_1 = require("./NewVerificationPage");
function LandVerificationPage() {
    return (<react_router_dom_1.Routes>
      <react_router_dom_1.Route index element={<LandVerificationDashboardPage_1.default />}/>
      <react_router_dom_1.Route path="new" element={<NewVerificationPage_1.default />}/>
      <react_router_dom_1.Route path="session/:sessionId" element={<LandVerificationDashboardPage_1.default />}/>
    </react_router_dom_1.Routes>);
}
exports.default = LandVerificationPage;
