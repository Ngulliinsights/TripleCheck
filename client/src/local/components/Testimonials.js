"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Testimonials = Testimonials;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("./ui/badge");
var button_1 = require("./ui/button");
var card_1 = require("./ui/card");
// Enhanced testimonials with African property market focus
var ENHANCED_TESTIMONIALS = [
    {
        id: "testimonial-1",
        text: "TripleCheck saved me from a fraudulent property deal in Lagos. Their verification process caught discrepancies in the title deed that could have cost me millions of naira. I now use them for every property transaction.",
        rating: 5,
        author: {
            id: "author-1",
            name: "Adebayo Ogundimu",
            role: "Real Estate Investor",
            company: "Ogundimu Holdings",
            location: "Lagos",
            country: "Nigeria",
            image: {
                src: "/images/testimonials/adebayo-ogundimu.jpg",
                alt: "Adebayo Ogundimu - Real Estate Investor from Lagos, Nigeria",
            },
            verified: true,
            linkedIn: "https://linkedin.com/in/adebayo-ogundimu",
        },
        category: "investor",
        propertyType: "Commercial",
        transactionValue: "₦50M+",
        date: "2024-01-15",
        featured: true,
    },
    {
        id: "testimonial-2",
        text: "As a property developer in Nairobi, I rely on TripleCheck to verify all our land acquisitions. Their comprehensive checks across Kenyan land registries have prevented multiple costly mistakes and given our investors confidence.",
        rating: 5,
        author: {
            id: "author-2",
            name: "Grace Wanjiku",
            role: "Property Developer",
            company: "Wanjiku Developments",
            location: "Nairobi",
            country: "Kenya",
            image: {
                src: "/images/testimonials/grace-wanjiku.jpg",
                alt: "Grace Wanjiku - Property Developer from Nairobi, Kenya",
            },
            verified: true,
        },
        category: "developer",
        propertyType: "Residential",
        transactionValue: "KSh 100M+",
        date: "2024-01-10",
        featured: true,
    },
    {
        id: "testimonial-3",
        text: "Working with international clients investing in South African property, TripleCheck's verification reports provide the transparency and trust needed to close deals. Their service is invaluable for cross-border transactions.",
        rating: 5,
        author: {
            id: "author-3",
            name: "Thabo Mthembu",
            role: "Senior Real Estate Agent",
            company: "Cape Town Properties",
            location: "Cape Town",
            country: "South Africa",
            image: {
                src: "/images/testimonials/thabo-mthembu.jpg",
                alt: "Thabo Mthembu - Real Estate Agent from Cape Town, South Africa",
            },
            verified: true,
        },
        category: "agent",
        propertyType: "Luxury Residential",
        transactionValue: "R5M+",
        date: "2024-01-08",
    },
    {
        id: "testimonial-4",
        text: "TripleCheck helped me find my dream home in Accra. Their verified listings and professional network connected me with trustworthy agents. The entire process was transparent and secure.",
        rating: 5,
        author: {
            id: "author-4",
            name: "Akosua Mensah",
            role: "Software Engineer",
            location: "Accra",
            country: "Ghana",
            image: {
                src: "/images/testimonials/akosua-mensah.jpg",
                alt: "Akosua Mensah - Software Engineer from Accra, Ghana",
            },
            verified: true,
        },
        category: "buyer",
        propertyType: "Residential",
        date: "2024-01-05",
    },
    {
        id: "testimonial-5",
        text: "As someone selling inherited property in Kampala, TripleCheck's document authentication service was crucial. They verified all the complex inheritance documents and helped establish clear ownership.",
        rating: 5,
        author: {
            id: "author-5",
            name: "David Mukasa",
            role: "Business Owner",
            location: "Kampala",
            country: "Uganda",
            image: {
                src: "/images/testimonials/david-mukasa.jpg",
                alt: "David Mukasa - Business Owner from Kampala, Uganda",
            },
            verified: true,
        },
        category: "seller",
        propertyType: "Residential",
        date: "2024-01-03",
    },
    {
        id: "testimonial-6",
        text: "TripleCheck's market insights helped me make informed investment decisions across multiple African markets. Their data on property trends in Kigali was particularly valuable for my portfolio expansion.",
        rating: 5,
        author: {
            id: "author-6",
            name: "Marie Uwimana",
            role: "Investment Manager",
            company: "East Africa Capital",
            location: "Kigali",
            country: "Rwanda",
            image: {
                src: "/images/testimonials/marie-uwimana.jpg",
                alt: "Marie Uwimana - Investment Manager from Kigali, Rwanda",
            },
            verified: true,
        },
        category: "investor",
        propertyType: "Mixed-use",
        transactionValue: "$2M+",
        date: "2024-01-01",
    },
];
// Testimonial statistics
var TESTIMONIAL_STATS = [
    {
        label: "Client Satisfaction",
        value: "98.5%",
        icon: <lucide_react_1.Star className="w-5 h-5"/>,
        color: "text-yellow-500",
    },
    {
        label: "Verified Reviews",
        value: "15K+",
        icon: <lucide_react_1.CheckCircle className="w-5 h-5"/>,
        color: "text-green-500",
    },
    {
        label: "African Countries",
        value: "54",
        icon: <lucide_react_1.Globe className="w-5 h-5"/>,
        color: "text-blue-500",
    },
    {
        label: "Success Stories",
        value: "25K+",
        icon: <lucide_react_1.Award className="w-5 h-5"/>,
        color: "text-purple-500",
    },
];
// Category filters
var CATEGORY_FILTERS = [
    { id: "all", label: "All Reviews", icon: <lucide_react_1.Users className="w-4 h-4"/> },
    { id: "buyer", label: "Buyers", icon: <lucide_react_1.Building className="w-4 h-4"/> },
    { id: "seller", label: "Sellers", icon: <lucide_react_1.TrendingUp className="w-4 h-4"/> },
    { id: "agent", label: "Agents", icon: <lucide_react_1.Users className="w-4 h-4"/> },
    {
        id: "developer",
        label: "Developers",
        icon: <lucide_react_1.Building className="w-4 h-4"/>,
    },
    { id: "investor", label: "Investors", icon: <lucide_react_1.Award className="w-4 h-4"/> },
];
/**
 * Testimonials component with Thunes-inspired design
 * Features client photos, detailed profiles, and African market focus
 */
function Testimonials(_a) {
    var _b = _a.variant, variant = _b === void 0 ? "carousel" : _b, _c = _a.showStats, showStats = _c === void 0 ? true : _c, _d = _a.showFilters, showFilters = _d === void 0 ? true : _d, _e = _a.autoPlay, autoPlay = _e === void 0 ? true : _e, _f = _a.className, className = _f === void 0 ? "" : _f;
    var _g = (0, react_1.useState)(0), currentSlide = _g[0], setCurrentSlide = _g[1];
    var _h = (0, react_1.useState)(autoPlay), isAutoPlaying = _h[0], setIsAutoPlaying = _h[1];
    var _j = (0, react_1.useState)("all"), selectedCategory = _j[0], setSelectedCategory = _j[1];
    var _k = (0, react_1.useState)(1), itemsPerSlide = _k[0], setItemsPerSlide = _k[1];
    // Filter testimonials by category
    var filteredTestimonials = (0, react_1.useMemo)(function () {
        if (selectedCategory === "all")
            return ENHANCED_TESTIMONIALS;
        return ENHANCED_TESTIMONIALS.filter(function (testimonial) { return testimonial.category === selectedCategory; });
    }, [selectedCategory]);
    // Responsive items per slide
    (0, react_1.useEffect)(function () {
        var updateItemsPerSlide = function () {
            if (variant === "grid")
                return;
            if (window.innerWidth >= 1024) {
                setItemsPerSlide(2); // lg: 2 items for better readability
            }
            else if (window.innerWidth >= 768) {
                setItemsPerSlide(1); // md: 1 item
            }
            else {
                setItemsPerSlide(1); // sm: 1 item
            }
        };
        updateItemsPerSlide();
        window.addEventListener("resize", updateItemsPerSlide);
        return function () { return window.removeEventListener("resize", updateItemsPerSlide); };
    }, [variant]);
    var totalSlides = (0, react_1.useMemo)(function () {
        return Math.ceil(filteredTestimonials.length / itemsPerSlide);
    }, [filteredTestimonials.length, itemsPerSlide]);
    // Auto-play functionality
    (0, react_1.useEffect)(function () {
        if (!isAutoPlaying || totalSlides <= 1 || variant !== "carousel")
            return;
        var interval = setInterval(function () {
            setCurrentSlide(function (prev) { return (prev + 1) % totalSlides; });
        }, 6000); // 6 seconds per slide
        return function () { return clearInterval(interval); };
    }, [isAutoPlaying, totalSlides, variant]);
    // Navigation handlers
    var goToSlide = (0, react_1.useCallback)(function (index) {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        setTimeout(function () { return setIsAutoPlaying(autoPlay); }, 12000);
    }, [autoPlay]);
    var nextSlide = (0, react_1.useCallback)(function () {
        setCurrentSlide(function (prev) { return (prev + 1) % totalSlides; });
        setIsAutoPlaying(false);
        setTimeout(function () { return setIsAutoPlaying(autoPlay); }, 12000);
    }, [totalSlides, autoPlay]);
    var prevSlide = (0, react_1.useCallback)(function () {
        setCurrentSlide(function (prev) { return (prev - 1 + totalSlides) % totalSlides; });
        setIsAutoPlaying(false);
        setTimeout(function () { return setIsAutoPlaying(autoPlay); }, 12000);
    }, [totalSlides, autoPlay]);
    var handleCategoryChange = (0, react_1.useCallback)(function (categoryId) {
        setSelectedCategory(categoryId);
        setCurrentSlide(0);
    }, []);
    // Enhanced testimonial card component
    var TestimonialCard = (0, react_1.useCallback)(function (_a) {
        var testimonial = _a.testimonial, _b = _a.index, index = _b === void 0 ? 0 : _b, _c = _a.featured, featured = _c === void 0 ? false : _c;
        return (<card_1.Card className={"h-full transition-all duration-300 hover:shadow-xl group border-0 shadow-lg ".concat(featured ?
                "ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-primary/10"
                : "bg-white")} style={{ animationDelay: "".concat(index * 100, "ms") }}>
        <card_1.CardHeader className="pb-4">
          {/* Quote icon */}
          <div className="flex justify-between items-start mb-4">
            <lucide_react_1.Quote className="w-8 h-8 text-primary/30"/>
            {testimonial.featured && (<badge_1.Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                Featured
              </badge_1.Badge>)}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: testimonial.rating }, function (_, i) { return (<lucide_react_1.Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400"/>); })}
            <span className="text-sm text-muted-foreground ml-2">
              {testimonial.rating}.0
            </span>
          </div>
        </card_1.CardHeader>

        <card_1.CardContent className="pt-0">
          {/* Testimonial text */}
          <blockquote className="text-muted-foreground leading-relaxed italic mb-6 text-base">
            &ldquo;{testimonial.text}&rdquo;
          </blockquote>

          {/* Author information */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {/* Placeholder for author image */}
                <span className="text-sm font-medium text-gray-600">
                  {testimonial.author.name
                .split(" ")
                .map(function (n) { return n[0]; })
                .join("")}
                </span>
              </div>
              {testimonial.author.verified && (<div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <lucide_react_1.CheckCircle className="w-3 h-3 text-white"/>
                </div>)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {testimonial.author.name}
                </h3>
                {testimonial.author.verified && (<badge_1.Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Verified
                  </badge_1.Badge>)}
              </div>

              <p className="text-sm text-muted-foreground mb-1">
                {testimonial.author.role}
                {testimonial.author.company && (<span> at {testimonial.author.company}</span>)}
              </p>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <lucide_react_1.MapPin className="w-3 h-3"/>
                <span>
                  {testimonial.author.location}, {testimonial.author.country}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction details */}
          {(testimonial.propertyType || testimonial.transactionValue) && (<div className="flex flex-wrap gap-2 mt-4">
              {testimonial.propertyType && (<badge_1.Badge variant="outline" className="text-xs">
                  <lucide_react_1.Building className="w-3 h-3 mr-1"/>
                  {testimonial.propertyType}
                </badge_1.Badge>)}
              {testimonial.transactionValue && (<badge_1.Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <lucide_react_1.TrendingUp className="w-3 h-3 mr-1"/>
                  {testimonial.transactionValue}
                </badge_1.Badge>)}
            </div>)}
        </card_1.CardContent>
      </card_1.Card>);
    }, []);
    // Grid variant
    if (variant === "grid") {
        return (<div className={"py-20 bg-gradient-to-br from-gray-50 to-gray-100/50 ".concat(className)}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              What Our African Clients Say
            </h2>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
              Trusted by property investors, developers, and professionals
              across Africa
            </p>
          </div>

          {/* Statistics */}
          {showStats && (<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto">
              {TESTIMONIAL_STATS.map(function (stat) { return (<div key={stat.label} className="text-center">
                  <div className={"inline-flex items-center justify-center w-12 h-12 rounded-full bg-white mb-3 shadow-sm ".concat(stat.color)}>
                    {stat.icon}
                  </div>
                  <div className={"text-2xl font-bold mb-1 ".concat(stat.color)}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </div>); })}
            </div>)}

          {/* Category filters */}
          {showFilters && (<div className="flex flex-wrap justify-center gap-2 mb-12">
              {CATEGORY_FILTERS.map(function (filter) { return (<button key={filter.id} type="button" onClick={function () { return handleCategoryChange(filter.id); }} className={"flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ".concat(selectedCategory === filter.id ?
                        "bg-primary text-primary-foreground shadow-md"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200")}>
                  {filter.icon}
                  {filter.label}
                </button>); })}
            </div>)}

          {/* Testimonials grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTestimonials.map(function (testimonial, index) {
                var _a;
                return (<TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} featured={(_a = testimonial.featured) !== null && _a !== void 0 ? _a : false}/>);
            })}
          </div>
        </div>
      </div>);
    }
    // Carousel variant (default)
    return (<div className={"py-20 bg-gradient-to-br from-gray-50 to-gray-100/50 ".concat(className)}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            What Our African Clients Say
          </h2>
          <p className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied clients who trust TripleCheck for their
            African property needs
          </p>
        </div>

        {/* Statistics */}
        {showStats && (<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto">
            {TESTIMONIAL_STATS.map(function (stat) { return (<div key={stat.label} className="text-center">
                <div className={"inline-flex items-center justify-center w-12 h-12 rounded-full bg-white mb-3 shadow-sm ".concat(stat.color)}>
                  {stat.icon}
                </div>
                <div className={"text-2xl font-bold mb-1 ".concat(stat.color)}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>); })}
          </div>)}

        {/* Carousel Container */}
        <div className="relative max-w-6xl mx-auto">
          {/* Navigation Buttons */}
          {totalSlides > 1 && (<>
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10">
                <button_1.Button variant="outline" size="icon" onClick={prevSlide} className="bg-white/90 border-gray-200 text-gray-600 hover:bg-white hover:border-primary hover:text-primary shadow-lg backdrop-blur-sm" aria-label="Previous testimonials">
                  <lucide_react_1.ChevronLeft className="w-5 h-5"/>
                </button_1.Button>
              </div>

              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10">
                <button_1.Button variant="outline" size="icon" onClick={nextSlide} className="bg-white/90 border-gray-200 text-gray-600 hover:bg-white hover:border-primary hover:text-primary shadow-lg backdrop-blur-sm" aria-label="Next testimonials">
                  <lucide_react_1.ChevronRight className="w-5 h-5"/>
                </button_1.Button>
              </div>
            </>)}

          {/* Testimonials Carousel */}
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: "translateX(-".concat(currentSlide * 100, "%)") }}>
              {Array.from({ length: totalSlides }, function (_, slideIndex) { return (<div key={slideIndex} className="w-full flex-shrink-0">
                  <div className={"grid gap-8 ".concat(itemsPerSlide === 2 ?
                "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1")}>
                    {filteredTestimonials
                .slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide)
                .map(function (testimonial, index) {
                var _a;
                return (<TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} featured={(_a = testimonial.featured) !== null && _a !== void 0 ? _a : false}/>);
            })}
                  </div>
                </div>); })}
            </div>
          </div>

          {/* Slide Indicators */}
          {totalSlides > 1 && (<div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalSlides }, function (_, index) { return (<button key={index} type="button" onClick={function () { return goToSlide(index); }} className={"w-3 h-3 rounded-full transition-all duration-300 ".concat(index === currentSlide ?
                    "bg-primary scale-125"
                    : "bg-gray-300 hover:bg-primary/60")} aria-label={"Go to testimonial slide ".concat(index + 1)}/>); })}
            </div>)}
        </div>

        {/* Trust indicator */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 rounded-full border border-green-200">
            <lucide_react_1.CheckCircle className="w-5 h-5 text-green-600"/>
            <span className="text-sm font-medium text-green-800">
              All testimonials from verified TripleCheck clients across Africa
            </span>
          </div>
        </div>
      </div>
    </div>);
}
