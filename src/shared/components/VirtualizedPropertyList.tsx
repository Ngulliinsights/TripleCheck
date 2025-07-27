import React from 'react';
import { FixedSizeList as List } from 'react-window';
import ListingCard from '../../property/components/ListingCard';
import { Property } from '../types/property';

interface VirtualizedPropertyListProps {
  properties: Property[];
  height: number;
  itemHeight: number;
  onPropertyClick: (property: Property) => void;
}

const PropertyItem: React.FC<{
  index: number;
  style: React.CSSProperties;
  data: {
    properties: Property[];
    onPropertyClick: (property: Property) => void;
  };
}> = ({ index, style, data }) => {
  const property = data.properties[index];
  
  return (
    <div style={style} className="px-2 py-2">
      <ListingCard
        property={property}
        onClick={() => data.onPropertyClick(property)}
      />
    </div>
  );
};

export const VirtualizedPropertyList: React.FC<VirtualizedPropertyListProps> = ({
  properties,
  height,
  itemHeight,
  onPropertyClick,
}) => {
  return (
    <List
      height={height}
      itemCount={properties.length}
      itemSize={itemHeight}
      itemData={{ properties, onPropertyClick }}
    >
      {PropertyItem}
    </List>
  );
};