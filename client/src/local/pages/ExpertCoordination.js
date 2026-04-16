"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ExpertCoordination;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../components/ui/button");
var input_1 = require("../components/ui/input");
var card_1 = require("../components/ui/card");
var badge_1 = require("../components/ui/badge");
var select_1 = require("../components/ui/select");
var use_toast_1 = require("../hooks/use-toast");
var mockExperts = [
    {
        id: 'exp-1',
        name: 'Sarah Wanjiku',
        profession: 'lawyer',
        specialization: ['Property Law', 'Real Estate Transactions', 'Title Disputes'],
        location: 'Nairobi, Kenya',
        rating: 4.9,
        reviewCount: 127,
        experience: 12,
        hourlyRate: 8000,
        availability: 'available',
        description: 'Experienced property lawyer specializing in real estate transactions and title verification.',
        completedProjects: 340,
        responseTime: '< 2 hours'
    },
    {
        id: 'exp-2',
        name: 'David Kimani',
        profession: 'surveyor',
        specialization: ['Land Surveying', 'Boundary Disputes', 'Topographical Surveys'],
        location: 'Nairobi, Kenya',
        rating: 4.8,
        reviewCount: 89,
        experience: 8,
        hourlyRate: 6000,
        availability: 'available',
        description: 'Professional land surveyor with expertise in boundary determination and land mapping.',
        completedProjects: 156,
        responseTime: '< 4 hours'
    },
    {
        id: 'exp-3',
        name: 'Grace Muthoni',
        profession: 'valuer',
        specialization: ['Property Valuation', 'Market Analysis', 'Investment Advisory'],
        location: 'Nairobi, Kenya',
        rating: 4.7,
        reviewCount: 203,
        experience: 15,
        hourlyRate: 7500,
        availability: 'busy',
        description: 'Certified property valuer with extensive experience in residential and commercial properties.',
        completedProjects: 520,
        responseTime: '< 6 hours'
    }
];
var professionIcons = {
    lawyer: lucide_react_1.Briefcase,
    surveyor: lucide_react_1.MapPin,
    valuer: lucide_react_1.DollarSign,
    inspector: lucide_react_1.CheckCircle
};
function ExpertCoordination() {
    var toast = (0, use_toast_1.useToast)().toast;
    var experts = (0, react_1.useState)(mockExperts)[0];
    var _a = (0, react_1.useState)(''), searchQuery = _a[0], setSearchQuery = _a[1];
    var _b = (0, react_1.useState)('all'), filterProfession = _b[0], setFilterProfession = _b[1];
    var filteredExperts = (0, react_1.useMemo)(function () {
        return experts.filter(function (expert) {
            var matchesSearch = !searchQuery ||
                expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                expert.specialization.some(function (spec) { return spec.toLowerCase().includes(searchQuery.toLowerCase()); });
            var matchesProfession = filterProfession === 'all' || expert.profession === filterProfession;
            return matchesSearch && matchesProfession;
        });
    }, [experts, searchQuery, filterProfession]);
    var handleContactExpert = (0, react_1.useCallback)(function (expert) {
        toast({
            title: 'Contact request sent',
            description: "Your request to contact ".concat(expert.name, " has been sent. They will respond within ").concat(expert.responseTime, "."),
        });
    }, [toast]);
    var getAvailabilityColor = function (availability) {
        switch (availability) {
            case 'available':
                return 'bg-green-100 text-green-800';
            case 'busy':
                return 'bg-yellow-100 text-yellow-800';
            case 'unavailable':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <lucide_react_1.Users className="w-8 h-8 text-blue-500"/>
            Expert Coordination
          </h1>
          <p className="text-muted-foreground">
            Connect with verified legal experts, surveyors, and property professionals
          </p>
        </div>

        {/* Search and Filters */}
        <card_1.Card className="mb-8">
          <card_1.CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <input_1.Input placeholder="Search experts by name or specialization..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} className="w-full"/>
              </div>
              
              <select_1.Select value={filterProfession} onValueChange={setFilterProfession}>
                <select_1.SelectTrigger>
                  <select_1.SelectValue placeholder="All Professions"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="all">All Professions</select_1.SelectItem>
                  <select_1.SelectItem value="lawyer">Lawyers</select_1.SelectItem>
                  <select_1.SelectItem value="surveyor">Surveyors</select_1.SelectItem>
                  <select_1.SelectItem value="valuer">Valuers</select_1.SelectItem>
                  <select_1.SelectItem value="inspector">Inspectors</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Experts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredExperts.map(function (expert) {
            var IconComponent = professionIcons[expert.profession];
            return (<card_1.Card key={expert.id} className="hover:shadow-lg transition-shadow">
                <card_1.CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <IconComponent className="w-6 h-6 text-primary"/>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{expert.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {expert.profession}
                        </p>
                      </div>
                    </div>
                    <badge_1.Badge className={getAvailabilityColor(expert.availability)}>
                      {expert.availability}
                    </badge_1.Badge>
                  </div>
                </card_1.CardHeader>

                <card_1.CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {expert.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <lucide_react_1.Star className="w-4 h-4 text-yellow-500"/>
                      <span className="font-medium">{expert.rating}</span>
                      <span className="text-muted-foreground">({expert.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <lucide_react_1.Award className="w-4 h-4 text-blue-500"/>
                      <span>{expert.experience} years</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <lucide_react_1.MapPin className="w-4 h-4 text-gray-500"/>
                      <span>{expert.location}</span>
                    </div>
                    <div className="font-medium">
                      KES {expert.hourlyRate.toLocaleString()}/hr
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">Specializations:</div>
                    <div className="flex flex-wrap gap-1">
                      {expert.specialization.slice(0, 2).map(function (spec, index) { return (<badge_1.Badge key={index} variant="outline" className="text-xs">
                          {spec}
                        </badge_1.Badge>); })}
                      {expert.specialization.length > 2 && (<badge_1.Badge variant="outline" className="text-xs">
                          +{expert.specialization.length - 2} more
                        </badge_1.Badge>)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{expert.completedProjects} projects completed</span>
                    <span>Responds in {expert.responseTime}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button_1.Button size="sm" className="flex-1" onClick={function () { return handleContactExpert(expert); }} disabled={expert.availability === 'unavailable'}>
                      <lucide_react_1.MessageSquare className="w-4 h-4 mr-2"/>
                      Contact
                    </button_1.Button>
                    <button_1.Button size="sm" variant="outline">
                      <lucide_react_1.FileText className="w-4 h-4 mr-2"/>
                      Profile
                    </button_1.Button>
                  </div>
                </card_1.CardContent>
              </card_1.Card>);
        })}
        </div>

        {filteredExperts.length === 0 && (<card_1.Card>
            <card_1.CardContent className="py-12 text-center">
              <lucide_react_1.Users className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
              <h3 className="font-semibold mb-2">No experts found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </card_1.CardContent>
          </card_1.Card>)}
      </div>
    </div>);
}
