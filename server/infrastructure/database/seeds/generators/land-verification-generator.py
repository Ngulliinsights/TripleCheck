#!/usr/bin/env python3
"""
Optimized Kenya Land Verification Data Generator
==============================================

Enhanced version with improved performance, data quality, and extensibility.
Generates comprehensive land verification data for TripleCheck Kenya
including title deeds, ownership histories, government records, and fraud patterns.

Key Improvements:
- Enhanced data realism with weighted distributions
- Improved performance through optimized data structures
- Better fraud pattern sophistication
- Enhanced geographic accuracy
- Comprehensive validation and error handling
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from faker import Faker
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
import argparse
import os
from dataclasses import dataclass, asdict
from collections import defaultdict
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib

# Configure logging for better debugging and monitoring
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Faker with supported locales for more realistic data
# Note: en_KE and sw_KE are not supported, using en_US with custom Kenya data
fake = Faker(['en_US'])

@dataclass
class CoordinateBounds:
    """Data class for geographic coordinate boundaries"""
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float

@dataclass
class LandRecord:
    """Structured data class for land records - improves type safety and validation"""
    verification_id: str
    title_deed_number: str
    owner_name: str
    owner_id_number: str
    county: str
    is_fraudulent: bool = False
    risk_score: int = 0
    created_at: str = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()

class OptimizedKenyaLandDataGenerator:
    """
    Enhanced land data generator with improved algorithms and data quality.
    
    This class demonstrates several optimization principles:
    1. Weighted probability distributions for more realistic data
    2. Cached computations to avoid repetitive calculations
    3. Batch processing capabilities for large datasets
    4. Enhanced validation and error handling
    """
    
    def __init__(self, seed: Optional[int] = None):
        # Set random seed for reproducibility - crucial for testing and validation
        if seed:
            random.seed(seed)
            np.random.seed(seed)
            fake.seed_instance(seed)
        
        # Enhanced county data with population weights for more realistic distribution
        self.county_data = {
            'Nairobi': {'weight': 0.15, 'urbanization': 0.95, 'avg_value_multiplier': 3.0},
            'Kiambu': {'weight': 0.08, 'urbanization': 0.65, 'avg_value_multiplier': 2.0},
            'Nakuru': {'weight': 0.07, 'urbanization': 0.45, 'avg_value_multiplier': 1.3},
            'Machakos': {'weight': 0.06, 'urbanization': 0.35, 'avg_value_multiplier': 1.2},
            'Mombasa': {'weight': 0.05, 'urbanization': 0.90, 'avg_value_multiplier': 2.5},
            'Uasin Gishu': {'weight': 0.04, 'urbanization': 0.40, 'avg_value_multiplier': 1.1},
            # Adding remaining counties with lower weights
            'Kajiado': {'weight': 0.03, 'urbanization': 0.30, 'avg_value_multiplier': 1.4},
            'Murang\'a': {'weight': 0.03, 'urbanization': 0.25, 'avg_value_multiplier': 1.0},
            'Nyeri': {'weight': 0.03, 'urbanization': 0.35, 'avg_value_multiplier': 1.1},
            'Kirinyaga': {'weight': 0.02, 'urbanization': 0.20, 'avg_value_multiplier': 0.9},
        }
        
        # Add remaining counties with default weights
        remaining_counties = [
            'Nyandarua', 'Laikipia', 'Narok', 'Kericho', 'Bomet', 'Kakamega',
            'Vihiga', 'Bungoma', 'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori',
            'Kisii', 'Nyamira', 'Trans Nzoia', 'Elgeyo-Marakwet',
            'Nandi', 'Baringo', 'West Pokot', 'Samburu', 'Turkana', 'Marsabit',
            'Isiolo', 'Meru', 'Tharaka-Nithi', 'Embu', 'Kitui', 'Makueni',
            'Taita-Taveta', 'Lamu', 'Tana River', 'Garissa', 'Wajir',
            'Mandera', 'Kwale', 'Kilifi'
        ]
        
        for county in remaining_counties:
            if county not in self.county_data:
                self.county_data[county] = {
                    'weight': 0.01, 
                    'urbanization': 0.15, 
                    'avg_value_multiplier': 0.8
                }
        
        # Weighted land use types based on Kenya's land use patterns
        self.land_use_weights = {
            'Agricultural': 0.65,    # Majority of Kenya's land
            'Residential': 0.15,     # Urban and rural residential
            'Commercial': 0.08,      # Business and commercial
            'Mixed': 0.05,           # Mixed-use developments
            'Government': 0.03,      # Government facilities
            'Industrial': 0.02,      # Manufacturing and industry
            'Educational': 0.01,     # Schools and universities
            'Religious': 0.005,      # Churches, mosques, etc.
            'Recreational': 0.003,   # Parks and recreation
            'Conservation': 0.002    # Wildlife and conservation
        }
        
        # Enhanced transfer methods with realistic probabilities
        self.transfer_method_weights = {
            'Sale': 0.45,                    # Most common
            'Inheritance': 0.25,             # Very common in Kenya
            'Government Allocation': 0.12,   # Government land distribution
            'Succession': 0.08,              # Legal succession cases
            'Gift': 0.05,                    # Family transfers
            'Court Order': 0.02,             # Legal disputes
            'Partition': 0.015,              # Property division
            'Exchange': 0.01,                # Property swaps
            'Mortgage Foreclosure': 0.005,   # Bank repossessions
            'Compulsory Acquisition': 0.003  # Government acquisition
        }
        
        # Sophisticated fraud patterns with varying complexity
        self.fraud_patterns = {
            'document_forgery': {
                'weight': 0.30,
                'sophistication': 'medium',
                'detection_difficulty': 0.7
            },
            'identity_theft': {
                'weight': 0.20,
                'sophistication': 'high',
                'detection_difficulty': 0.8
            },
            'boundary_manipulation': {
                'weight': 0.15,
                'sophistication': 'low',
                'detection_difficulty': 0.4
            },
            'double_allocation': {
                'weight': 0.12,
                'sophistication': 'high',
                'detection_difficulty': 0.9
            },
            'inheritance_exploitation': {
                'weight': 0.10,
                'sophistication': 'medium',
                'detection_difficulty': 0.6
            },
            'government_corruption': {
                'weight': 0.08,
                'sophistication': 'high',
                'detection_difficulty': 0.95
            },
            'beacon_tampering': {
                'weight': 0.03,
                'sophistication': 'low',
                'detection_difficulty': 0.3
            },
            'fake_succession': {
                'weight': 0.02,
                'sophistication': 'medium',
                'detection_difficulty': 0.7
            }
        }
        
        # More diverse and authentic Kenyan names from different ethnic groups
        self.kenyan_names = [
            # Kikuyu names
            'John Kamau', 'Mary Wanjiku', 'Peter Maina', 'Grace Njeri', 'James Kimani',
            'Ann Wanjiru', 'Samuel Karanja', 'Ruth Wambui', 'David Muchiri', 'Jane Nyambura',
            
            # Luo names  
            'Daniel Ochieng', 'Esther Achieng', 'Paul Otieno', 'Catherine Adhiambo', 
            'Michael Ouma', 'Margaret Awuor', 'Joseph Okello', 'Sarah Akoth',
            
            # Kalenjin names
            'David Kiprotich', 'Lucy Chebet', 'Francis Kiplagat', 'Nancy Jepkoech',
            'Samuel Kiptoo', 'Rose Chepkemoi', 'Philip Ruto', 'Mercy Jebet',
            
            # Luhya names
            'Robert Wekesa', 'Alice Nekesa', 'Patrick Wafula', 'Susan Nafula',
            'George Wanyama', 'Joyce Naliaka', 'Vincent Barasa', 'Beatrice Nanjala',
            
            # Kamba names
            'Peter Makau', 'Jane Mwende', 'Joseph Mutua', 'Lucy Kavuki',
            'Francis Kioko', 'Agnes Ndunge', 'Stephen Musyoka', 'Rose Nduku',
            
            # Coastal names
            'Ali Hassan', 'Fatuma Mohammed', 'Omar Abdalla', 'Zeinab Ali',
            'Hassan Omar', 'Mariam Said', 'Rashid Salim', 'Khadija Ahmed'
        ]
        
        # Enhanced GPS coordinate bounds with more precise regional data
        self.kenya_bounds = CoordinateBounds(
            lat_min=-4.8, lat_max=5.0,
            lon_min=33.9, lon_max=41.9
        )
        
        # Regional coordinate refinements for better geographic accuracy
        self.regional_bounds = {
            'Nairobi': CoordinateBounds(-1.45, -1.15, 36.6, 37.1),
            'Mombasa': CoordinateBounds(-4.2, -3.9, 39.5, 39.8),
            'Kisumu': CoordinateBounds(-0.2, 0.2, 34.6, 35.0),
            'Nakuru': CoordinateBounds(-0.5, -0.1, 35.9, 36.3),
            'Eldoret': CoordinateBounds(0.4, 0.7, 35.1, 35.4)
        }
        
        # Cache for expensive computations
        self._coordinate_cache = {}
        self._name_cache = set()
        
        logger.info("Optimized Kenya Land Data Generator initialized successfully")

    def _weighted_choice(self, choices: Dict[str, float]) -> str:
        """
        Efficient weighted random selection using cumulative distribution.
        This replaces multiple random.choice() calls with a single optimized selection.
        """
        # Convert to lists for faster access
        items = list(choices.keys())
        weights = list(choices.values())
        
        # Normalize weights to sum to 1
        total_weight = sum(weights)
        if total_weight > 0:
            weights = [w / total_weight for w in weights]
        else:
            weights = [1.0 / len(weights)] * len(weights)
        
        # Use numpy for efficient weighted selection
        return np.random.choice(items, p=weights)

    def generate_title_deed_number(self, county: str) -> str:
        """
        Generate more realistic title deed numbers based on county patterns.
        Each county has specific prefixes and numbering systems.
        """
        # County-specific prefixes for authenticity
        county_prefixes = {
            'Nairobi': ['NRB', 'NBI', 'NAI'],
            'Kiambu': ['KBU', 'KIA', 'KMB'],
            'Machakos': ['MCH', 'MAC', 'MKS'],
            'Kajiado': ['KJD', 'KAJ', 'KJO'],
            'Mombasa': ['MSA', 'MOM', 'MBA'],
            'Nakuru': ['NKR', 'NAK', 'NKU'],
            'Kisumu': ['KSM', 'KIS', 'KSU']
        }
        
        # Use specific prefix if available, otherwise generate generic one
        if county in county_prefixes:
            prefix = random.choice(county_prefixes[county])
        else:
            # Generate prefix from county name
            prefix = county[:3].upper()
        
        # More sophisticated numbering system
        block_number = random.randint(1, 999)
        plot_number = random.randint(1, 9999)
        
        # Add optional sub-division for urban areas
        if self.county_data.get(county, {}).get('urbanization', 0) > 0.5:
            subdivision = random.choice(['', f"/{random.randint(1, 20)}"])
        else:
            subdivision = ''
        
        return f"{prefix}/{block_number}/{plot_number}{subdivision}"

    def generate_enhanced_coordinates(self, county: str) -> Dict[str, float]:
        """
        Generate GPS coordinates with improved geographic accuracy.
        Uses regional bounds when available for better realism.
        """
        # Use cached coordinates if available
        cache_key = f"{county}_{random.randint(1, 100)}"
        if cache_key in self._coordinate_cache:
            return self._coordinate_cache[cache_key]
        
        # Use regional bounds if available, otherwise use general Kenya bounds
        if county in self.regional_bounds:
            bounds = self.regional_bounds[county]
        else:
            bounds = self.kenya_bounds
        
        coordinates = {
            'latitude': round(random.uniform(bounds.lat_min, bounds.lat_max), 6),
            'longitude': round(random.uniform(bounds.lon_min, bounds.lon_max), 6)
        }
        
        # Cache the result for potential reuse
        self._coordinate_cache[cache_key] = coordinates
        
        return coordinates

    def generate_sophisticated_boundary_points(self, center_lat: float, center_lon: float, 
                                             land_size: float, num_points: int = None) -> List[Dict[str, Any]]:
        """
        Generate more realistic boundary points based on land size and topography.
        Larger properties have more boundary points and varied beacon types.
        """
        # Determine number of points based on land size
        if num_points is None:
            if land_size < 1:
                num_points = 4  # Small plots
            elif land_size < 10:
                num_points = random.randint(4, 6)  # Medium plots
            else:
                num_points = random.randint(6, 12)  # Large properties
        
        points = []
        # Radius calculation based on land size (approximate)
        radius = np.sqrt(land_size * 4047) / 111320  # Convert acres to degrees approximately
        
        # Generate points in a more realistic pattern (not perfect circle)
        for i in range(num_points):
            base_angle = (2 * np.pi * i) / num_points
            # Add some randomness to make boundaries more natural
            angle_variation = random.uniform(-0.3, 0.3)
            radius_variation = random.uniform(0.7, 1.3)
            
            angle = base_angle + angle_variation
            actual_radius = radius * radius_variation
            
            lat_offset = actual_radius * np.cos(angle)
            lon_offset = actual_radius * np.sin(angle)
            
            # Beacon type selection based on property value and location
            beacon_weights = {
                'concrete': 0.4,
                'stone': 0.3,
                'iron': 0.2,
                'wooden': 0.1
            }
            
            condition_weights = {
                'good': 0.6,
                'fair': 0.25,
                'poor': 0.12,
                'missing': 0.03
            }
            
            points.append({
                'point_id': f"BP_{i+1:02d}",
                'latitude': round(center_lat + lat_offset, 6),
                'longitude': round(center_lon + lon_offset, 6),
                'beacon_type': self._weighted_choice(beacon_weights),
                'beacon_condition': self._weighted_choice(condition_weights),
                'survey_date': (datetime.now() - timedelta(days=random.randint(30, 1825))).isoformat(),
                'surveyor_name': random.choice(self.kenyan_names)
            })
        
        return points

    def generate_realistic_ownership_history(self, current_owner: str, land_value: int, 
                                           county: str) -> List[Dict[str, Any]]:
        """
        Generate more sophisticated ownership history with realistic patterns.
        Considers economic factors, family relationships, and historical context.
        """
        history = []
        
        # Determine number of transfers based on land value and county urbanization
        urbanization = self.county_data.get(county, {}).get('urbanization', 0.2)
        base_transfers = 1 if urbanization < 0.3 else random.randint(1, 4)
        num_transfers = min(base_transfers + random.randint(0, 2), 8)
        
        current_date = datetime.now()
        previous_owner = self._generate_contextual_name(current_owner)
        
        for i in range(num_transfers):
            # More realistic time gaps between transfers
            if i == 0:
                days_back = random.randint(365, 7300)  # 1-20 years for first transfer
            else:
                days_back = random.randint(30, 3650)   # Subsequent transfers
            
            transfer_date = current_date - timedelta(days=days_back)
            
            # Select transfer method based on context
            if i == 0 and random.random() < 0.3:
                transfer_method = 'Government Allocation'
                from_owner = 'Kenya Government'
                consideration = None
            else:
                transfer_method = self._weighted_choice(self.transfer_method_weights)
                from_owner = previous_owner
                
                # Calculate realistic consideration based on transfer method and date
                if transfer_method in ['Sale', 'Exchange']:
                    # Adjust for inflation and market changes over time
                    years_ago = (current_date - transfer_date).days / 365.25
                    inflation_factor = (1.05 ** years_ago)  # 5% annual inflation approximation
                    consideration = int(land_value / inflation_factor * random.uniform(0.7, 1.3))
                elif transfer_method == 'Mortgage Foreclosure':
                    consideration = int(land_value * random.uniform(0.5, 0.8))  # Below market
                else:
                    consideration = None
            
            # Generate supporting documentation details
            stamp_duty_required = transfer_method in ['Sale', 'Exchange', 'Mortgage Foreclosure']
            
            history.append({
                'transfer_id': str(uuid.uuid4()),
                'transfer_sequence': i + 1,
                'from_owner': from_owner,
                'to_owner': current_owner if i == num_transfers - 1 else self._generate_contextual_name(),
                'transfer_date': transfer_date.isoformat(),
                'transfer_method': transfer_method,
                'consideration_amount': consideration,
                'stamp_duty_paid': random.choices([True, False], weights=[0.85, 0.15])[0] if stamp_duty_required else None,
                'registration_fee_paid': random.choices([True, False], weights=[0.9, 0.1])[0],
                'witness_1': random.choice(self.kenyan_names),
                'witness_2': random.choice(self.kenyan_names),
                'lawyer_name': f"{random.choice(self.kenyan_names)}, Advocate",
                'law_firm': f"{random.choice(['Kamau & Associates', 'Wanjiku Legal Services', 'Ochieng Law Firm', 'Mutua & Partners'])}",
                'registration_number': f"REG/{random.randint(1000, 9999)}/{transfer_date.year}",
                'is_suspicious': random.random() < 0.02,  # 2% suspicious rate
                'supporting_documents': self._generate_supporting_documents(transfer_method)
            })
            
            previous_owner = history[-1]['to_owner']
            current_date = transfer_date
        
        return sorted(history, key=lambda x: x['transfer_date'])

    def _generate_contextual_name(self, reference_name: str = None) -> str:
        """Generate names with some family relationship context for inheritance cases"""
        if reference_name and random.random() < 0.3:  # 30% chance of family relationship
            # Extract first name and generate related name
            base_surname = reference_name.split()[-1] if reference_name else ""
            new_first_name = random.choice([name.split()[0] for name in self.kenyan_names])
            return f"{new_first_name} {base_surname}"
        
        return random.choice(self.kenyan_names)

    def _generate_supporting_documents(self, transfer_method: str) -> List[str]:
        """Generate realistic supporting documents based on transfer method"""
        base_docs = ['Title Deed Copy', 'National ID Copy', 'PIN Certificate']
        
        method_specific_docs = {
            'Sale': ['Sale Agreement', 'Valuation Report', 'Tax Clearance'],
            'Inheritance': ['Death Certificate', 'Succession Certificate', 'Family Tree'],
            'Gift': ['Gift Agreement', 'Family Relationship Affidavit'],
            'Court Order': ['Court Judgment', 'Court Order', 'Legal Notice'],
            'Government Allocation': ['Allocation Letter', 'Survey Report', 'Development Permit'],
            'Succession': ['Grant of Letters of Administration', 'Probate', 'Beneficiary List'],
            'Mortgage Foreclosure': ['Mortgage Agreement', 'Default Notice', 'Auction Notice']
        }
        
        specific_docs = method_specific_docs.get(transfer_method, [])
        return base_docs + specific_docs

    def generate_comprehensive_government_records(self, title_deed: str, county: str, 
                                                land_value: int, is_fraudulent: bool = False) -> Dict[str, Any]:
        """
        Generate more comprehensive government verification records with interdependencies.
        Records are more likely to be consistent unless fraud is involved.
        """
        # Base probabilities adjusted for fraud
        base_verification_rate = 0.85 if not is_fraudulent else 0.3
        
        # Generate interdependent verification status
        lands_registry_verified = random.random() < base_verification_rate
        survey_records_available = lands_registry_verified and (random.random() < 0.9)
        
        # High-value properties more likely to have complete documentation
        documentation_completeness = min(0.95, 0.6 + (land_value / 50000000) * 0.3)
        
        return {
            'verification_details': {
                'lands_registry_verified': lands_registry_verified,
                'survey_records_available': survey_records_available,
                'mutation_records_complete': lands_registry_verified and (random.random() < 0.8),
                'boundary_survey_approved': survey_records_available and (random.random() < 0.85)
            },
            'clearance_certificates': {
                'rates_clearance_certificate': random.random() < documentation_completeness,
                'land_control_board_consent': random.random() < (0.7 if land_value > 10000000 else 0.4),
                'environmental_impact_assessment': random.random() < (0.8 if land_value > 20000000 else 0.2),
                'nema_clearance': random.random() < (0.6 if land_value > 15000000 else 0.1)
            },
            'approvals': {
                'county_approval': random.random() < 0.75,
                'national_land_commission_approval': random.random() < (0.9 if land_value > 50000000 else 0.6),
                'physical_planning_approval': random.random() < 0.65,
                'water_rights_clearance': random.random() < 0.4
            },
            'verification_metadata': {
                'last_verification_date': (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
                'verification_officer': random.choice(self.kenyan_names),
                'officer_badge_number': f"LR{random.randint(1000, 9999)}",
                'verification_status': self._determine_verification_status(lands_registry_verified, is_fraudulent),
                'verification_notes': self._generate_verification_notes(is_fraudulent),
                'next_verification_due': (datetime.now() + timedelta(days=random.randint(180, 730))).isoformat()
            },
            'valuation_details': {
                'government_valuation': int(land_value * random.uniform(0.8, 1.2)),
                'valuation_date': (datetime.now() - timedelta(days=random.randint(30, 730))).isoformat(),
                'valuation_method': random.choice(['Comparative', 'Income', 'Cost', 'Residual']),
                'valuer_name': f"{random.choice(self.kenyan_names)}, MISK",
                'valuation_certificate_number': f"VAL/{random.randint(1000, 9999)}/{datetime.now().year}"
            }
        }

    def _determine_verification_status(self, verified: bool, is_fraudulent: bool) -> str:
        """Determine verification status based on fraud and verification state"""
        if is_fraudulent:
            return random.choice(['disputed', 'rejected', 'under_investigation'])
        elif verified:
            return random.choices(['verified', 'pending', 'conditional'], weights=[0.8, 0.15, 0.05])[0]
        else:
            return random.choices(['pending', 'incomplete', 'rejected'], weights=[0.6, 0.3, 0.1])[0]

    def _generate_verification_notes(self, is_fraudulent: bool) -> str:
        """Generate contextual verification notes"""
        if is_fraudulent:
            suspicious_notes = [
                "Discrepancies found in documentation",
                "Requires additional verification",
                "Conflicting information detected",
                "Under investigation for irregularities",
                "Documentation authenticity questioned"
            ]
            return random.choice(suspicious_notes)
        else:
            normal_notes = [
                "Standard verification completed",
                "All documents in order",
                "Routine processing",
                "No issues identified",
                "Standard compliance verification"
            ]
            return random.choice(normal_notes)

    def apply_enhanced_fraud_pattern(self, land_record: Dict[str, Any], pattern: str) -> Dict[str, Any]:
        """
        Apply sophisticated fraud patterns with realistic indicators and varying detection difficulty.
        Each pattern now has multiple layers of fraud indicators.
        """
        pattern_data = self.fraud_patterns[pattern]
        detection_difficulty = pattern_data['detection_difficulty']
        
        # Base fraud indicators
        land_record['fraud_indicators'] = {
            'pattern_type': pattern,
            'sophistication_level': pattern_data['sophistication'],
            'detection_confidence': round(1 - detection_difficulty, 2),
            'investigation_priority': 'high' if detection_difficulty > 0.8 else ('medium' if detection_difficulty > 0.5 else 'low')
        }
        
        # Pattern-specific fraud application
        if pattern == 'document_forgery':
            land_record['fraud_indicators'].update({
                'forged_signatures': True,
                'altered_dates': random.choice([True, False]),
                'fake_stamps': random.choice([True, False]),
                'inconsistent_handwriting': True,
                'paper_age_mismatch': random.choice([True, False]),
                'watermark_inconsistencies': random.choice([True, False])
            })
            # Impact on government records
            land_record['government_records']['verification_details']['lands_registry_verified'] = False
            land_record['government_records']['verification_metadata']['verification_notes'] = "Document authenticity questioned"
            
        elif pattern == 'identity_theft':
            land_record['fraud_indicators'].update({
                'stolen_identity': True,
                'fake_id_documents': True,
                'impersonation': True,
                'biometric_mismatch': random.choice([True, False]),
                'address_inconsistencies': True
            })
            # Modify ownership history to show suspicious patterns
            for transfer in land_record['ownership_history']:
                if random.random() < 0.3:
                    transfer['is_suspicious'] = True
            
        elif pattern == 'boundary_manipulation':
            # Manipulate boundary coordinates more realistically
            manipulation_factor = random.uniform(0.0005, 0.003)
            for point in land_record['boundary_points']:
                point['latitude'] += random.uniform(-manipulation_factor, manipulation_factor)
                point['longitude'] += random.uniform(-manipulation_factor, manipulation_factor)
                if random.random() < 0.4:
                    point['beacon_condition'] = 'missing'
            
            land_record['fraud_indicators'].update({
                'boundary_encroachment': True,
                'beacon_tampering': True,
                'survey_manipulation': True,
                'coordinate_inconsistencies': True,
                'encroachment_area_estimate': round(random.uniform(0.1, 2.0), 2)
            })
            
        elif pattern == 'double_allocation':
            land_record['fraud_indicators'].update({
                'multiple_allocations': True,
                'conflicting_titles': True,
                'government_corruption': True,
                'duplicate_title_numbers': random.choice([True, False]),
                'overlapping_boundaries': True
            })
            # Create a conflicting title deed number
            land_record['conflicting_title_deed'] = self.generate_title_deed_number(land_record['location_details']['county'])
            
        elif pattern == 'inheritance_exploitation':
            land_record['fraud_indicators'].update({
                'fake_succession_certificate': True,
                'excluded_beneficiaries': True,
                'forged_death_certificate': random.choice([True, False]),
                'fabricated_family_relationships': True,
                'missing_heirs': random.randint(1, 4),
                'succession_court_irregularities': True
            })
            # Add suspicious inheritance transfer
            for transfer in land_record['ownership_history']:
                if transfer['transfer_method'] == 'Inheritance':
                    transfer['is_suspicious'] = True
                    transfer['supporting_documents'].append('Disputed Succession Certificate')
            
        elif pattern == 'government_corruption':
            land_record['fraud_indicators'].update({
                'corrupt_officials': True,
                'irregular_approvals': True,
                'bypassed_procedures': True,
                'suspicious_government_allocations': True,
                'inflated_valuations': random.choice([True, False])
            })
            # Corrupt government records
            land_record['government_records']['approvals'] = {k: True for k in land_record['government_records']['approvals']}
            land_record['government_records']['verification_metadata']['verification_notes'] = "Fast-tracked approval process"
            
        elif pattern == 'beacon_tampering':
            land_record['fraud_indicators'].update({
                'physical_beacon_tampering': True,
                'coordinate_manipulation': True,
                'survey_equipment_interference': True,
                'false_boundary_markers': True
            })
            # Tamper with beacon conditions
            for point in land_record['boundary_points']:
                if random.random() < 0.6:
                    point['beacon_condition'] = random.choice(['poor', 'missing'])
                    point['tampering_evidence'] = True
            
        elif pattern == 'fake_succession':
            land_record['fraud_indicators'].update({
                'fabricated_will': True,
                'fake_probate_documents': True,
                'impersonated_executor': True,
                'false_witness_statements': True,
                'backdated_documents': True
            })
        
        # Set fraud metadata
        land_record['is_fraudulent'] = True
        land_record['fraud_pattern'] = pattern
        land_record['risk_score'] = random.randint(70, 100)
        land_record['fraud_detection_date'] = datetime.now().isoformat()
        land_record['requires_investigation'] = True
        
        return land_record

    def calculate_risk_score(self, land_record: Dict[str, Any]) -> int:
        """
        Calculate sophisticated risk score based on multiple factors.
        Uses weighted scoring system for more accurate risk assessment.
        """
        base_score = 10
        
        # Government verification factors (40% weight)
        gov_records = land_record['government_records']
        if not gov_records['verification_details']['lands_registry_verified']:
            base_score += 25
        if not gov_records['verification_details']['survey_records_available']:
            base_score += 15
        if gov_records['verification_metadata']['verification_status'] in ['disputed', 'rejected']:
            base_score += 30
        
        # Ownership history factors (30% weight)
        ownership_issues = sum(1 for transfer in land_record['ownership_history'] if transfer['is_suspicious'])
        base_score += ownership_issues * 8
        
        # Recent transfers increase risk
        recent_transfers = len([t for t in land_record['ownership_history'] 
                              if (datetime.now() - datetime.fromisoformat(t['transfer_date'])).days < 365])
        if recent_transfers > 2:
            base_score += 12
        
        # Boundary and beacon factors (20% weight)
        poor_beacons = sum(1 for point in land_record['boundary_points'] 
                          if point['beacon_condition'] in ['poor', 'missing'])
        base_score += poor_beacons * 3
        
        # Value and documentation factors (10% weight)
        if land_record['financial_details']['market_value'] > 50000000:  # High-value properties have different risk profiles
            base_score += 5
        
        # Apply fraud pattern if present
        if land_record.get('is_fraudulent', False):
            pattern = land_record.get('fraud_pattern', '')
            pattern_data = self.fraud_patterns.get(pattern, {})
            detection_difficulty = pattern_data.get('detection_difficulty', 0.5)
            base_score += int(detection_difficulty * 40)
        
        return min(100, max(0, base_score))

    def generate_comprehensive_land_record(self, is_fraudulent: bool = False, 
                                         target_county: str = None) -> Dict[str, Any]:
        """
        Generate a complete, sophisticated land verification record with enhanced realism.
        """
        # Select county using weighted distribution
        if target_county:
            county = target_county
        else:
            county_weights = {county: data['weight'] for county, data in self.county_data.items()}
            county = self._weighted_choice(county_weights)
        
        county_info = self.county_data[county]
        
        # Generate core identifiers
        title_deed = self.generate_title_deed_number(county)
        owner_name = random.choice(self.kenyan_names)
        center_coords = self.generate_enhanced_coordinates(county)
        
        # Generate land size with realistic distribution
        if county_info['urbanization'] > 0.7:  # Urban areas - smaller plots
            land_size = round(np.random.lognormal(0, 1) * 0.5 + 0.05, 3)  # 0.05 to ~2 acres
        else:  # Rural areas - larger plots
            land_size = round(np.random.lognormal(1, 1.5) + 0.1, 2)  # 0.1 to ~20 acres
        
        land_size = max(0.05, min(200, land_size))  # Reasonable bounds
        
        # Calculate market value based on county, size, and land use
        base_value_per_acre = random.randint(500000, 2000000)  # Base value
        county_multiplier = county_info['avg_value_multiplier']
        land_use = self._weighted_choice(self.land_use_weights)
        
        # Land use value multipliers
        use_multipliers = {
            'Commercial': 3.0, 'Industrial': 2.5, 'Mixed': 2.0, 'Residential': 1.5,
            'Government': 1.2, 'Educational': 1.1, 'Agricultural': 1.0,
            'Religious': 0.9, 'Recreational': 0.8, 'Conservation': 0.7
        }
        
        market_value = int(base_value_per_acre * land_size * county_multiplier * 
                          use_multipliers.get(land_use, 1.0) * random.uniform(0.8, 1.2))
        
        # Generate comprehensive record
        record = {
            'verification_id': str(uuid.uuid4()),
            'title_deed_number': title_deed,
            'owner_details': {
                'name': owner_name,
                'id_number': f"{random.randint(10000000, 99999999)}",
                'phone_number': f"+254{random.randint(700000000, 799999999)}",
                'email': f"{owner_name.lower().replace(' ', '.')}@{random.choice(['gmail.com', 'yahoo.com', 'hotmail.com'])}",
                'postal_address': f"P.O. Box {random.randint(1, 99999)}, {county}"
            },
            'location_details': {
                'county': county,
                'sub_county': f"{county} {random.choice(['Central', 'East', 'West', 'North', 'South'])}",
                'ward': f"{fake.city()} Ward",
                'location': fake.address(),
                'nearest_town': fake.city(),
                'distance_to_main_road': round(random.uniform(0.1, 10.0), 1)
            },
            'property_details': {
                'land_use_type': land_use,
                'size_acres': land_size,
                'size_hectares': round(land_size * 0.4047, 3),
                'topography': random.choice(['Flat', 'Gently Sloping', 'Hilly', 'Steep', 'Valley']),
                'soil_type': random.choice(['Clay', 'Loam', 'Sandy', 'Rocky', 'Alluvial']),
                'water_source': random.choice(['Borehole', 'Well', 'River', 'Spring', 'Municipal', 'None']),
                'access_road': random.choice(['Tarmac', 'Murram', 'Earth', 'Footpath'])
            },
            'coordinates': center_coords,
            'boundary_points': self.generate_sophisticated_boundary_points(
                center_coords['latitude'], 
                center_coords['longitude'],
                land_size
            ),
            'ownership_history': self.generate_realistic_ownership_history(owner_name, market_value, county),
            'government_records': self.generate_comprehensive_government_records(
                title_deed, county, market_value, is_fraudulent
            ),
            'financial_details': {
                'market_value': market_value,
                'government_valuation': None,  # Will be set in government_records
                'last_transaction_amount': None,  # Will be extracted from ownership_history
                'annual_land_rates': int(market_value * 0.002 * random.uniform(0.8, 1.2)),  # ~0.2% of value
                'rates_arrears': random.randint(0, 50000) if random.random() < 0.2 else 0
            },
            'encumbrances': {
                'mortgage': {
                    'exists': random.choice([True, False]),
                    'lender': f"{random.choice(['KCB', 'Equity', 'Co-operative', 'ABSA', 'Stanbic'])} Bank" if random.choice([True, False]) else None,
                    'amount': random.randint(min(1000000, int(market_value * 0.3)), max(1000000, int(market_value * 0.8))) if random.choice([True, False]) else None
                },
                'caveat': random.choice([True, False]),
                'court_order': random.choice([True, False]),
                'lease': {
                    'exists': random.choice([True, False]),
                    'lease_period': random.randint(50, 999) if random.choice([True, False]) else None,
                    'annual_rent': random.randint(10000, 500000) if random.choice([True, False]) else None
                },
                'easements': random.choice([True, False])
            },
            'verification_metadata': {
                'verification_status': 'pending',  # Will be updated based on fraud status
                'verification_date': datetime.now().isoformat(),
                'verifier_name': random.choice(self.kenyan_names),
                'verification_method': random.choice(['Physical', 'Document Review', 'Digital', 'Hybrid']),
                'completion_percentage': random.randint(85, 100),
                'estimated_completion_date': (datetime.now() + timedelta(days=random.randint(1, 30))).isoformat()
            },
            'risk_assessment': {
                'risk_score': 0,  # Will be calculated
                'risk_category': 'low',  # Will be determined
                'risk_factors': [],
                'recommended_actions': []
            },
            'metadata': {
                'record_id': str(uuid.uuid4()),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat(),
                'created_by': 'System Generator',
                'data_source': 'TripleCheck Kenya Generator v2.0',
                'record_version': '1.0'
            }
        }
        
        # Extract transaction amount from ownership history
        last_transaction = max(record['ownership_history'], key=lambda x: x['transfer_date'], default={})
        record['financial_details']['last_transaction_amount'] = last_transaction.get('consideration_amount')
        record['financial_details']['last_transaction_date'] = last_transaction.get('transfer_date')
        
        # Set government valuation from government records
        record['financial_details']['government_valuation'] = record['government_records']['valuation_details']['government_valuation']
        
        # Apply fraud patterns if fraudulent
        if is_fraudulent:
            pattern_weights = {pattern: data['weight'] for pattern, data in self.fraud_patterns.items()}
            selected_pattern = self._weighted_choice(pattern_weights)
            record = self.apply_enhanced_fraud_pattern(record, selected_pattern)
        
        # Calculate and set risk score
        risk_score = self.calculate_risk_score(record)
        record['risk_assessment']['risk_score'] = risk_score
        
        # Determine risk category
        if risk_score < 30:
            risk_category = 'low'
        elif risk_score < 60:
            risk_category = 'medium'
        elif risk_score < 80:
            risk_category = 'high'
        else:
            risk_category = 'critical'
        
        record['risk_assessment']['risk_category'] = risk_category
        record['risk_assessment']['risk_factors'] = self._identify_risk_factors(record)
        record['risk_assessment']['recommended_actions'] = self._generate_recommendations(risk_category, record)
        
        # Update verification status based on risk
        if risk_score > 70 or is_fraudulent:
            record['verification_metadata']['verification_status'] = random.choice(['disputed', 'under_review', 'flagged'])
        else:
            record['verification_metadata']['verification_status'] = random.choices(
                ['verified', 'pending', 'approved'], weights=[0.7, 0.2, 0.1]
            )[0]
        
        record['is_fraudulent'] = is_fraudulent
        
        return record

    def _identify_risk_factors(self, record: Dict[str, Any]) -> List[str]:
        """Identify specific risk factors present in the record"""
        factors = []
        
        # Government verification issues
        if not record['government_records']['verification_details']['lands_registry_verified']:
            factors.append('Unverified registry records')
        
        # Ownership history issues
        suspicious_transfers = sum(1 for t in record['ownership_history'] if t['is_suspicious'])
        if suspicious_transfers > 0:
            factors.append(f'{suspicious_transfers} suspicious ownership transfer(s)')
        
        # Recent multiple transfers
        recent_transfers = len([t for t in record['ownership_history'] 
                              if (datetime.now() - datetime.fromisoformat(t['transfer_date'])).days < 365])
        if recent_transfers > 2:
            factors.append('Multiple recent ownership transfers')
        
        # Boundary issues
        poor_beacons = sum(1 for p in record['boundary_points'] if p['beacon_condition'] in ['poor', 'missing'])
        if poor_beacons > 2:
            factors.append('Multiple damaged or missing boundary beacons')
        
        # Financial red flags
        if record['financial_details']['rates_arrears'] > 0:
            factors.append('Outstanding land rates')
        
        # High-value property flag
        if record['financial_details']['market_value'] > 50000000:
            factors.append('High-value property requiring enhanced verification')
        
        return factors

    def _generate_recommendations(self, risk_category: str, record: Dict[str, Any]) -> List[str]:
        """Generate appropriate recommendations based on risk level"""
        recommendations = []
        
        if risk_category == 'low':
            recommendations = ['Standard verification process', 'Document review sufficient']
        elif risk_category == 'medium':
            recommendations = [
                'Enhanced document verification required',
                'Physical site inspection recommended',
                'Cross-reference with multiple databases'
            ]
        elif risk_category == 'high':
            recommendations = [
                'Mandatory physical verification',
                'Multiple source document verification',
                'Stakeholder interviews required',
                'Legal review recommended'
            ]
        else:  # critical
            recommendations = [
                'Immediate investigation required',
                'Suspend all transactions pending review',
                'Legal and forensic analysis',
                'Multi-party verification process',
                'Report to relevant authorities'
            ]
        
        # Add specific recommendations based on identified issues
        if record['financial_details']['rates_arrears'] > 0:
            recommendations.append('Resolve outstanding land rates before proceeding')
        
        if not record['government_records']['verification_details']['lands_registry_verified']:
            recommendations.append('Obtain registry verification before approval')
        
        return recommendations

    def generate_optimized_dataset(self, total_records: int = 1000, fraud_rate: float = 0.03,
                                 batch_size: int = 100, use_threading: bool = True) -> List[Dict[str, Any]]:
        """
        Generate dataset with optimized performance using batch processing and optional threading.
        """
        logger.info(f"🏞️  Generating {total_records:,} optimized land verification records...")
        logger.info(f"📊 Fraud rate: {fraud_rate * 100:.1f}%")
        logger.info(f"⚡ Batch size: {batch_size}, Threading: {use_threading}")
        
        records = []
        fraudulent_count = int(total_records * fraud_rate)
        legitimate_count = total_records - fraudulent_count
        
        def generate_batch(batch_fraud_count: int, batch_legitimate_count: int) -> List[Dict[str, Any]]:
            """Generate a batch of records"""
            batch_records = []
            
            # Generate fraudulent records for this batch
            for _ in range(batch_fraud_count):
                batch_records.append(self.generate_comprehensive_land_record(is_fraudulent=True))
            
            # Generate legitimate records for this batch
            for _ in range(batch_legitimate_count):
                batch_records.append(self.generate_comprehensive_land_record(is_fraudulent=False))
            
            return batch_records
        
        if use_threading and total_records > 500:
            # Use threading for large datasets
            num_batches = (total_records + batch_size - 1) // batch_size
            
            with ThreadPoolExecutor(max_workers=min(4, os.cpu_count())) as executor:
                futures = []
                
                for i in range(num_batches):
                    start_idx = i * batch_size
                    end_idx = min((i + 1) * batch_size, total_records)
                    batch_total = end_idx - start_idx
                    
                    batch_fraud_count = min(fraudulent_count - len([r for r in records if r.get('is_fraudulent', False)]), batch_total)
                    batch_legitimate_count = batch_total - batch_fraud_count
                    
                    future = executor.submit(generate_batch, batch_fraud_count, batch_legitimate_count)
                    futures.append(future)
                
                # Collect results
                for i, future in enumerate(as_completed(futures)):
                    batch_records = future.result()
                    records.extend(batch_records)
                    logger.info(f"   Completed batch {i + 1}/{num_batches} ({len(batch_records)} records)")
        
        else:
            # Sequential processing for smaller datasets
            fraud_generated = 0
            legitimate_generated = 0
            
            for i in range(total_records):
                if fraud_generated < fraudulent_count and (legitimate_generated >= legitimate_count or random.random() < fraud_rate):
                    records.append(self.generate_comprehensive_land_record(is_fraudulent=True))
                    fraud_generated += 1
                else:
                    records.append(self.generate_comprehensive_land_record(is_fraudulent=False))
                    legitimate_generated += 1
                
                if (i + 1) % batch_size == 0:
                    logger.info(f"   Generated {i + 1:,} records...")
        
        # Shuffle records to randomize order
        random.shuffle(records)
        
        logger.info(f"✅ Successfully generated {len(records):,} records")
        return records

    def generate_enhanced_statistics(self, dataset: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate comprehensive statistics about the generated dataset"""
        fraudulent_records = [r for r in dataset if r.get('is_fraudulent', False)]
        legitimate_records = [r for r in dataset if not r.get('is_fraudulent', False)]
        
        # Calculate detailed statistics
        stats = {
            'dataset_overview': {
                'total_records': len(dataset),
                'fraudulent_records': len(fraudulent_records),
                'legitimate_records': len(legitimate_records),
                'fraud_rate': len(fraudulent_records) / len(dataset) if dataset else 0,
                'generation_timestamp': datetime.now().isoformat()
            },
            'geographic_distribution': {
                county: len([r for r in dataset if r['location_details']['county'] == county])
                for county in self.county_data.keys()
            },
            'land_use_distribution': {
                use_type: len([r for r in dataset if r['property_details']['land_use_type'] == use_type])
                for use_type in self.land_use_weights.keys()
            },
            'risk_distribution': {
                'low': len([r for r in dataset if r['risk_assessment']['risk_category'] == 'low']),
                'medium': len([r for r in dataset if r['risk_assessment']['risk_category'] == 'medium']),
                'high': len([r for r in dataset if r['risk_assessment']['risk_category'] == 'high']),
                'critical': len([r for r in dataset if r['risk_assessment']['risk_category'] == 'critical'])
            },
            'verification_status_distribution': {
                status: len([r for r in dataset if r['verification_metadata']['verification_status'] == status])
                for status in ['verified', 'pending', 'disputed', 'rejected', 'under_review', 'flagged', 'approved']
            },
            'fraud_pattern_analysis': {
                pattern: len([r for r in fraudulent_records if r.get('fraud_pattern') == pattern])
                for pattern in self.fraud_patterns.keys()
            },
            'financial_analysis': {
                'average_market_value': np.mean([r['financial_details']['market_value'] for r in dataset]) if dataset else 0,
                'median_market_value': np.median([r['financial_details']['market_value'] for r in dataset]) if dataset else 0,
                'total_market_value': sum(r['financial_details']['market_value'] for r in dataset),
                'average_land_size': np.mean([r['property_details']['size_acres'] for r in dataset]) if dataset else 0,
                'high_value_properties': len([r for r in dataset if r['financial_details']['market_value'] > 50000000])
            },
            'data_quality_metrics': {
                'complete_ownership_histories': len([r for r in dataset if len(r['ownership_history']) > 0]),
                'verified_boundaries': len([r for r in dataset if all(p['beacon_condition'] == 'good' for p in r['boundary_points'])]),
                'government_verified': len([r for r in dataset if r['government_records']['verification_details']['lands_registry_verified']]),
                'no_encumbrances': len([r for r in dataset if not any(r['encumbrances'].values())])
            }
        }
        
        return stats

def main():
    """Enhanced main function with better argument handling and output options"""
    parser = argparse.ArgumentParser(
        description='Generate Optimized Kenya Land Verification Data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python script.py --count 5000 --fraud-rate 0.05 --output my_dataset.json
  python script.py --count 1000 --batch-size 50 --no-threading
  python script.py --count 10000 --county Nairobi --seed 12345
        """
    )
    
    parser.add_argument('--count', type=int, default=1000, 
                       help='Number of records to generate (default: 1000)')
    parser.add_argument('--fraud-rate', type=float, default=0.03, 
                       help='Fraud rate between 0.0 and 1.0 (default: 0.03)')
    parser.add_argument('--output', type=str, default='optimized_land_dataset.json', 
                       help='Output JSON file path (default: optimized_land_dataset.json)')
    parser.add_argument('--batch-size', type=int, default=100, 
                       help='Batch size for processing (default: 100)')
    parser.add_argument('--no-threading', action='store_true', 
                       help='Disable threading for generation')
    parser.add_argument('--county', type=str, 
                       help='Generate all records for specific county')
    parser.add_argument('--seed', type=int, 
                       help='Random seed for reproducible results')
    parser.add_argument('--stats-only', action='store_true', 
                       help='Generate statistics file only (requires existing dataset)')
    
    args = parser.parse_args()
    
    # Validate arguments
    if not 0.0 <= args.fraud_rate <= 1.0:
        logger.error("Fraud rate must be between 0.0 and 1.0")
        return
    
    if args.count <= 0:
        logger.error("Count must be positive")
        return
    
    print("🚀 Starting Optimized Kenya Land Verification Data Generation")
    print("=" * 60)
    
    # Initialize generator
    generator = OptimizedKenyaLandDataGenerator(seed=args.seed)
    
    if args.stats_only:
        # Load existing dataset and generate statistics
        try:
            with open(args.output, 'r', encoding='utf-8') as f:
                dataset = json.load(f)
            logger.info(f"Loaded existing dataset with {len(dataset)} records")
        except FileNotFoundError:
            logger.error(f"Dataset file {args.output} not found")
            return
    else:
        # Generate new dataset
        dataset = generator.generate_optimized_dataset(
            total_records=args.count,
            fraud_rate=args.fraud_rate,
            batch_size=args.batch_size,
            use_threading=not args.no_threading
        )
        
        # Save dataset
        output_path = os.path.join(os.path.dirname(__file__), args.output)
        logger.info(f"💾 Saving dataset to {output_path}")
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✅ Dataset saved successfully")
    
    # Generate and save enhanced statistics
    logger.info("📊 Generating comprehensive statistics...")
    stats = generator.generate_enhanced_statistics(dataset)
    
    stats_filename = args.output.replace('.json', '_statistics.json')
    stats_path = os.path.join(os.path.dirname(__file__), stats_filename)
    
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
    
    # Display summary statistics
    overview = stats['dataset_overview']
    financial = stats['financial_analysis']
    risk_dist = stats['risk_distribution']
    
    print(f"\n📈 Dataset Summary:")
    print(f"   Total Records: {overview['total_records']:,}")
    print(f"   Fraudulent: {overview['fraudulent_records']:,} ({overview['fraud_rate']:.1%})")
    print(f"   Legitimate: {overview['legitimate_records']:,}")
    print(f"\n💰 Financial Overview:")
    print(f"   Total Market Value: KES {financial['total_market_value']:,.0f}")
    print(f"   Average Market Value: KES {financial['average_market_value']:,.0f}")
    print(f"   Average Land Size: {financial['average_land_size']:.2f} acres")
    print(f"   High-Value Properties: {financial['high_value_properties']:,}")
    print(f"\n⚠️  Risk Distribution:")
    print(f"   Low Risk: {risk_dist['low']:,}")
    print(f"   Medium Risk: {risk_dist['medium']:,}")
    print(f"   High Risk: {risk_dist['high']:,}")
    print(f"   Critical Risk: {risk_dist['critical']:,}")
    
    print(f"\n💾 Files Generated:")
    print(f"   Dataset: {args.output}")
    print(f"   Statistics: {stats_filename}")
    
    print("\n🎉 Optimized land verification data generation completed successfully!")

if __name__ == "__main__":
    main()