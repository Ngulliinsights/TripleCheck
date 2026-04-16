"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var FindProfessionals = function () {
    var professionals = [
        {
            id: '1',
            name: 'John Doe',
            profession: 'Real Estate Lawyer',
            location: 'Nairobi, Kenya',
            rating: 4.8,
            reviews: 127,
            phone: '+254 700 123 456',
            email: 'john.doe@example.com',
            specialties: ['Property Law', 'Land Disputes', 'Title Verification']
        },
        {
            id: '2',
            name: 'Jane Smith',
            profession: 'Licensed Surveyor',
            location: 'Mombasa, Kenya',
            rating: 4.9,
            reviews: 89,
            phone: '+254 700 789 012',
            email: 'jane.smith@example.com',
            specialties: ['Land Surveying', 'Boundary Disputes', 'Topographical Surveys']
        }
    ];
    return (<div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Find Verified Professionals
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with trusted lawyers, surveyors, and real estate experts to help with your property transactions.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5"/>
            <input type="text" placeholder="Search professionals..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>
        </div>

        {/* Professionals Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map(function (professional) { return (<div key={professional.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{professional.name}</h3>
                  <p className="text-blue-600 font-medium">{professional.profession}</p>
                </div>
                <div className="flex items-center gap-1">
                  <lucide_react_1.Star className="h-4 w-4 text-yellow-400 fill-current"/>
                  <span className="text-sm font-medium">{professional.rating}</span>
                  <span className="text-sm text-gray-500">({professional.reviews})</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <lucide_react_1.MapPin className="h-4 w-4"/>
                <span className="text-sm">{professional.location}</span>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {professional.specialties.map(function (specialty, index) { return (<span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {specialty}
                    </span>); })}
                </div>
              </div>

              <div className="flex gap-2">
                <a href={"tel:".concat(professional.phone)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  <lucide_react_1.Phone className="h-4 w-4"/>
                  Call
                </a>
                <a href={"mailto:".concat(professional.email)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  <lucide_react_1.Mail className="h-4 w-4"/>
                  Email
                </a>
              </div>
            </div>); })}
        </div>
      </div>
    </div>);
};
exports.default = FindProfessionals;
