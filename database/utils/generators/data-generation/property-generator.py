#!/usr/bin/env python3
"""
TripleCheck Property Details Generation Script
Based on Prompt 1: Property Details Generation

This script generates realistic property data for training fraud detection models.
Includes legitimate properties and suspicious patterns for comprehensive training.
"""

import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import json
import uuid

class PropertyDataGenerator:
    def __init__(self):
        # Kenya-specific location data
        self.locations = {
            'Nairobi': {
                'areas': ['Kilimani', 'Karen', 'Westlands', 'Runda', 'Lavington', 'Kileleshwa', 'Parklands', 'Upperhill'],
                'price_multiplier': 1.0,
                'zip_codes': ['00100', '00200', '00300', '00400', '00500']
            },
            'Mombasa': {
                'areas': ['Nyali', 'Bamburi', 'Diani', 'Mtwapa', 'Tudor', 'Changamwe'],
                'price_multiplier': 0.7,
                'zip_codes': ['80100', '80200', '80300', '80400']
            },
            'Kisumu': {
                'areas': ['Milimani', 'Tom Mboya', 'Kondele', 'Mamboleo', 'Nyamasaria'],
                'price_multiplier': 0.4,
                'zip_codes': ['40100', '40200', '40300']
            },
            'Nakuru': {
                'areas': ['Milimani', 'Section 58', 'Flamingo', 'Bondeni', 'Kaptembwo'],
                'price_multiplier': 0.35,
                'zip_codes': ['20100', '20200', '20300']
            }
        }
        
        self.property_types = {
            'apartment': {'weight': 0.4, 'base_price': 15000000, 'sqft_range': (500, 2000)},
            'house': {'weight': 0.35, 'base_price': 25000000, 'sqft_range': (1000, 5000)},
            'condo': {'weight': 0.15, 'base_price': 20000000, 'sqft_range': (800, 2500)},
            'townhouse': {'weight': 0.08, 'base_price': 18000000, 'sqft_range': (1200, 3000)},
            'studio': {'weight': 0.02, 'base_price': 8000000, 'sqft_range': (300, 800)}
        }
        
        self.amenities = [
            'Swimming Pool', 'Gym', 'Security', 'Backup Generator', 'Garden',
            'Staff Quarters', 'Borehole', 'Solar Panels', 'CCTV', 'Intercom',
            'Parking', 'Balcony', 'Terrace', 'Study Room', 'Laundry Area',
            'Modern Kitchen', 'Master En-suite', 'Walk-in Closet', 'Fireplace'
        ]
        
        # Seasonal price adjustments (Kenya has two main seasons)
        self.seasonal_adjustments = {
            'dry_season': 1.05,  # Higher demand (Dec-Mar, Jun-Oct)
            'rainy_season': 0.95  # Lower demand (Apr-May, Nov)
        }

    def generate_property_id(self) -> str:
        """Generate unique property ID"""
        return f"PROP_{uuid.uuid4().hex[:8].upper()}"

    def get_seasonal_adjustment(self, date: datetime) -> float:
        """Get seasonal price adjustment based on date"""
        month = date.month
        if month in [12, 1, 2, 3, 6, 7, 8, 9, 10]:
            return self.seasonal_adjustments['dry_season']
        else:
            return self.seasonal_adjustments['rainy_season']

    def generate_realistic_price(self, property_type: str, location: str, 
                               sqft: int, year_built: int, date: datetime,
                               is_suspicious: bool = False) -> int:
        """Generate realistic property price with market factors"""
        base_price = self.property_types[property_type]['base_price']
        location_multiplier = self.locations[location]['price_multiplier']
        
        # Square footage adjustment
        sqft_adjustment = sqft / 1500  # Normalize to 1500 sqft
        
        # Age adjustment (newer properties cost more)
        current_year = datetime.now().year
        age_factor = max(0.7, 1 - (current_year - year_built) * 0.01)
        
        # Seasonal adjustment
        seasonal_factor = self.get_seasonal_adjustment(date)
        
        # Market trend (slight appreciation over time)
        years_since_2020 = max(0, date.year - 2020)
        trend_factor = 1 + (years_since_2020 * 0.05)
        
        # Calculate base price
        price = base_price * location_multiplier * sqft_adjustment * age_factor * seasonal_factor * trend_factor
        
        # Add random variation (±15%)
        variation = random.uniform(0.85, 1.15)
        price *= variation
        
        # Introduce suspicious pricing patterns
        if is_suspicious:
            suspicious_type = random.choice(['underpriced', 'overpriced', 'round_number'])
            if suspicious_type == 'underpriced':
                price *= random.uniform(0.3, 0.6)  # Significantly underpriced
            elif suspicious_type == 'overpriced':
                price *= random.uniform(1.8, 2.5)  # Significantly overpriced
            elif suspicious_type == 'round_number':
                # Suspiciously round numbers
                price = round(price / 1000000) * 1000000
        
        return int(price)

    def generate_property_features(self, property_type: str, sqft: int) -> Dict:
        """Generate realistic property features based on type and size"""
        if property_type == 'studio':
            bedrooms = 0
            bathrooms = 1
        elif property_type == 'apartment':
            if sqft < 800:
                bedrooms = random.choice([1, 2])
                bathrooms = random.choice([1, 2])
            elif sqft < 1500:
                bedrooms = random.choice([2, 3])
                bathrooms = random.choice([2, 3])
            else:
                bedrooms = random.choice([3, 4])
                bathrooms = random.choice([2, 3, 4])
        else:  # house, condo, townhouse
            if sqft < 1500:
                bedrooms = random.choice([2, 3])
                bathrooms = random.choice([2, 3])
            elif sqft < 3000:
                bedrooms = random.choice([3, 4])
                bathrooms = random.choice([3, 4])
            else:
                bedrooms = random.choice([4, 5, 6])
                bathrooms = random.choice([3, 4, 5])
        
        # Generate amenities based on property type and price range
        num_amenities = random.randint(3, 8)
        selected_amenities = random.sample(self.amenities, num_amenities)
        
        # Parking spaces
        if property_type in ['house', 'townhouse']:
            parking_spaces = random.randint(1, 4)
        else:
            parking_spaces = random.randint(0, 2)
        
        return {
            'bedrooms': bedrooms,
            'bathrooms': bathrooms,
            'squareFeet': sqft,
            'parkingSpaces': parking_spaces,
            'amenities': selected_amenities,
            'petFriendly': random.choice([True, False]),
            'furnished': random.choice([True, False]),
            'propertyType': property_type
        }

    def generate_single_property(self, is_suspicious: bool = False) -> Dict:
        """Generate a single property record"""
        # Select property type based on weights
        property_type = random.choices(
            list(self.property_types.keys()),
            weights=[self.property_types[pt]['weight'] for pt in self.property_types.keys()]
        )[0]
        
        # Select location
        city = random.choice(list(self.locations.keys()))
        area = random.choice(self.locations[city]['areas'])
        zip_code = random.choice(self.locations[city]['zip_codes'])
        
        # Generate square footage
        sqft_range = self.property_types[property_type]['sqft_range']
        sqft = random.randint(sqft_range[0], sqft_range[1])
        
        # Generate year built (last 50 years, with bias toward recent)
        current_year = datetime.now().year
        year_built = random.choices(
            range(current_year - 50, current_year + 1),
            weights=[i**2 for i in range(1, 52)]  # Quadratic weight favoring recent years
        )[0]
        
        # Generate last sale date (within last 5 years)
        start_date = datetime.now() - timedelta(days=5*365)
        end_date = datetime.now()
        last_sale_date = start_date + timedelta(
            days=random.randint(0, (end_date - start_date).days)
        )
        
        # Generate price
        price = self.generate_realistic_price(
            property_type, city, sqft, year_built, last_sale_date, is_suspicious
        )
        
        # Generate features
        features = self.generate_property_features(property_type, sqft)
        features['yearBuilt'] = year_built
        
        # Generate property record
        property_record = {
            'id': self.generate_property_id(),
            'title': f"{features['bedrooms']}-Bedroom {property_type.title()} in {area}",
            'description': f"Beautiful {property_type} located in {area}, {city}. Features {features['bedrooms']} bedrooms and {features['bathrooms']} bathrooms.",
            'location': f"{area}, {city}",
            'zipCode': zip_code,
            'city': city,
            'price': price,
            'squareFeet': sqft,
            'propertyType': property_type,
            'yearBuilt': year_built,
            'lastSaleDate': last_sale_date.isoformat(),
            'features': features,
            'imageUrls': [
                f"https://images.unsplash.com/photo-{random.randint(1500000000000, 1700000000000)}?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
            ],
            'isSuspicious': is_suspicious,
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        return property_record

    def generate_dataset(self, total_records: int = 100000, suspicious_rate: float = 0.025) -> List[Dict]:
        """Generate complete property dataset"""
        print(f"🏠 Generating {total_records:,} property records...")
        print(f"📊 Suspicious properties: {suspicious_rate*100:.1f}%")
        
        properties = []
        suspicious_count = int(total_records * suspicious_rate)
        
        # Generate suspicious properties
        for i in range(suspicious_count):
            if i % 1000 == 0:
                print(f"   Generated {i:,} suspicious properties...")
            properties.append(self.generate_single_property(is_suspicious=True))
        
        # Generate legitimate properties
        for i in range(total_records - suspicious_count):
            if i % 5000 == 0:
                print(f"   Generated {i:,} legitimate properties...")
            properties.append(self.generate_single_property(is_suspicious=False))
        
        # Shuffle the dataset
        random.shuffle(properties)
        
        print(f"✅ Generated {len(properties):,} total properties")
        return properties

    def save_dataset(self, properties: List[Dict], filename: str = "property_dataset.json"):
        """Save dataset to JSON file"""
        with open(filename, 'w') as f:
            json.dump(properties, f, indent=2, default=str)
        print(f"💾 Dataset saved to {filename}")

    def generate_statistics(self, properties: List[Dict]) -> Dict:
        """Generate dataset statistics"""
        df = pd.DataFrame(properties)
        
        stats = {
            'total_properties': len(properties),
            'suspicious_properties': len(df[df['isSuspicious'] == True]),
            'property_types': df['propertyType'].value_counts().to_dict(),
            'cities': df['city'].value_counts().to_dict(),
            'price_statistics': {
                'mean': float(df['price'].mean()),
                'median': float(df['price'].median()),
                'min': float(df['price'].min()),
                'max': float(df['price'].max()),
                'std': float(df['price'].std())
            },
            'sqft_statistics': {
                'mean': float(df['squareFeet'].mean()),
                'median': float(df['squareFeet'].median()),
                'min': float(df['squareFeet'].min()),
                'max': float(df['squareFeet'].max())
            }
        }
        
        return stats

def main():
    """Main execution function"""
    print("🚀 Starting TripleCheck Property Data Generation")
    
    # Initialize generator
    generator = PropertyDataGenerator()
    
    # Generate dataset
    properties = generator.generate_dataset(total_records=10000, suspicious_rate=0.03)  # Start with 10k for testing
    
    # Save dataset
    generator.save_dataset(properties, "scripts/data-generation/property_dataset.json")
    
    # Generate and save statistics
    stats = generator.generate_statistics(properties)
    with open("scripts/data-generation/property_statistics.json", 'w') as f:
        json.dump(stats, f, indent=2, default=str)
    
    print("\n📊 Dataset Statistics:")
    print(f"Total Properties: {stats['total_properties']:,}")
    print(f"Suspicious Properties: {stats['suspicious_properties']:,} ({stats['suspicious_properties']/stats['total_properties']*100:.1f}%)")
    print(f"Average Price: KES {stats['price_statistics']['mean']:,.0f}")
    print(f"Price Range: KES {stats['price_statistics']['min']:,.0f} - KES {stats['price_statistics']['max']:,.0f}")
    
    print("\n🎉 Property data generation completed successfully!")

if __name__ == "__main__":
    main()