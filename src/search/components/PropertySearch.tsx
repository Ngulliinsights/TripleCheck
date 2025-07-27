import React, { useState } from 'react';
import { Button } from '../../shared/components/ui/button';
import { Search } from 'lucide-react';

interface PropertySearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PropertySearch({ 
  onSearch, 
  placeholder = "Search properties...",
  className = ""
}: PropertySearchProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <Button type="submit" className="px-6">
        Search
      </Button>
    </form>
  );
}