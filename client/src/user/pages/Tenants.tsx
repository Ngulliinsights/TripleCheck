import React from 'react'

import { useToast } from "../../local/hooks/use-toast"

export default function TenantsPage() {
  const { toast } = useToast();

  return (
    <div className="container mx-auto py-10 px-4">
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
    </div>
  );
}