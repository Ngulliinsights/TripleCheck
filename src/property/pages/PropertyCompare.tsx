// PropertyCompare.tsx - Memory Optimized Version
// Implements: React.memo, useMemo, useCallback, lazy loading, and proper cleanup

import { Home, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import React from "react";

// Using basic img tag for simple image display
import type { CompareProperty } from "../../shared/types/compare";
import {
  formatCompareLocation,
  getComparePropertyTitle,
  comparePropertyValues,
  compareFeatureValues,
  normalizePropertyForComparison,
  getCompareUrlParams,
  updateCompareUrlParams,
} from "../../shared/utils/compare-utils";
import { CompareProvider, useCompare } from "../contexts/CompareContext";

// ------------------------------------------------------------------
// 1. Types and Interfaces
// ------------------------------------------------------------------
interface ComparisonResult {
  price: number | string;
  bedrooms: number | string;
  bathrooms: number | string;
  squareFeet: number | string;
  parking: number | string;
  yearBuilt: number | string;
}

// ------------------------------------------------------------------
// 2. Optimized Mock Data (moved outside component to prevent recreation)
// ------------------------------------------------------------------
const MOCK_PROPERTIES: CompareProperty[] = [
  {
    id: "1",
    title: "Modern Apartment in Westlands",
    price: 15000000,
    location: "Westlands, Nairobi",
    description:
      "A beautiful modern apartment with stunning city views and premium amenities.",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      parkingSpaces: 2,
      yearBuilt: 2020,
      amenities: ["Swimming Pool", "Gym", "Security", "Backup Generator"],
    },
    verificationStatus: "verified",
  },
  {
    id: "2",
    title: "Spacious Villa in Karen",
    price: 45000000,
    location: "Karen, Nairobi",
    description:
      "Luxury villa with large gardens and premium finishes throughout.",
    images: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    ],
    features: {
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 3500,
      parkingSpaces: 4,
      yearBuilt: 2018,
      amenities: [
        "Garden",
        "Swimming Pool",
        "Staff Quarters",
        "Solar Power",
        "CCTV",
      ],
    },
    verificationStatus: "verified",
  },
  {
    id: "3",
    title: "Cozy Townhouse in Kilimani",
    price: 8500000,
    location: "Kilimani, Nairobi",
    description:
      "Perfect starter home in a quiet neighborhood with good access to amenities.",
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
    ],
    features: {
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 900,
      parkingSpaces: 1,
      yearBuilt: 2015,
      amenities: ["Security", "Water Backup", "Fiber Internet"],
    },
    verificationStatus: "pending",
  },
];

// ------------------------------------------------------------------
// 3. Optimized Hooks
// ------------------------------------------------------------------
const useSyncUrl = (p1: string, p2: string, cb: (ids: string[]) => void) => {
  const stableCallback = React.useCallback(cb, [cb]);

  // Only sync from URL on mount
  React.useEffect(() => {
    const ids = getCompareUrlParams();
    if (ids.length) stableCallback(ids.slice(0, 2));
  }, [stableCallback]);

  // Update URL when selections change, but prevent infinite loops
  React.useEffect(() => {
    const ids = [p1, p2].filter(Boolean);
    if (ids.length > 0) {
      const currentIds = getCompareUrlParams();
      const idsChanged = ids.length !== currentIds.length || 
        ids.some((id, index) => id !== currentIds[index]);
      
      if (idsChanged) {
        updateCompareUrlParams(ids);
      }
    }
  }, [p1, p2]);
};

const useDerivedData = (
  a?: CompareProperty,
  b?: CompareProperty
): ComparisonResult | null =>
  React.useMemo(() => {
    if (!a || !b) return null;
    return {
      price: comparePropertyValues(a, b, "price"),
      bedrooms: compareFeatureValues(a, b, "bedrooms"),
      bathrooms: compareFeatureValues(a, b, "bathrooms"),
      squareFeet: compareFeatureValues(a, b, "squareFeet"),
      parking: compareFeatureValues(a, b, "parkingSpaces"),
      yearBuilt: compareFeatureValues(a, b, "yearBuilt"),
    };
  }, [a, b]);

// Optimized API simulation with proper cleanup
const useSafePropertiesQuery = () => {
  const [state, setState] = React.useState({
    data: null as CompareProperty[] | null,
    isLoading: true,
    error: null as string | null,
  });

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const fetchProperties = React.useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, 1000);
        signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          reject(new Error("Request cancelled"));
        });
      });

      if (signal.aborted) return;

      // Simulate occasional API failure for testing
      if (Math.random() < 0.1) throw new Error("Simulated API failure");

      setState({
        data: [...MOCK_PROPERTIES], // Shallow copy to prevent mutation
        isLoading: false,
        error: null,
      });
    } catch (err) {
      if (!signal.aborted) {
        setState({
          data: [],
          isLoading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  }, []);

  React.useEffect(() => {
    fetchProperties();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProperties]);

  const refetch = React.useCallback(() => {
    fetchProperties();
  }, [fetchProperties]);

  return {
    data: state.data ?? [],
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  };
};

// ------------------------------------------------------------------
// 4. Memoized UI Components
// ------------------------------------------------------------------
const Card = React.memo<{ children: React.ReactNode; className?: string }>(
  ({ children, className = "" }) => (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    >
      {children}
    </div>
  )
);
Card.displayName = "Card";

const CardHeader = React.memo<{
  children: React.ReactNode;
  className?: string;
}>(({ children, className = "" }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.memo<{
  children: React.ReactNode;
  className?: string;
}>(({ children, className = "" }) => (
  <h3
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
  >
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

const CardContent = React.memo<{
  children: React.ReactNode;
  className?: string;
}>(({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
));
CardContent.displayName = "CardContent";

const Button = React.memo<{
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}>(
  ({
    children,
    variant = "default",
    onClick,
    disabled = false,
    className = "",
  }) => {
    const base =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2";

    const variantClasses = React.useMemo(() => {
      return {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        outline:
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      };
    }, []);

    const selectedVariant = variantClasses[variant] || variantClasses.default;

    return (
      <button
        type="button"
        className={`${base} ${selectedVariant} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// Optimized Property Image Component using basic img tag
const PropertyImage = React.memo<{ src?: string; alt: string; width?: number; height?: number }>(
  ({ src, alt, width = 400, height = 300 }) => {
    if (!src) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <Home className="w-12 h-12 text-gray-400" />
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full object-cover"
        loading="lazy"
        useLandPlaceholder={false}
      />
    );
  }
);
PropertyImage.displayName = "PropertyImage";

// Memoized Select Component
const SelectWithLabel = React.memo<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: CompareProperty[];
  disabled?: string;
}>(({ id, label, value, onChange, options, disabled }) => {
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={handleChange}
        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Select property</option>
        {options.map((p) => (
          <option key={p.id} value={p.id} disabled={p.id === disabled}>
            {getComparePropertyTitle(p)} – {formatCompareLocation(p.location)}
          </option>
        ))}
      </select>
    </div>
  );
});
SelectWithLabel.displayName = "SelectWithLabel";

// ------------------------------------------------------------------
// 5. Memoized Presentational Components
// ------------------------------------------------------------------
const LoadingDisplay = React.memo(() => (
  <Card>
    <CardContent className="py-16 text-center">
      <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
      <h3 className="text-lg font-medium">Loading Properties</h3>
      <p className="text-gray-600">Please wait while we fetch data...</p>
    </CardContent>
  </Card>
));
LoadingDisplay.displayName = "LoadingDisplay";

const ErrorDisplay = React.memo<{ error: string; onRetry: () => void }>(
  ({ error, onRetry }) => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="py-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">
          Something went wrong
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </CardContent>
    </Card>
  )
);
ErrorDisplay.displayName = "ErrorDisplay";

const Header = React.memo<{ available: number }>(({ available }) => (
  <div className="text-center">
    <h1 className="text-3xl font-bold mb-4">Property Comparison</h1>
    <p className="text-gray-600">
      Compare properties side-by-side to make informed decisions
    </p>
    {available > 0 && (
      <p className="text-sm text-gray-500 mt-2">
        {available} properties available
      </p>
    )}
  </div>
));
Header.displayName = "Header";

const SelectionCard = React.memo<{
  properties: CompareProperty[];
  sel1: string;
  sel2: string;
  on1: (v: string) => void;
  on2: (v: string) => void;
  onClear: () => void;
}>(({ properties, sel1, sel2, on1, on2, onClear }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Home className="h-5 w-5" />
        Select Properties to Compare
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectWithLabel
          id="prop1"
          label="Property 1"
          value={sel1}
          onChange={on1}
          options={properties}
          disabled={sel2}
        />
        <SelectWithLabel
          id="prop2"
          label="Property 2"
          value={sel2}
          onChange={on2}
          options={properties}
          disabled={sel1}
        />
      </div>
      {(sel1 || sel2) && (
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {sel1 && sel2 ?
              "Both selected – comparison ready!"
            : "Pick another property"}
          </span>
          <Button variant="ghost" onClick={onClear}>
            Clear
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
));
SelectionCard.displayName = "SelectionCard";

const EmptyState = React.memo(() => (
  <Card className="border-dashed border-2 border-gray-300">
    <CardContent className="py-16 text-center">
      <Home className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium mb-2">
        Select Two Properties to Compare
      </h3>
      <p className="text-gray-600 mb-6">
        Choose properties from the dropdowns to see a side-by-side comparison.
      </p>
    </CardContent>
  </Card>
));
EmptyState.displayName = "EmptyState";

// ------------------------------------------------------------------
// 6. Main Component with Optimizations
// ------------------------------------------------------------------
const PropertyComparePageContent = React.memo(() => {
  const {
    data: properties,
    isLoading,
    error,
    refetch,
  } = useSafePropertiesQuery();
  const { selectedProperties, addToCompare, clearCompare } = useCompare();

  const [sel1, setSel1] = React.useState("");
  const [sel2, setSel2] = React.useState("");

  // Memoized handlers to prevent unnecessary re-renders
  const handleUrlSync = React.useCallback(
    (ids: string[]) => {
      // Only sync if the current selection is different
      const currentIds = selectedProperties.map(p => p.id);
      const needsSync = ids.length !== currentIds.length || 
        ids.some(id => !currentIds.includes(id));
      
      if (needsSync) {
        clearCompare();
        ids.forEach((i) => {
          const found = properties.find((p) => p.id === i);
          if (found) {
            const normalized = normalizePropertyForComparison(found);
            if (normalized) addToCompare(normalized);
          }
        });
      }
    },
    [properties, selectedProperties, clearCompare, addToCompare]
  );

  useSyncUrl(sel1, sel2, handleUrlSync);

  // Sync selected properties with local state - Fixed infinite loop
  React.useEffect(() => {
    if (selectedProperties[0] && selectedProperties[0].id !== sel1) {
      setSel1(selectedProperties[0].id);
    }
    if (selectedProperties[1] && selectedProperties[1].id !== sel2) {
      setSel2(selectedProperties[1].id);
    }
  }, [selectedProperties]);

  // Memoized property lookups
  const p1 = React.useMemo(
    () => properties.find((p) => p.id === sel1),
    [properties, sel1]
  );
  const p2 = React.useMemo(
    () => properties.find((p) => p.id === sel2),
    [properties, sel2]
  );

  const cmp = useDerivedData(p1, p2);

  // Memoized handlers
  const handle1 = React.useCallback((v: string) => setSel1(v), []);
  const handle2 = React.useCallback((v: string) => setSel2(v), []);
  const clear = React.useCallback(() => {
    setSel1("");
    setSel2("");
  }, []);

  // Render content based on state
  const renderContent = React.useMemo(() => {
    if (isLoading) return <LoadingDisplay />;
    if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
    if (!properties.length) {
      return (
        <Card>
          <CardContent className="py-16 text-center">
            <Home className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No Properties Available
            </h3>
            <p className="text-gray-600 mb-6">Check back later.</p>
            <Button onClick={refetch}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <SelectionCard
          properties={properties}
          sel1={sel1}
          sel2={sel2}
          on1={handle1}
          on2={handle2}
          onClear={clear}
        />
        {p1 && p2 && cmp ?
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Comparison Results</h2>
              <p className="text-gray-600">
                Detailed comparison between your selected properties
              </p>
            </div>
            {/* Comparison content would go here */}
          </div>
        : <EmptyState />}
      </>
    );
  }, [
    isLoading,
    error,
    properties,
    sel1,
    sel2,
    p1,
    p2,
    cmp,
    refetch,
    handle1,
    handle2,
    clear,
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Header available={properties.length} />
        {renderContent}
      </div>
    </div>
  );
});
PropertyComparePageContent.displayName = "PropertyComparePageContent";

// Main export with provider
export default function PropertyComparePage(): JSX.Element {
  return (
    <CompareProvider maxProperties={2}>
      <PropertyComparePageContent />
    </CompareProvider>
  );
}
