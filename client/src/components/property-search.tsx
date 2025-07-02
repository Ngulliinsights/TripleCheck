import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Home, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertySearchProps {
  onSearch: (query: string) => void;
}

export default function PropertySearch({ onSearch }: PropertySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");

  const handleSearch = () => {
    const searchParams = [];
    if (searchQuery) searchParams.push(searchQuery);
    if (location) searchParams.push(location);
    if (propertyType) searchParams.push(propertyType);
    if (priceRange) searchParams.push(priceRange);

    const finalQuery = searchParams.join(' ');
    onSearch(finalQuery);
  };