#!/usr/bin/env python3
"""
TripleCheck Fraud Pattern Simulation Script
Based on Prompt 3: Fraud Pattern Simulation

This script introduces sophisticated fraud patterns into the dataset
to train and test fraud detection models.
"""

import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Any
import json
import uuid
import copy

class FraudPatternSimulator:
    def __init__(self):
        self.fraud_patterns = {
            'identity_theft': {
                'description': 'Using stolen or fake identities for transactions',
                'indicators': ['inconsistent_personal_info', 'rapid_account_creation', 'suspicious_documents'],
                'severity': 'high',
                'frequency': 0.3
            },
            'property_value_manipulation': {
                'description': 'Artificially inflating or deflating property values',
                'indicators': ['price_anomalies', 'fake_appraisals', 'collusive_pricing'],
                'severity': 'high',
                'frequency': 0.25
            },
            'straw_buyer_schemes': {
                'description': 'Using fake buyers to hide true property ownership',
                'indicators': ['shell_companies', 'nominee_buyers', 'rapid_ownership_transfers'],
                'severity': 'medium',
                'frequency': 0.2
            },
            'illegal_property_flipping': {
                'description': 'Quick buy-sell cycles with artificial value inflation',
                'indicators': ['rapid_transactions', 'inflated_renovations', 'collusive_sales'],
                'severity': 'medium',
                'frequency': 0.15
            },
            'mortgage_fraud': {
                'description': 'Fraudulent mortgage applications and documentation',
                'indicators': ['income_inflation', 'fake_employment', 'document_forgery'],
                'severity': 'high',
                'frequency': 0.1
            }
        }
        
        # Time-based evolution patterns
        self.fraud_evolution = {
            2020: ['basic_identity_theft', 'simple_price_manipulation'],
            2021: ['digital_document_forgery', 'remote_verification_bypass'],
            2022: ['ai_generated_documents', 'deepfake_verification'],
            2023: ['blockchain_manipulation', 'smart_contract_exploits'],
            2024: ['advanced_ai_fraud', 'synthetic_identity_creation']
        }

    def apply_identity_theft_pattern(self, user: Dict, properties: List[Dict], 
                                   transactions: List[Dict]) -> Tuple[Dict, List[Dict], List[Dict]]:
        """Apply identity theft fraud pattern"""
        fraudulent_user = copy.deepcopy(user)
        
        # Introduce inconsistencies in personal information
        inconsistency_type = random.choice([
            'name_mismatch', 'address_inconsistency', 'document_mismatch', 'contact_fraud'
        ])
        
        if inconsistency_type == 'name_mismatch':
            # Different name in email vs profile
            fake_names = ['John Smith', 'Jane Doe', 'Michael Johnson', 'Sarah Wilson']
            fake_name = random.choice(fake_names)
            fraudulent_user['email'] = f"{fake_name.lower().replace(' ', '.')}@gmail.com"
            
        elif inconsistency_type == 'address_inconsistency':
            # Address doesn't match transaction locations
            fake_cities = ['Lagos', 'Accra', 'Johannesburg', 'Cairo']
            fraudulent_user['address']['city'] = random.choice(fake_cities)
            
        elif inconsistency_type == 'document_mismatch':
            # Suspicious document patterns
            fraudulent_user['documentFlags'] = [
                'inconsistent_signatures',
                'suspicious_id_numbers',
                'fake_utility_bills'
            ]
            
        elif inconsistency_type == 'contact_fraud':
            # Suspicious contact information
            fraudulent_user['phone'] = f"+1{random.randint(1000000000, 9999999999)}"  # Non-Kenyan number
        
        # Mark related transactions as suspicious
        user_transactions = [t for t in transactions if t['userId'] == user['id']]
        for transaction in user_transactions:
            transaction['isSuspicious'] = True
            transaction['fraudPattern'] = 'identity_theft'
            transaction['fraudIndicators'] = [inconsistency_type, 'stolen_identity_usage']
        
        fraudulent_user['fraudPattern'] = 'identity_theft'
        fraudulent_user['fraudIndicators'] = [inconsistency_type]
        
        return fraudulent_user, properties, transactions

    def apply_property_value_manipulation(self, user: Dict, properties: List[Dict], 
                                        transactions: List[Dict]) -> Tuple[Dict, List[Dict], List[Dict]]:
        """Apply property value manipulation fraud pattern"""
        # Select properties involved in user's transactions
        user_property_ids = [t['propertyId'] for t in transactions if t['userId'] == user['id']]
        
        manipulated_properties = []
        for prop in properties:
            if prop['id'] in user_property_ids:
                manipulated_prop = copy.deepcopy(prop)
                
                manipulation_type = random.choice([
                    'artificial_inflation', 'value_deflation', 'fake_comparables'
                ])
                
                if manipulation_type == 'artificial_inflation':
                    # Inflate property value by 50-200%
                    inflation_factor = random.uniform(1.5, 3.0)
                    manipulated_prop['price'] = int(manipulated_prop['price'] * inflation_factor)
                    manipulated_prop['fraudIndicators'] = ['artificially_inflated_price', 'fake_appraisal']
                    
                elif manipulation_type == 'value_deflation':
                    # Deflate value for tax evasion
                    deflation_factor = random.uniform(0.3, 0.7)
                    manipulated_prop['price'] = int(manipulated_prop['price'] * deflation_factor)
                    manipulated_prop['fraudIndicators'] = ['artificially_deflated_price', 'tax_evasion']
                    
                elif manipulation_type == 'fake_comparables':
                    # Use fake comparable sales
                    manipulated_prop['fraudIndicators'] = ['fake_comparable_sales', 'manipulated_market_analysis']
                
                manipulated_prop['fraudPattern'] = 'property_value_manipulation'
                manipulated_prop['isSuspicious'] = True
                manipulated_properties.append(manipulated_prop)
            else:
                manipulated_properties.append(prop)
        
        # Mark related transactions
        for transaction in transactions:
            if transaction['userId'] == user['id']:
                transaction['isSuspicious'] = True
                transaction['fraudPattern'] = 'property_value_manipulation'
                transaction['fraudIndicators'] = ['manipulated_property_value']
        
        return user, manipulated_properties, transactions

    def introduce_fraud_patterns(self, users: List[Dict], properties: List[Dict], 
                               transactions: List[Dict], fraud_rate: float = 0.05) -> Tuple[List[Dict], List[Dict], List[Dict]]:
        """Introduce various fraud patterns into the dataset"""
        print(f"🔍 Introducing fraud patterns with {fraud_rate*100:.1f}% fraud rate...")
        
        # Calculate number of fraudulent cases
        total_users = len(users)
        fraud_count = int(total_users * fraud_rate)
        
        # Select users for fraud patterns
        fraud_users_indices = random.sample(range(total_users), fraud_count)
        
        fraudulent_users = []
        fraudulent_properties = copy.deepcopy(properties)
        fraudulent_transactions = copy.deepcopy(transactions)
        
        for i, user in enumerate(users):
            if i in fraud_users_indices:
                # Select fraud pattern based on frequency weights
                pattern_names = list(self.fraud_patterns.keys())
                pattern_weights = [self.fraud_patterns[p]['frequency'] for p in pattern_names]
                selected_pattern = random.choices(pattern_names, weights=pattern_weights)[0]
                
                print(f"   Applying {selected_pattern} to user {user['id']}")
                
                # Apply the selected fraud pattern
                if selected_pattern == 'identity_theft':
                    modified_user, fraudulent_properties, fraudulent_transactions = \
                        self.apply_identity_theft_pattern(user, fraudulent_properties, fraudulent_transactions)
                elif selected_pattern == 'property_value_manipulation':
                    modified_user, fraudulent_properties, fraudulent_transactions = \
                        self.apply_property_value_manipulation(user, fraudulent_properties, fraudulent_transactions)
                else:
                    # For other patterns, mark as suspicious with basic indicators
                    modified_user = copy.deepcopy(user)
                    modified_user['isSuspicious'] = True
                    modified_user['fraudPattern'] = selected_pattern
                    modified_user['fraudIndicators'] = self.fraud_patterns[selected_pattern]['indicators']
                
                # Apply time-based evolution
                current_year = datetime.now().year
                modified_user = self.apply_time_based_evolution(modified_user, current_year)
                
                fraudulent_users.append(modified_user)
            else:
                fraudulent_users.append(user)
        
        print(f"✅ Applied fraud patterns to {fraud_count:,} users")
        return fraudulent_users, fraudulent_properties, fraudulent_transactions

    def apply_time_based_evolution(self, data: Dict, year: int) -> Dict:
        """Apply time-based fraud evolution patterns"""
        if year in self.fraud_evolution:
            evolved_techniques = self.fraud_evolution[year]
            
            # Add evolved fraud indicators
            if 'fraudIndicators' not in data:
                data['fraudIndicators'] = []
            
            # Add 1-2 evolved techniques
            new_techniques = random.sample(evolved_techniques, min(2, len(evolved_techniques)))
            data['fraudIndicators'].extend(new_techniques)
            data['fraudEvolutionYear'] = year
        
        return data

    def generate_fraud_report(self, users: List[Dict], properties: List[Dict], 
                            transactions: List[Dict]) -> Dict:
        """Generate comprehensive fraud analysis report"""
        users_df = pd.DataFrame(users)
        properties_df = pd.DataFrame(properties)
        transactions_df = pd.DataFrame(transactions)
        
        # Count fraudulent cases
        fraudulent_users = users_df[users_df.get('isSuspicious', False) == True]
        fraudulent_properties = properties_df[properties_df.get('isSuspicious', False) == True]
        fraudulent_transactions = transactions_df[transactions_df.get('isSuspicious', False) == True]
        
        # Analyze fraud patterns
        fraud_patterns_count = {}
        if not fraudulent_users.empty and 'fraudPattern' in fraudulent_users.columns:
            fraud_patterns_count = fraudulent_users['fraudPattern'].value_counts().to_dict()
        
        report = {
            'summary': {
                'total_users': len(users),
                'fraudulent_users': len(fraudulent_users),
                'fraud_rate_users': len(fraudulent_users) / len(users) * 100,
                'total_properties': len(properties),
                'fraudulent_properties': len(fraudulent_properties),
                'fraud_rate_properties': len(fraudulent_properties) / len(properties) * 100 if len(properties) > 0 else 0,
                'total_transactions': len(transactions),
                'fraudulent_transactions': len(fraudulent_transactions),
                'fraud_rate_transactions': len(fraudulent_transactions) / len(transactions) * 100 if len(transactions) > 0 else 0
            },
            'fraud_patterns': fraud_patterns_count,
            'fraud_indicators': self._analyze_fraud_indicators(fraudulent_users),
            'temporal_analysis': self._analyze_temporal_patterns(fraudulent_transactions),
            'severity_analysis': self._analyze_fraud_severity(fraudulent_users)
        }
        
        return report

    def _analyze_fraud_indicators(self, fraudulent_users: pd.DataFrame) -> Dict:
        """Analyze fraud indicators distribution"""
        if fraudulent_users.empty or 'fraudIndicators' not in fraudulent_users.columns:
            return {}
        
        all_indicators = []
        for indicators in fraudulent_users['fraudIndicators'].dropna():
            if isinstance(indicators, list):
                all_indicators.extend(indicators)
        
        if not all_indicators:
            return {}
        
        indicator_counts = pd.Series(all_indicators).value_counts().to_dict()
        return indicator_counts

    def _analyze_temporal_patterns(self, fraudulent_transactions: pd.DataFrame) -> Dict:
        """Analyze temporal fraud patterns"""
        if fraudulent_transactions.empty:
            return {}
        
        # Convert transaction dates
        if 'transactionDate' in fraudulent_transactions.columns:
            fraudulent_transactions['date'] = pd.to_datetime(fraudulent_transactions['transactionDate'])
            
            # Analyze by month
            monthly_fraud = fraudulent_transactions.groupby(
                fraudulent_transactions['date'].dt.to_period('M')
            ).size().to_dict()
            
            # Convert period index to string for JSON serialization
            monthly_fraud = {str(k): v for k, v in monthly_fraud.items()}
            
            return {
                'monthly_distribution': monthly_fraud,
                'peak_fraud_periods': sorted(monthly_fraud.items(), key=lambda x: x[1], reverse=True)[:3]
            }
        
        return {}

    def _analyze_fraud_severity(self, fraudulent_users: pd.DataFrame) -> Dict:
        """Analyze fraud severity distribution"""
        if fraudulent_users.empty or 'fraudPattern' not in fraudulent_users.columns:
            return {}
        
        severity_mapping = {pattern: data['severity'] for pattern, data in self.fraud_patterns.items()}
        
        severity_counts = {'high': 0, 'medium': 0, 'low': 0}
        for pattern in fraudulent_users['fraudPattern'].dropna():
            severity = severity_mapping.get(pattern, 'low')
            severity_counts[severity] += 1
        
        return severity_counts

def main():
    """Main execution function"""
    print("🚀 Starting TripleCheck Fraud Pattern Simulation")
    
    # Load existing datasets (assuming they exist)
    try:
        with open("scripts/data-generation/user_dataset.json", 'r') as f:
            users = json.load(f)
        with open("scripts/data-generation/property_dataset.json", 'r') as f:
            properties = json.load(f)
        with open("scripts/data-generation/transaction_dataset.json", 'r') as f:
            transactions = json.load(f)
        
        print(f"📊 Loaded {len(users)} users, {len(properties)} properties, {len(transactions)} transactions")
        
    except FileNotFoundError:
        print("❌ Dataset files not found. Please run property-generator.py and user-generator.py first.")
        return
    
    # Initialize fraud simulator
    simulator = FraudPatternSimulator()
    
    # Introduce fraud patterns
    fraudulent_users, fraudulent_properties, fraudulent_transactions = \
        simulator.introduce_fraud_patterns(users, properties, transactions, fraud_rate=0.05)
    
    # Save fraudulent datasets
    with open("scripts/data-generation/fraudulent_user_dataset.json", 'w') as f:
        json.dump(fraudulent_users, f, indent=2, default=str)
    
    with open("scripts/data-generation/fraudulent_property_dataset.json", 'w') as f:
        json.dump(fraudulent_properties, f, indent=2, default=str)
    
    with open("scripts/data-generation/fraudulent_transaction_dataset.json", 'w') as f:
        json.dump(fraudulent_transactions, f, indent=2, default=str)
    
    # Generate fraud analysis report
    fraud_report = simulator.generate_fraud_report(
        fraudulent_users, fraudulent_properties, fraudulent_transactions
    )
    
    with open("scripts/data-generation/fraud_analysis_report.json", 'w') as f:
        json.dump(fraud_report, f, indent=2, default=str)
    
    print("\n📊 Fraud Simulation Results:")
    print(f"Fraudulent Users: {fraud_report['summary']['fraudulent_users']:,} ({fraud_report['summary']['fraud_rate_users']:.1f}%)")
    print(f"Fraudulent Properties: {fraud_report['summary']['fraudulent_properties']:,} ({fraud_report['summary']['fraud_rate_properties']:.1f}%)")
    print(f"Fraudulent Transactions: {fraud_report['summary']['fraudulent_transactions']:,} ({fraud_report['summary']['fraud_rate_transactions']:.1f}%)")
    
    print("\n🔍 Top Fraud Patterns:")
    for pattern, count in list(fraud_report['fraud_patterns'].items())[:5]:
        print(f"  {pattern}: {count} cases")
    
    print("\n🎉 Fraud pattern simulation completed successfully!")

if __name__ == "__main__":
    main()