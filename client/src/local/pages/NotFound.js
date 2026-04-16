"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NotFound;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../components/ui/button");
function NotFound() {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button_1.Button onClick={function () { return window.history.back(); }}>
            <lucide_react_1.ArrowLeft className="w-4 h-4 mr-2"/>
            Go Back
          </button_1.Button>
          <button_1.Button variant="outline" onClick={function () { return window.location.href = '/'; }}>
            <lucide_react_1.Home className="w-4 h-4 mr-2"/>
            Go Home
          </button_1.Button>
        </div>
      </div>
    </div>);
}
