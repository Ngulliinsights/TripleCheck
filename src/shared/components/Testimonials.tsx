import React from 'react';

export function Testimonials() {
  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">What Our Customers Say</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Hear from property owners and buyers who trust our verification services
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">"TripleCheck helped me avoid a fraudulent property listing. Their verification process is thorough and reliable."</p>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
            <div>
              <p className="font-semibold">John Doe</p>
              <p className="text-sm text-gray-500">Property Buyer</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">"As a landlord, I appreciate the trust score system. It helps me identify serious tenants quickly."</p>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
            <div>
              <p className="font-semibold">Jane Smith</p>
              <p className="text-sm text-gray-500">Property Owner</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-4">"The document authentication feature saved me from a costly mistake. Highly recommended!"</p>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
            <div>
              <p className="font-semibold">Mike Johnson</p>
              <p className="text-sm text-gray-500">Real Estate Agent</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}