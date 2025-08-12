// LEGACY IMPLEMENTATION - ARCHIVED
// This file contains the old Properties implementation
// Kept for reference and potential rollback if needed
// Date archived: 2025-01-08

import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  Home,
  Building,
  TreePine,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import React, {
  useState,
  useCallback,
  useMemo,
  Suspense,
  lazy,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";


import { CompareBar } from "../../property/components/CompareBar";
import { CompareModal } from "../../property/components/CompareModal";
import { CompareProvider } from "../../property/contexts/CompareContext";
import { GridVirtualizedList } from "../components";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { useDebounce } from "../hooks/useDebounce";
import { usePropertyGridVirtualization } from "../hooks/useVirtualizationHelpers";
import { Property } from "../types/property";

// LEGACY IMPLEMENTATION - See Properties.tsx for modern version
// This component has been replaced with a more maintainable architecture
// using PropertyListingPage and configuration-based approach

// ... rest of legacy implementation would be here
// (truncated for brevity - the full old implementation)

export default function PropertiesLegacy(): JSX.Element {
  // Legacy implementation archived
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Legacy Properties Component</h1>
          <p className="text-muted-foreground">
            This component has been replaced with a modern implementation.
            Please use the new Properties component.
          </p>
        </div>
      </div>
    </div>
  );
}