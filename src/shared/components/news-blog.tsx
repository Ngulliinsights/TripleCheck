import React from 'react';

export function NewsBlog() {
  return (
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Latest News & Insights</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Stay updated with the latest trends and insights in real estate verification
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gray-200"></div>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">How to Spot Fraudulent Property Listings</h3>
            <p className="text-gray-600 text-sm mb-4">Learn the warning signs and protect yourself from property fraud with our comprehensive guide.</p>
            <p className="text-xs text-gray-500">January 15, 2024</p>
          </div>
        </article>
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gray-200"></div>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">The Future of Property Verification</h3>
            <p className="text-gray-600 text-sm mb-4">Discover how blockchain and AI are revolutionizing property verification processes.</p>
            <p className="text-xs text-gray-500">January 10, 2024</p>
          </div>
        </article>
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gray-200"></div>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-2">Building Trust in Real Estate</h3>
            <p className="text-gray-600 text-sm mb-4">Why trust scores matter in today's competitive real estate market.</p>
            <p className="text-xs text-gray-500">January 5, 2024</p>
          </div>
        </article>
      </div>
    </div>
  );
}