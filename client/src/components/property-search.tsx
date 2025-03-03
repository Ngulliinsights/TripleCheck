import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Property } from "@shared/schema";

export default function PropertySearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties", search],
    enabled: search.length > 0
  });

  const filteredProperties = properties?.filter(property =>
    property.title.toLowerCase().includes(search.toLowerCase()) ||
    property.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search properties by location or title..."
              className="w-full pl-10 pr-4"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search properties..." />
            <CommandList>
              <CommandEmpty>No properties found.</CommandEmpty>
              <CommandGroup heading="Properties">
                {filteredProperties?.map((property) => (
                  <CommandItem
                    key={property.id}
                    onSelect={() => {
                      setLocation(`/property/${property.id}`);
                      setOpen(false);
                    }}
                    className="flex items-start gap-2 p-2"
                  >
                    <img
                      src={property.imageUrls[0]}
                      alt={property.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{property.title}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {property.location}
                      </div>
                      <p className="text-sm font-medium">
                        KES {property.price.toLocaleString()}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <div className="flex gap-2 mt-2 justify-center">
        <Button variant="outline" size="sm">
          Popular Locations
        </Button>
        <Button variant="outline" size="sm">
          Price Range
        </Button>
        <Button variant="outline" size="sm">
          Property Type
        </Button>
      </div>
    </div>
  );
}
