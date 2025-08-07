#!/usr/bin/env python3
"""
Fraud Reports Data Generator
===========================

Generates comprehensive fraud detection and reporting data for TripleCheck Kenya
including fraud alerts, investigation reports, and prevention intelligence.
"""

import json
import random
import uuid
from datetime import datetime, timedelta
from faker import Faker
import pandas as pd
import numpy as np
from typing import Dict, List, Any
import argparse
import os

# Initialize Faker with Kenya locale
fake = Faker(['en_KE', 'en_US'])

class FraudReportsGenerator:
    def __init__(self):
        self.fraud_types = [
            'document_forgery', 'identity_theft', 'property_value_manipulation',
            'straw_buyer_scheme', 'mortgage_fraud', 'title_deed_duplication',
            'boundary_manipulation', 'inheritance_fraud', 'government_corruption',
            'fake_succession', 'illegal_subdivision', 'phantom_properties'
        ]
        
        self.fraud_severity_levels = ['low', 'medium', 'high', 'critical']
        
        self.investigation_statuses = [
            'reported', 'under_investigation', 'evidence_gathering',
            'suspect_identified', 'case_closed', 'referred_to_police',
            'court_proceedings', 'resolved', 'dismissed'
        ]
        
        self.evidence_types = [
            'forged_documents', 'fake_signatures', 'altered_dates',
            'suspicious_transactions', 'witness_testimony', 'digital_evidence',
            'financial_records', 'communication_logs', 'surveillance_footage',
            'expert_analysis', 'government_records', 'court_documents'
        ]
        
        self.kenyan_locations = [
            'Nairobi CBD', 'Westlands', 'Karen', 'Runda', 'Kileleshwa', 'Lavington',
            'Kilimani', 'Parklands', 'Eastleigh', 'South B', 'South C', 'Langata',
            'Kasarani', 'Roysambu', 'Kisumu', 'Nakuru', 'Eldoret', 'Mombasa',
            'Thika', 'Machakos', 'Kitengela', 'Ongata Rongai'
        ]
        
        self.kenyan_names = [
            'John Kamau', 'Mary Wanjiku', 'Peter Makau', 'Grace Njeri', 'David Kiprotich',
            'Sarah Achieng', 'James Maina', 'Ruth Wambui', 'Daniel Ochieng', 'Esther Nyong',
            'Michael Kimani', 'Ann Wanjiru', 'Joseph Mutua', 'Jane Mwende', 'Francis Kiplagat',
            'Lucy Chebet', 'Paul Otieno', 'Margaret Wairimu', 'Samuel Kiptoo', 'Catherine Adhiambo'
        ]
        
        self.law_enforcement_agencies = [
            'Kenya Police Service', 'Directorate of Criminal Investigations (DCI)',
            'Ethics and Anti-Corruption Commission (EACC)', 'Asset Recovery Agency',
            'Financial Reporting Centre', 'Kenya Revenue Authority',
            'National Land Commission', 'Ministry of Lands'
        ]

    def generate_fraud_alert(self) -> Dict[str, Any]:
        """Generate a fraud alert"""
        fraud_type = random.choice(self.fraud_types)
        severity = random.choice(self.fraud_severity_levels)
        location = random.choice(self.kenyan_locations)
        
        # Generate severity-based details
        affected_count = {
            'low': random.randint(1, 5),
            'medium': random.randint(5, 20),
            'high': random.randint(20, 100),
            'critical': random.randint(100, 500)
        }[severity]
        
        financial_impact = {
            'low': random.randint(100000, 1000000),
            'medium': random.randint(1000000, 10000000),
            'high': random.randint(10000000, 100000000),
            'critical': random.randint(100000000, 1000000000)
        }[severity]
        
        return {
            'alert_id': str(uuid.uuid4()),
            'fraud_type': fraud_type,
            'severity': severity,
            'title': self.generate_alert_title(fraud_type, severity),
            'description': self.generate_alert_description(fraud_type, location),
            'location': location,
            'affected_properties_count': affected_count,
            'estimated_financial_impact': financial_impact,
            'time_detected': (datetime.now() - timedelta(hours=random.randint(1, 168))).isoformat(),
            'detection_method': random.choice([
                'automated_system', 'community_report', 'expert_analysis',
                'government_audit', 'whistleblower', 'routine_investigation'
            ]),
            'confidence_level': random.randint(60, 100),
            'status': random.choice(['active', 'investigating', 'resolved', 'false_alarm']),
            'priority_level': random.randint(1, 10),
            'evidence_available': random.choice([True, False]),
            'suspects_identified': random.choice([True, False]),
            'law_enforcement_notified': random.choice([True, False]),
            'public_warning_issued': random.choice([True, False]),
            'prevention_measures': self.generate_prevention_measures(fraud_type),
            'related_cases': [str(uuid.uuid4()) for _ in range(random.randint(0, 3))],
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }

    def generate_alert_title(self, fraud_type: str, severity: str) -> str:
        """Generate alert title based on fraud type and severity"""
        titles = {
            'document_forgery': f"{severity.title()} Document Forgery Alert",
            'identity_theft': f"{severity.title()} Identity Theft Warning",
            'property_value_manipulation': f"{severity.title()} Property Value Fraud Alert",
            'straw_buyer_scheme': f"{severity.title()} Straw Buyer Scheme Detected",
            'mortgage_fraud': f"{severity.title()} Mortgage Fraud Alert",
            'title_deed_duplication': f"{severity.title()} Duplicate Title Deed Warning",
            'boundary_manipulation': f"{severity.title()} Boundary Fraud Alert",
            'inheritance_fraud': f"{severity.title()} Inheritance Fraud Warning"
        }
        return titles.get(fraud_type, f"{severity.title()} Fraud Alert")

    def generate_alert_description(self, fraud_type: str, location: str) -> str:
        """Generate detailed alert description"""
        descriptions = {
            'document_forgery': f"Multiple cases of forged property documents detected in {location}. Fraudsters are using sophisticated techniques to create fake title deeds and sale agreements.",
            'identity_theft': f"Identity theft cases reported in {location} involving stolen IDs used for property transactions. Victims' identities being used without consent.",
            'property_value_manipulation': f"Artificial inflation of property values detected in {location}. Properties being overvalued to facilitate fraudulent loans and sales.",
            'straw_buyer_scheme': f"Straw buyer operations identified in {location}. Individuals being used to hide true property ownership and circumvent regulations.",
            'mortgage_fraud': f"Fraudulent mortgage applications detected in {location}. False income statements and forged employment records being used.",
            'title_deed_duplication': f"Duplicate title deeds discovered in {location}. Same property being sold to multiple buyers using fake documentation."
        }
        return descriptions.get(fraud_type, f"Fraud activity detected in {location}. Investigation ongoing.")

    def generate_prevention_measures(self, fraud_type: str) -> List[str]:
        """Generate prevention measures for specific fraud types"""
        measures = {
            'document_forgery': [
                "Verify all documents with issuing authorities",
                "Use digital verification systems",
                "Check for security features on official documents",
                "Cross-reference with government databases"
            ],
            'identity_theft': [
                "Verify identity documents in person",
                "Use biometric verification when available",
                "Check for recent address changes",
                "Confirm identity with multiple sources"
            ],
            'property_value_manipulation': [
                "Obtain independent property valuations",
                "Compare with recent market sales",
                "Use certified property valuers",
                "Check historical price trends"
            ],
            'straw_buyer_scheme': [
                "Verify buyer's financial capacity",
                "Check for unusual payment sources",
                "Investigate buyer's property history",
                "Monitor for rapid property transfers"
            ]
        }
        return measures.get(fraud_type, ["Exercise due diligence", "Verify all documentation", "Report suspicious activity"])

    def generate_investigation_report(self) -> Dict[str, Any]:
        """Generate a fraud investigation report"""
        fraud_type = random.choice(self.fraud_types)
        status = random.choice(self.investigation_statuses)
        
        return {
            'investigation_id': str(uuid.uuid4()),
            'case_number': f"FR-{datetime.now().year}-{random.randint(1000, 9999)}",
            'fraud_type': fraud_type,
            'title': f"Investigation Report: {fraud_type.replace('_', ' ').title()}",
            'summary': f"Comprehensive investigation into {fraud_type.replace('_', ' ')} activities involving multiple properties and suspects.",
            'status': status,
            'priority': random.choice(['low', 'medium', 'high', 'urgent']),
            'lead_investigator': {
                'name': random.choice(self.kenyan_names),
                'badge_number': f"INV-{random.randint(1000, 9999)}",
                'department': 'Fraud Investigation Unit',
                'contact': f"+254{random.randint(700000000, 799999999)}"
            },
            'case_details': {
                'date_opened': (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
                'location': random.choice(self.kenyan_locations),
                'estimated_loss': random.randint(1000000, 500000000),
                'properties_involved': random.randint(1, 10),
                'suspects_count': random.randint(1, 5),
                'victims_count': random.randint(1, 20)
            },
            'suspects': [
                {
                    'suspect_id': str(uuid.uuid4()),
                    'name': random.choice(self.kenyan_names),
                    'id_number': f"{random.randint(10000000, 99999999)}",
                    'known_aliases': [fake.name() for _ in range(random.randint(0, 2))],
                    'role_in_fraud': random.choice(['mastermind', 'accomplice', 'document_forger', 'straw_buyer']),
                    'previous_convictions': random.choice([True, False]),
                    'status': random.choice(['at_large', 'arrested', 'charged', 'convicted'])
                }
                for _ in range(random.randint(1, 3))
            ],
            'evidence_collected': [
                {
                    'evidence_id': str(uuid.uuid4()),
                    'type': random.choice(self.evidence_types),
                    'description': f"Evidence related to {fraud_type}",
                    'collection_date': (datetime.now() - timedelta(days=random.randint(1, 100))).isoformat(),
                    'chain_of_custody': True,
                    'admissible_in_court': random.choice([True, False])
                }
                for _ in range(random.randint(2, 8))
            ],
            'timeline': [
                {
                    'date': (datetime.now() - timedelta(days=random.randint(1, 200))).isoformat(),
                    'event': random.choice([
                        'Initial fraud report received',
                        'Investigation opened',
                        'Evidence collected',
                        'Suspect interviewed',
                        'Search warrant executed',
                        'Charges filed',
                        'Court hearing scheduled'
                    ]),
                    'details': f"Investigation milestone in {fraud_type} case"
                }
                for _ in range(random.randint(3, 10))
            ],
            'financial_analysis': {
                'total_fraud_amount': random.randint(5000000, 1000000000),
                'recovered_amount': random.randint(0, 50000000),
                'outstanding_amount': random.randint(1000000, 500000000),
                'assets_frozen': random.choice([True, False]),
                'recovery_prospects': random.choice(['excellent', 'good', 'fair', 'poor'])
            },
            'law_enforcement_cooperation': {
                'agencies_involved': random.sample(self.law_enforcement_agencies, random.randint(1, 3)),
                'international_cooperation': random.choice([True, False]),
                'joint_task_force': random.choice([True, False])
            },
            'recommendations': [
                "Strengthen document verification processes",
                "Enhance inter-agency cooperation",
                "Improve public awareness campaigns",
                "Implement stricter penalties for fraud"
            ],
            'next_steps': [
                "Continue evidence gathering",
                "Interview additional witnesses",
                "Coordinate with prosecution",
                "Prepare court documents"
            ],
            'created_at': datetime.now().isoformat(),
            'last_updated': datetime.now().isoformat()
        }

    def generate_fraud_trend_analysis(self) -> Dict[str, Any]:
        """Generate fraud trend analysis report"""
        return {
            'analysis_id': str(uuid.uuid4()),
            'report_title': f"Fraud Trends Analysis - {datetime.now().strftime('%B %Y')}",
            'analysis_period': {
                'start_date': (datetime.now() - timedelta(days=90)).isoformat(),
                'end_date': datetime.now().isoformat()
            },
            'total_cases_analyzed': random.randint(100, 1000),
            'fraud_type_distribution': {
                fraud_type: random.randint(5, 50)
                for fraud_type in self.fraud_types
            },
            'geographic_distribution': {
                location: random.randint(1, 20)
                for location in self.kenyan_locations
            },
            'severity_breakdown': {
                'critical': random.randint(5, 20),
                'high': random.randint(20, 50),
                'medium': random.randint(30, 80),
                'low': random.randint(40, 100)
            },
            'financial_impact': {
                'total_reported_losses': random.randint(1000000000, 10000000000),
                'average_loss_per_case': random.randint(5000000, 50000000),
                'recovered_amount': random.randint(100000000, 1000000000),
                'recovery_rate': random.uniform(0.1, 0.4)
            },
            'detection_methods': {
                'automated_systems': random.randint(20, 40),
                'community_reports': random.randint(15, 35),
                'expert_analysis': random.randint(10, 25),
                'government_audits': random.randint(5, 15),
                'whistleblowers': random.randint(3, 12)
            },
            'emerging_patterns': [
                "Increased use of digital document forgery",
                "Cross-border fraud operations",
                "Targeting of high-value properties",
                "Exploitation of inheritance disputes",
                "Use of shell companies for property acquisition"
            ],
            'risk_factors': [
                "Rapid property value appreciation",
                "Weak document verification systems",
                "Limited inter-agency coordination",
                "Insufficient public awareness",
                "Complex inheritance laws"
            ],
            'prevention_effectiveness': {
                'document_verification': random.uniform(0.6, 0.9),
                'community_reporting': random.uniform(0.4, 0.7),
                'expert_analysis': random.uniform(0.7, 0.95),
                'law_enforcement': random.uniform(0.5, 0.8)
            },
            'recommendations': [
                "Implement blockchain-based document verification",
                "Enhance community education programs",
                "Strengthen inter-agency data sharing",
                "Develop AI-powered fraud detection systems",
                "Establish specialized fraud courts"
            ],
            'forecast': {
                'expected_trend': random.choice(['increasing', 'stable', 'decreasing']),
                'high_risk_areas': random.sample(self.kenyan_locations, 3),
                'emerging_fraud_types': ['digital_identity_theft', 'ai_generated_documents', 'cryptocurrency_fraud']
            },
            'created_at': datetime.now().isoformat()
        }

    def generate_dataset(self, 
                        fraud_alerts: int = 200,
                        investigation_reports: int = 50,
                        trend_analyses: int = 12) -> Dict[str, List[Dict[str, Any]]]:
        """Generate complete fraud reports dataset"""
        
        print(f"🚨 Generating fraud reports dataset...")
        print(f"   Fraud alerts: {fraud_alerts}")
        print(f"   Investigation reports: {investigation_reports}")
        print(f"   Trend analyses: {trend_analyses}")
        
        dataset = {
            'fraud_alerts': [],
            'investigation_reports': [],
            'trend_analyses': []
        }
        
        # Generate fraud alerts
        print("🚨 Generating fraud alerts...")
        for i in range(fraud_alerts):
            if i % 50 == 0:
                print(f"   Generated {i} fraud alerts...")
            dataset['fraud_alerts'].append(self.generate_fraud_alert())
        
        # Generate investigation reports
        print("🔍 Generating investigation reports...")
        for i in range(investigation_reports):
            if i % 10 == 0:
                print(f"   Generated {i} investigation reports...")
            dataset['investigation_reports'].append(self.generate_investigation_report())
        
        # Generate trend analyses
        print("📈 Generating trend analyses...")
        for i in range(trend_analyses):
            if i % 5 == 0:
                print(f"   Generated {i} trend analyses...")
            dataset['trend_analyses'].append(self.generate_fraud_trend_analysis())
        
        return dataset

def main():
    parser = argparse.ArgumentParser(description='Generate Fraud Reports Data')
    parser.add_argument('--fraud-alerts', type=int, default=200, help='Number of fraud alerts')
    parser.add_argument('--investigation-reports', type=int, default=50, help='Number of investigation reports')
    parser.add_argument('--trend-analyses', type=int, default=12, help='Number of trend analyses')
    parser.add_argument('--output', type=str, default='fraud_reports_dataset.json', help='Output file path')
    
    args = parser.parse_args()
    
    print("🚀 Starting Fraud Reports Data Generation")
    print("=" * 50)
    
    generator = FraudReportsGenerator()
    
    # Generate dataset
    dataset = generator.generate_dataset(
        fraud_alerts=args.fraud_alerts,
        investigation_reports=args.investigation_reports,
        trend_analyses=args.trend_analyses
    )
    
    # Calculate statistics
    total_alerts = len(dataset['fraud_alerts'])
    critical_alerts = len([a for a in dataset['fraud_alerts'] if a['severity'] == 'critical'])
    active_investigations = len([r for r in dataset['investigation_reports'] if r['status'] in ['under_investigation', 'evidence_gathering']])
    
    # Save dataset
    output_path = os.path.join(os.path.dirname(__file__), args.output)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    
    # Generate statistics
    stats = {
        'total_fraud_alerts': total_alerts,
        'critical_alerts': critical_alerts,
        'investigation_reports': len(dataset['investigation_reports']),
        'active_investigations': active_investigations,
        'trend_analyses': len(dataset['trend_analyses']),
        'fraud_type_distribution': {
            fraud_type: len([a for a in dataset['fraud_alerts'] if a['fraud_type'] == fraud_type])
            for fraud_type in generator.fraud_types
        },
        'severity_distribution': {
            severity: len([a for a in dataset['fraud_alerts'] if a['severity'] == severity])
            for severity in generator.fraud_severity_levels
        },
        'locations_affected': len(set(a['location'] for a in dataset['fraud_alerts']))
    }
    
    # Save statistics
    stats_path = os.path.join(os.path.dirname(__file__), 'fraud_reports_statistics.json')
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Generated fraud reports dataset")
    print(f"💾 Dataset saved to {output_path}")
    print(f"📊 Statistics saved to {stats_path}")
    print(f"📈 Dataset Statistics:")
    print(f"   Fraud Alerts: {stats['total_fraud_alerts']:,}")
    print(f"   Critical Alerts: {stats['critical_alerts']:,} ({stats['critical_alerts']/stats['total_fraud_alerts']:.1%})")
    print(f"   Investigation Reports: {stats['investigation_reports']:,}")
    print(f"   Active Investigations: {stats['active_investigations']:,}")
    print(f"   Trend Analyses: {stats['trend_analyses']:,}")
    print(f"   Locations Affected: {stats['locations_affected']}")
    
    print("\n🎉 Fraud reports data generation completed successfully!")

if __name__ == "__main__":
    main()