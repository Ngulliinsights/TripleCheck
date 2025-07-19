import React from 'react';

interface PropertySearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function PropertySearch({ onSearch, placeholder = "Search properties..." }: PropertySearchProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        onChange={(e) => onSearch?.(e.target.value)}
      />
    </div>
  );
}