"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfricaCoverageMap = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("./ui/badge");
var card_1 = require("./ui/card");
// Countries we cover with their status and stats
var COVERED_COUNTRIES = [
    {
        id: "nigeria",
        name: "Nigeria",
        status: "active",
        properties: 15420,
        users: 8900,
        coordinates: [45, 35],
    },
    {
        id: "kenya",
        name: "Kenya",
        status: "active",
        properties: 8750,
        users: 5200,
        coordinates: [65, 50],
    },
    {
        id: "south-africa",
        name: "South Africa",
        status: "active",
        properties: 12300,
        users: 7100,
        coordinates: [55, 85],
    },
    {
        id: "ghana",
        name: "Ghana",
        status: "active",
        properties: 4200,
        users: 2800,
        coordinates: [40, 40],
    },
    {
        id: "uganda",
        name: "Uganda",
        status: "active",
        properties: 3100,
        users: 1900,
        coordinates: [62, 52],
    },
    {
        id: "tanzania",
        name: "Tanzania",
        status: "coming-soon",
        properties: 0,
        users: 0,
        coordinates: [65, 60],
    },
    {
        id: "rwanda",
        name: "Rwanda",
        status: "coming-soon",
        properties: 0,
        users: 0,
        coordinates: [60, 55],
    },
    {
        id: "ethiopia",
        name: "Ethiopia",
        status: "planned",
        properties: 0,
        users: 0,
        coordinates: [68, 42],
    },
    {
        id: "morocco",
        name: "Morocco",
        status: "planned",
        properties: 0,
        users: 0,
        coordinates: [42, 18],
    },
    {
        id: "egypt",
        name: "Egypt",
        status: "planned",
        properties: 0,
        users: 0,
        coordinates: [58, 15],
    },
];
var CountryMarker = (0, react_1.memo)(function (_a) {
    var country = _a.country, isSelected = _a.isSelected, onClick = _a.onClick;
    var handleClick = (0, react_1.useCallback)(function () {
        onClick(country.id);
    }, [country.id, onClick]);
    var statusConfig = {
        active: {
            color: "bg-green-500",
            ring: "ring-green-200",
            pulse: "animate-pulse",
        },
        "coming-soon": {
            color: "bg-yellow-500",
            ring: "ring-yellow-200",
            pulse: "",
        },
        planned: {
            color: "bg-gray-400",
            ring: "ring-gray-200",
            pulse: "",
        },
    };
    var config = statusConfig[country.status];
    return (<button className={"absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-125 focus:scale-125 focus:outline-none ".concat(isSelected ? "scale-125 z-10" : "hover:z-10")} style={{
            left: "".concat(country.coordinates[0], "%"),
            top: "".concat(country.coordinates[1], "%"),
        }} onClick={handleClick} aria-label={"".concat(country.name, " - ").concat(country.status)}>
      <div className={"w-4 h-4 rounded-full ".concat(config.color, " ").concat(config.ring, " ring-4 ").concat(config.pulse, " shadow-lg")}/>
      {isSelected && (<div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-48 z-20">
          <div className="text-sm font-semibold text-gray-900 mb-1">
            {country.name}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <badge_1.Badge variant={country.status === "active" ? "default" : "secondary"} className="text-xs">
              {country.status === "active" ?
                "Active"
                : country.status === "coming-soon" ?
                    "Coming Soon"
                    : "Planned"}
            </badge_1.Badge>
          </div>
          {country.status === "active" && (<div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <lucide_react_1.MapPin className="w-3 h-3"/>
                <span>{country.properties.toLocaleString()} properties</span>
              </div>
              <div className="flex items-center gap-1">
                <lucide_react_1.Users className="w-3 h-3"/>
                <span>{country.users.toLocaleString()} users</span>
              </div>
            </div>)}
        </div>)}
    </button>);
});
CountryMarker.displayName = "CountryMarker";
exports.AfricaCoverageMap = (0, react_1.memo)(function (_a) {
    var _b = _a.variant, variant = _b === void 0 ? "default" : _b, _c = _a.showStats, showStats = _c === void 0 ? true : _c, onCountrySelect = _a.onCountrySelect;
    var _d = (0, react_1.useState)(null), selectedCountry = _d[0], setSelectedCountry = _d[1];
    var handleCountryClick = (0, react_1.useCallback)(function (countryId) {
        setSelectedCountry(selectedCountry === countryId ? null : countryId);
        onCountrySelect === null || onCountrySelect === void 0 ? void 0 : onCountrySelect(countryId);
    }, [selectedCountry, onCountrySelect]);
    var activeCountries = COVERED_COUNTRIES.filter(function (c) { return c.status === "active"; });
    var totalProperties = activeCountries.reduce(function (sum, c) { return sum + c.properties; }, 0);
    var totalUsers = activeCountries.reduce(function (sum, c) { return sum + c.users; }, 0);
    return (<div className="space-y-8">
        {/* Map Container */}
        <card_1.Card className="overflow-hidden border-0 shadow-lg">
          <card_1.CardHeader className="text-center pb-6">
            <card_1.CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              Our Coverage Across Africa
            </card_1.CardTitle>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
              TripleCheck is expanding across Africa, bringing secure property
              verification to major markets. Click on any country to see our
              coverage details.
            </p>
          </card_1.CardHeader>
          <card_1.CardContent className="p-8">
            <div className="relative max-w-4xl mx-auto">
              {/* Simplified Africa SVG Map */}
              <svg viewBox="0 0 100 100" className="w-full h-auto max-h-96 border border-gray-200 rounded-xl bg-gradient-to-br from-blue-50 to-green-50" role="img" aria-label="Map of Africa showing TripleCheck coverage">
                {/* Simplified Africa continent shape */}
                <path d="M20 15 Q25 10 35 12 Q45 8 55 10 Q65 12 75 18 Q80 25 78 35 Q75 45 70 55 Q65 65 60 75 Q55 85 50 90 Q45 92 40 90 Q35 88 30 85 Q25 80 22 70 Q18 60 15 50 Q12 40 15 30 Q18 20 20 15 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.5" className="transition-colors duration-300"/>

                {/* Country markers */}
                {COVERED_COUNTRIES.map(function (country) { return (<CountryMarker key={country.id} country={country} isSelected={selectedCountry === country.id} onClick={handleCountryClick}/>); })}
              </svg>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Stats and Legend */}
        {showStats && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <card_1.Card className="text-center border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50">
              <card_1.CardContent className="p-6">
                <div className="flex items-center justify-center mb-3">
                  <lucide_react_1.CheckCircle className="w-8 h-8 text-green-600"/>
                </div>
                <div className="text-2xl font-bold text-green-700 mb-1">
                  {activeCountries.length}
                </div>
                <div className="text-sm text-green-600 font-medium">
                  Active Markets
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card className="text-center border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
              <card_1.CardContent className="p-6">
                <div className="flex items-center justify-center mb-3">
                  <lucide_react_1.MapPin className="w-8 h-8 text-blue-600"/>
                </div>
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  {totalProperties.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  Verified Properties
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card className="text-center border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50">
              <card_1.CardContent className="p-6">
                <div className="flex items-center justify-center mb-3">
                  <lucide_react_1.Users className="w-8 h-8 text-purple-600"/>
                </div>
                <div className="text-2xl font-bold text-purple-700 mb-1">
                  {totalUsers.toLocaleString()}
                </div>
                <div className="text-sm text-purple-600 font-medium">
                  Trusted Users
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card className="text-center border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100/50">
              <card_1.CardContent className="p-6">
                <div className="flex items-center justify-center mb-3">
                  <lucide_react_1.Clock className="w-8 h-8 text-yellow-600"/>
                </div>
                <div className="text-2xl font-bold text-yellow-700 mb-1">
                  {COVERED_COUNTRIES.filter(function (c) { return c.status === "coming-soon"; })
                .length}
                </div>
                <div className="text-sm text-yellow-600 font-medium">
                  Coming Soon
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>)}

        {/* Legend */}
        <card_1.Card className="border-0 shadow-sm">
          <card_1.CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  Active Markets
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm font-medium text-gray-700">
                  Coming Soon
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm font-medium text-gray-700">
                  Planned
                </span>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
});
exports.AfricaCoverageMap.displayName = "AfricaCoverageMap";
