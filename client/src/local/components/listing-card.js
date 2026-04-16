"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var card_1 = require("./ui/card");
var badge_1 = require("./ui/badge");
var wouter_1 = require("wouter");
var CommunityInsights_1 = require("./CommunityInsights");
var index_1 = require("../index");
var react_1 = require("react");
// Memoized component to prevent unnecessary re-renders when props haven't changed
var ListingCard = (0, react_1.memo)(function ListingCard(_a) {
    var _b;
    var property = _a.property;
    // Extract features with proper type safety and fallback values
    var _c = property.features, _d = _c.bedrooms, bedrooms = _d === void 0 ? 0 : _d, _e = _c.squareFeet, squareFeet = _e === void 0 ? 0 : _e, _f = _c.amenities, amenities = _f === void 0 ? [] : _f;
    // Safely get the first image with fallback
    var primaryImage = ((_b = property.imageUrls) === null || _b === void 0 ? void 0 : _b[0]) || '/placeholder-property.jpg';
    // Format price with proper locale formatting for Kenyan currency
    var formattedPrice = new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        maximumFractionDigits: 0
    }).format(property.price);
    // Limit amenities display to prevent layout overflow
    var displayAmenities = amenities.slice(0, 3);
    return (<card_1.Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-xl border-0 shadow-md">
      {/* Main property link wrapping the image section */}
      <wouter_1.Link href={"/property/".concat(property.id)} className="block">
        <div className="relative overflow-hidden">
          <img src={primaryImage} alt={"".concat(property.title, " - Property listing image")} className="w-full h-56 object-cover cursor-pointer transform group-hover:scale-110 transition-transform duration-500" loading="lazy" // Optimize loading for better performance
     onError={function (e) {
            // Fallback image handling
            var target = e.target;
            target.src = '/placeholder-property.jpg';
        }}/>
          
          {/* Verification badge positioned absolutely */}
          <div className="absolute top-4 right-4 z-10">
            <CommunityInsights_1.default status={property.verificationStatus}/>
          </div>
          
          {/* Gradient overlay for better text readability */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-24 pointer-events-none"/>
        </div>
      </wouter_1.Link>

      <card_1.CardContent className="p-5">
        <div className="space-y-3">
          {/* Property title with improved accessibility */}
          <wouter_1.Link href={"/property/".concat(property.id)} className="block">
            <h3 className="text-xl font-semibold hover:text-primary cursor-pointer transition-colors line-clamp-2 leading-tight">
              {property.title}
            </h3>
          </wouter_1.Link>
          
          {/* Location display with improved spacing */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <index_1.MapPin className="h-4 w-4 text-primary flex-shrink-0"/>
            <span className="text-sm font-medium truncate">{property.location}</span>
          </div>
          
          {/* Property details and price section */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              {/* Bedrooms info with conditional rendering */}
              {bedrooms > 0 && (<div className="flex items-center gap-2 text-gray-700">
                  <index_1.Home className="h-4 w-4 text-primary/80 flex-shrink-0"/>
                  <span className="text-sm font-medium">
                    {bedrooms} {bedrooms === 1 ? 'bed' : 'beds'}
                  </span>
                </div>)}
              
              {/* Square footage with conditional rendering */}
              {squareFeet > 0 && (<div className="flex items-center gap-2 text-gray-700">
                  <index_1.Square className="h-4 w-4 text-primary/80 flex-shrink-0"/>
                  <span className="text-sm font-medium">
                    {squareFeet.toLocaleString()} sq ft
                  </span>
                </div>)}
            </div>
            
            {/* Price with improved formatting */}
            <p className="font-semibold text-lg text-primary whitespace-nowrap ml-4">
              {formattedPrice}
            </p>
          </div>
        </div>
      </card_1.CardContent>

      {/* Amenities footer with conditional rendering */}
      {displayAmenities.length > 0 && (<card_1.CardFooter className="px-5 py-4 bg-gray-50 border-t">
          <div className="flex flex-wrap gap-2">
            {displayAmenities.map(function (amenity) { return (<badge_1.Badge key={amenity} variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-0">
                {amenity}
              </badge_1.Badge>); })}
            
            {/* Show indicator if there are more amenities */}
            {amenities.length > 3 && (<badge_1.Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
                +{amenities.length - 3} more
              </badge_1.Badge>)}
          </div>
        </card_1.CardFooter>)}
    </card_1.Card>);
});
exports.default = ListingCard;
