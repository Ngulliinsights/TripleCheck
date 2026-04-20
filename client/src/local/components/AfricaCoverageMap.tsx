import { MapPin, CheckCircle, Clock, Users } from "lucide-react";
import { memo, useState, useCallback, useRef, useEffect } from "react";

import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Country {
  readonly id: string;
  readonly name: string;
  readonly status: "active" | "coming-soon" | "planned";
  readonly properties: number;
  readonly users: number;
  /** [x%, y%] position on the map container */
  readonly coordinates: readonly [number, number];
}

interface AfricaCoverageMapProps {
  readonly variant?: "default" | "interactive";
  readonly showStats?: boolean;
  readonly onCountrySelect?: (countryId: string) => void;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const COVERED_COUNTRIES: readonly Country[] = [
  { id: "nigeria",      name: "Nigeria",      status: "active",       properties: 15420, users: 8900, coordinates: [45, 35] },
  { id: "kenya",        name: "Kenya",        status: "active",       properties: 8750,  users: 5200, coordinates: [65, 50] },
  { id: "south-africa", name: "South Africa", status: "active",       properties: 12300, users: 7100, coordinates: [55, 85] },
  { id: "ghana",        name: "Ghana",        status: "active",       properties: 4200,  users: 2800, coordinates: [40, 40] },
  { id: "uganda",       name: "Uganda",       status: "active",       properties: 3100,  users: 1900, coordinates: [62, 52] },
  { id: "tanzania",     name: "Tanzania",     status: "coming-soon",  properties: 0,     users: 0,    coordinates: [65, 60] },
  { id: "rwanda",       name: "Rwanda",       status: "coming-soon",  properties: 0,     users: 0,    coordinates: [60, 55] },
  { id: "ethiopia",     name: "Ethiopia",     status: "planned",      properties: 0,     users: 0,    coordinates: [68, 42] },
  { id: "morocco",      name: "Morocco",      status: "planned",      properties: 0,     users: 0,    coordinates: [42, 18] },
  { id: "egypt",        name: "Egypt",        status: "planned",      properties: 0,     users: 0,    coordinates: [58, 15] },
] as const;

const STATUS_CONFIG = {
  active:       { dot: "bg-green-500",  ring: "ring-green-200",  pulse: true  },
  "coming-soon":{ dot: "bg-yellow-500", ring: "ring-yellow-200", pulse: false },
  planned:      { dot: "bg-gray-400",   ring: "ring-gray-200",   pulse: false },
} as const;

const STATUS_LABEL: Record<Country["status"], string> = {
  active:        "Active",
  "coming-soon": "Coming Soon",
  planned:       "Planned",
};

// ---------------------------------------------------------------------------
// CountryMarker
//
// FIX: Previously rendered an HTML <button> as a direct child of <svg>, which
// is invalid HTML. SVG elements only accept SVG namespaced children.
// Solution: markers are now rendered in an absolutely-positioned overlay <div>
// that sits on top of the SVG and shares the same bounding box.
// ---------------------------------------------------------------------------

interface CountryMarkerProps {
  country: Country;
  isSelected: boolean;
  onClick: (id: string) => void;
}

const CountryMarker = memo<CountryMarkerProps>(({ country, isSelected, onClick }) => {
  const handleClick = useCallback(() => onClick(country.id), [country.id, onClick]);

  const cfg = STATUS_CONFIG[country.status];
  const [x, y] = country.coordinates;

  return (
    <button
      type="button"
      className={[
        "absolute -translate-x-1/2 -translate-y-1/2",
        "transition-transform duration-200 focus:outline-none",
        "hover:scale-125 focus-visible:scale-125",
        isSelected ? "scale-125 z-20" : "z-10",
      ].join(" ")}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={handleClick}
      aria-label={`${country.name} — ${STATUS_LABEL[country.status]}`}
      aria-pressed={isSelected ? 'true' : 'false'}
    >
      {/* Dot */}
      <span
        className={[
          "block w-4 h-4 rounded-full shadow-md",
          cfg.dot,
          "ring-4",
          cfg.ring,
          cfg.pulse ? "animate-pulse" : "",
        ].join(" ")}
      />

      {/* Tooltip — rendered only when selected */}
      {isSelected && (
        <div
          className="absolute top-6 left-1/2 -translate-x-1/2 z-30
                     bg-white border border-gray-200 rounded-xl shadow-xl
                     p-3 min-w-44 text-left"
          role="tooltip"
        >
          <p className="text-sm font-semibold text-gray-900 mb-1">{country.name}</p>
          <Badge
            variant={country.status === "active" ? "default" : "secondary"}
            className="text-xs mb-2"
          >
            {STATUS_LABEL[country.status]}
          </Badge>

          {country.status === "active" && (
            <ul className="space-y-1 text-xs text-gray-600 mt-1">
              <li className="flex items-center gap-1">
                <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                {country.properties.toLocaleString()} properties
              </li>
              <li className="flex items-center gap-1">
                <Users className="w-3 h-3 shrink-0" aria-hidden="true" />
                {country.users.toLocaleString()} users
              </li>
            </ul>
          )}
        </div>
      )}
    </button>
  );
});
CountryMarker.displayName = "CountryMarker";

// ---------------------------------------------------------------------------
// AfricaCoverageMap
// ---------------------------------------------------------------------------

export const AfricaCoverageMap = memo<AfricaCoverageMapProps>(
  ({ showStats = true, onCountrySelect }) => {
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close tooltip when clicking outside the map
    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setSelectedCountry(null);
        }
      };
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const handleCountryClick = useCallback(
      (countryId: string) => {
        setSelectedCountry((prev) => (prev === countryId ? null : countryId));
        onCountrySelect?.(countryId);
      },
      [onCountrySelect],
    );

    const activeCountries = COVERED_COUNTRIES.filter((c) => c.status === "active");
    const totalProperties = activeCountries.reduce((sum, c) => sum + c.properties, 0);
    const totalUsers = activeCountries.reduce((sum, c) => sum + c.users, 0);
    const comingSoonCount = COVERED_COUNTRIES.filter((c) => c.status === "coming-soon").length;

    return (
      <div className="space-y-8">
        {/* Map */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              Our Coverage Across Africa
            </CardTitle>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
              TripleCheck is expanding across Africa, bringing secure property
              verification to major markets. Click any marker to see coverage details.
            </p>
          </CardHeader>

          <CardContent className="p-8">
            {/*
              KEY FIX: The SVG provides the visual continent shape.
              An absolutely-positioned overlay div holds the interactive markers.
              Both share the same bounding box via `relative` + `absolute inset-0`.
            */}
            <div ref={containerRef} className="relative max-w-4xl mx-auto">
              {/* Africa outline — purely decorative */}
              <svg
                viewBox="0 0 100 100"
                className="w-full h-auto max-h-96 border border-gray-200 rounded-xl bg-linear-to-br from-blue-50 to-green-50"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M20 15 Q25 10 35 12 Q45 8 55 10 Q65 12 75 18
                     Q80 25 78 35 Q75 45 70 55 Q65 65 60 75
                     Q55 85 50 90 Q45 92 40 90 Q35 88 30 85
                     Q25 80 22 70 Q18 60 15 50 Q12 40 15 30
                     Q18 20 20 15 Z"
                  fill="#f8fafc"
                  stroke="#e2e8f0"
                  strokeWidth="0.5"
                />
              </svg>

              {/* Interactive marker overlay — valid HTML, not inside <svg> */}
              <div
                className="absolute inset-0"
                role="group"
                aria-label="Country coverage markers"
              >
                {COVERED_COUNTRIES.map((country) => (
                  <CountryMarker
                    key={country.id}
                    country={country}
                    isSelected={selectedCountry === country.id}
                    onClick={handleCountryClick}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <CheckCircle className="w-8 h-8 text-green-600" />,
                value: activeCountries.length,
                label: "Active Markets",
                bg: "from-green-50 to-green-100/50",
                text: "text-green-700",
                sub: "text-green-600",
              },
              {
                icon: <MapPin className="w-8 h-8 text-blue-600" />,
                value: totalProperties.toLocaleString(),
                label: "Verified Properties",
                bg: "from-blue-50 to-blue-100/50",
                text: "text-blue-700",
                sub: "text-blue-600",
              },
              {
                icon: <Users className="w-8 h-8 text-purple-600" />,
                value: totalUsers.toLocaleString(),
                label: "Trusted Users",
                bg: "from-purple-50 to-purple-100/50",
                text: "text-purple-700",
                sub: "text-purple-600",
              },
              {
                icon: <Clock className="w-8 h-8 text-yellow-600" />,
                value: comingSoonCount,
                label: "Coming Soon",
                bg: "from-yellow-50 to-yellow-100/50",
                text: "text-yellow-700",
                sub: "text-yellow-600",
              },
            ].map(({ icon, value, label, bg, text, sub }) => (
              <Card
                key={label}
                className={`text-center border-0 shadow-sm bg-linear-to-br ${bg}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-3">{icon}</div>
                  <div className={`text-2xl font-bold ${text} mb-1`}>{value}</div>
                  <div className={`text-sm font-medium ${sub}`}>{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Legend */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div
              className="flex flex-wrap items-center justify-center gap-6"
              role="list"
              aria-label="Map legend"
            >
              {[
                { color: "bg-green-500", pulse: true,  label: "Active Markets" },
                { color: "bg-yellow-500", pulse: false, label: "Coming Soon"   },
                { color: "bg-gray-400",   pulse: false, label: "Planned"       },
              ].map(({ color, pulse, label }) => (
                <div key={label} className="flex items-center gap-2" role="listitem">
                  <span
                    className={`w-3 h-3 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
);
AfricaCoverageMap.displayName = "AfricaCoverageMap";