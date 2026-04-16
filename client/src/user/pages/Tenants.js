"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TenantsPage;
var react_1 = require("react");
var use_toast_1 = require("../../local/hooks/use-toast");
function TenantsPage() {
    var toast = (0, use_toast_1.useToast)().toast;
    return (<div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-[#2C5282]">
        Access Verified Tenants
      </h1>
      <p className="text-lg mb-8">
        Connect with pre-screened, verified tenants actively looking for
        properties in Kenya. All tenants undergo our rigorous background and
        financial verification process.
      </p>
      <div>
        <p>Tenant functionality will be implemented here.</p>
      </div>
    </div>);
}
