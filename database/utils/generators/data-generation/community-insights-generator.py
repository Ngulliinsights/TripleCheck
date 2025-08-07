#!/usr/bin/env python3
"""
Community Insights Data Generator
=================================

Generates community intelligence data for TripleCheck Kenya
including local knowledge, community reports, and neighborhood insights.
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

class CommunityInsightsGenerator:
    def __init__(self):
        self.kenyan_locations = [
            'Nairobi CBD', 'Westlands', 'Karen', 'Runda', 'Kileleshwa', 'Lavington',
            'Kilimani', 'Parklands', 'Eastleigh', 'South B', 'South C', 'Langata',
            'Kasarani', 'Roysambu', 'Thika Road', 'Ngong Road', 'Mombasa Road',
            'Kisumu Central', 'Nakuru Town', 'Eldoret', 'Thika', 'Machakos',
            'Kitengela', 'Ongata Rongai', 'Kikuyu', 'Limuru', 'Ruiru'
        ]
        
        self.community_roles = [
            'Local Elder', 'Area Chief', 'Church Leader', 'Business Owner',
            'Long-term Resident', 'Community Chairman', 'Women Group Leader',
            'Youth Leader', 'School Principal', 'Health Worker', 'Farmer',
            'Shopkeeper', 'Boda Boda Operator', 'Watchman', 'Teacher'
        ]
        
        self.insight_categories = [
            'property_history', 'ownership_disputes', 'boundary_issues',
            'neighborhood_safety', 'infrastructure', 'market_trends',
            'fraud_warnings', 'development_plans', 'environmental_concerns',
            'community_projects', 'local_governance', 'cultural_significance'
        ]
        
        self.credibility_factors = [
            'years_in_community', 'community_role', 'local_knowledge',
            'previous_accuracy', 'witness_corroboration', 'documentation_provided'
        ]
        
        self.kenyan_names = [
            'John Kamau', 'Mary Wanjiku', 'Peter Makau', 'Grace Njeri', 'David Kiprotich',
            'Sarah Achieng', 'James Maina', 'Ruth Wambui', 'Daniel Ochieng', 'Esther Nyong',
            'Michael Kimani', 'Ann Wanjiru', 'Joseph Mutua', 'Jane Mwende', 'Francis Kiplagat',
            'Lucy Chebet', 'Paul Otieno', 'Margaret Wairimu', 'Samuel Kiptoo', 'Catherine Adhiambo',
            'Moses Wekesa', 'Alice Nyambura', 'Simon Kibet', 'Eunice Wanjala', 'Robert Mwangi'
        ]

    def generate_community_member(self) -> Dict[str, Any]:
        """Generate a community member profile"""
        name = random.choice(self.kenyan_names)
        years_in_community = random.randint(1, 50)
        
        return {
            'member_id': str(uuid.uuid4()),
            'name': name,
            'phone': f"+254{random.randint(700000000, 799999999)}",
            'location': random.choice(self.kenyan_locations),
            'role': random.choice(self.community_roles),
            'years_in_community': years_in_community,
            'credibility_score': min(100, max(20, years_in_community * 2 + random.randint(-10, 20))),
            'reports_submitted': random.randint(0, 50),
            'reports_verified': random.randint(0, 30),
            'is_verified_member': random.choice([True, False]),
            'languages': random.sample(['English', 'Swahili', 'Kikuyu', 'Luo', 'Luhya', 'Kalenjin'], 
                                     random.randint(2, 4)),
            'created_at': (datetime.now() - timedelta(days=random.randint(30, 1825))).isoformat()
        }

    def generate_property_insight(self, property_id: str = None) -> Dict[str, Any]:
        """Generate community insight about a property"""
        if not property_id:
            property_id = f"PROP_{uuid.uuid4().hex[:8].upper()}"
        
        category = random.choice(self.insight_categories)
        member = self.generate_community_member()
        
        # Generate category-specific insights
        insight_content = self.generate_insight_content(category)
        
        return {
            'insight_id': str(uuid.uuid4()),
            'property_id': property_id,
            'reporter': member,
            'category': category,
            'title': insight_content['title'],
            'description': insight_content['description'],
            'severity': random.choice(['low', 'medium', 'high', 'critical']),
            'confidence_level': random.randint(60, 100),
            'supporting_evidence': insight_content['evidence'],
            'witnesses': [
                {
                    'name': random.choice(self.kenyan_names),
                    'phone': f"+254{random.randint(700000000, 799999999)}",
                    'relationship': random.choice(['neighbor', 'relative', 'friend', 'colleague'])
                }
                for _ in range(random.randint(0, 3))
            ],
            'verification_status': random.choice(['pending', 'verified', 'disputed', 'rejected']),
            'impact_score': random.randint(1, 10),
            'location_specific': True,
            'historical_context': insight_content['historical_context'],
            'recommended_action': insight_content['recommended_action'],
            'tags': insight_content['tags'],
            'created_at': (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
            'updated_at': datetime.now().isoformat()
        }

    def generate_insight_content(self, category: str) -> Dict[str, Any]:
        """Generate category-specific insight content"""
        content_templates = {
            'property_history': {
                'title': 'Historical Property Information',
                'description': f"This property was originally owned by {random.choice(self.kenyan_names)} in the {random.randint(1960, 2000)}s. The land was used for {random.choice(['farming', 'residential', 'commercial'])} purposes. There have been {random.randint(2, 5)} ownership changes over the years.",
                'evidence': ['Old photographs', 'Community records', 'Witness testimonies'],
                'historical_context': f"The area was developed in the {random.randint(1970, 1990)}s as part of government housing schemes.",
                'recommended_action': 'Verify ownership history with government records',
                'tags': ['history', 'ownership', 'development']
            },
            'ownership_disputes': {
                'title': 'Ownership Dispute Alert',
                'description': f"There is an ongoing dispute between {random.choice(self.kenyan_names)} and {random.choice(self.kenyan_names)} regarding the ownership of this property. The dispute started {random.randint(1, 5)} years ago.",
                'evidence': ['Court documents', 'Family testimonies', 'Traditional council records'],
                'historical_context': 'Dispute arose from inheritance issues after family patriarch passed away',
                'recommended_action': 'Check court records and family succession documents',
                'tags': ['dispute', 'inheritance', 'legal']
            },
            'boundary_issues': {
                'title': 'Boundary Encroachment Concern',
                'description': f"The neighbor at {fake.address()} has allegedly encroached on this property by approximately {random.randint(1, 10)} meters. This has been ongoing for {random.randint(6, 36)} months.",
                'evidence': ['Survey measurements', 'Neighbor complaints', 'Physical markers'],
                'historical_context': 'Original boundary markers were destroyed during road construction',
                'recommended_action': 'Conduct professional survey and restore boundary markers',
                'tags': ['boundary', 'encroachment', 'survey']
            },
            'neighborhood_safety': {
                'title': 'Neighborhood Security Information',
                'description': f"This area has experienced {random.randint(1, 5)} security incidents in the past year. The community has organized night patrols and installed security lights.",
                'evidence': ['Police reports', 'Community meeting minutes', 'Security records'],
                'historical_context': 'Security improved significantly after community policing initiative',
                'recommended_action': 'Contact local community policing group for current security status',
                'tags': ['security', 'safety', 'community']
            },
            'infrastructure': {
                'title': 'Infrastructure Development Update',
                'description': f"New {random.choice(['water', 'electricity', 'road', 'sewer'])} infrastructure is planned for this area. Construction is expected to begin in {random.randint(6, 24)} months.",
                'evidence': ['Government notices', 'Contractor announcements', 'Community meetings'],
                'historical_context': 'Area has been underserved with basic infrastructure for years',
                'recommended_action': 'Verify development plans with county government',
                'tags': ['infrastructure', 'development', 'government']
            },
            'market_trends': {
                'title': 'Local Market Trends',
                'description': f"Property values in this area have {random.choice(['increased', 'decreased', 'remained stable'])} by approximately {random.randint(5, 25)}% over the past year due to {random.choice(['new developments', 'infrastructure improvements', 'market conditions'])}.",
                'evidence': ['Recent sales data', 'Valuer assessments', 'Market reports'],
                'historical_context': 'Area has seen significant development interest recently',
                'recommended_action': 'Compare with recent sales in the neighborhood',
                'tags': ['market', 'valuation', 'trends']
            },
            'fraud_warnings': {
                'title': 'Fraud Alert',
                'description': f"Community members report suspicious activity involving fake documents and impersonation attempts. {random.choice(self.kenyan_names)} was allegedly involved in fraudulent property transactions.",
                'evidence': ['Witness statements', 'Fake documents', 'Police reports'],
                'historical_context': 'Several fraud cases reported in this area over past 2 years',
                'recommended_action': 'Exercise extreme caution and verify all documents thoroughly',
                'tags': ['fraud', 'warning', 'documents']
            }
        }
        
        return content_templates.get(category, content_templates['property_history'])

    def generate_community_report(self) -> Dict[str, Any]:
        """Generate a community-wide report"""
        location = random.choice(self.kenyan_locations)
        
        return {
            'report_id': str(uuid.uuid4()),
            'location': location,
            'report_type': random.choice(['monthly_summary', 'incident_report', 'development_update', 'safety_alert']),
            'title': f"{location} Community Report - {datetime.now().strftime('%B %Y')}",
            'summary': f"Community report covering {random.randint(10, 50)} properties and {random.randint(5, 20)} incidents in {location}.",
            'key_findings': [
                f"{random.randint(1, 5)} new property disputes reported",
                f"{random.randint(0, 3)} fraud cases investigated",
                f"{random.randint(2, 8)} boundary issues resolved",
                f"{random.randint(1, 4)} infrastructure projects announced"
            ],
            'active_disputes': random.randint(0, 10),
            'resolved_cases': random.randint(5, 25),
            'community_satisfaction': random.randint(60, 95),
            'safety_rating': random.randint(6, 10),
            'development_activity': random.choice(['high', 'medium', 'low']),
            'recommendations': [
                "Increase community policing patrols",
                "Establish boundary marker maintenance program",
                "Improve documentation of property histories",
                "Enhance fraud awareness education"
            ],
            'contributors': [
                self.generate_community_member() for _ in range(random.randint(3, 8))
            ],
            'created_at': datetime.now().isoformat(),
            'reporting_period': {
                'start_date': (datetime.now() - timedelta(days=30)).isoformat(),
                'end_date': datetime.now().isoformat()
            }
        }

    def generate_local_knowledge_base(self) -> Dict[str, Any]:
        """Generate local knowledge base entry"""
        location = random.choice(self.kenyan_locations)
        
        return {
            'knowledge_id': str(uuid.uuid4()),
            'location': location,
            'topic': random.choice([
                'Traditional Land Rights', 'Historical Boundaries', 'Cultural Sites',
                'Seasonal Patterns', 'Local Customs', 'Traditional Authorities',
                'Community Resources', 'Historical Events', 'Family Lineages'
            ]),
            'content': f"Traditional knowledge about {location} including historical land use patterns, customary ownership practices, and community governance structures.",
            'source_type': random.choice(['elder_testimony', 'community_records', 'oral_tradition', 'historical_documents']),
            'reliability_score': random.randint(70, 100),
            'cultural_significance': random.choice(['high', 'medium', 'low']),
            'preservation_status': random.choice(['well_documented', 'partially_documented', 'at_risk', 'lost']),
            'contributors': [
                {
                    'name': random.choice(self.kenyan_names),
                    'role': random.choice(['Community Elder', 'Traditional Authority', 'Local Historian']),
                    'years_of_knowledge': random.randint(20, 70)
                }
                for _ in range(random.randint(1, 3))
            ],
            'verification_method': random.choice(['cross_reference', 'multiple_sources', 'documentation', 'consensus']),
            'last_updated': datetime.now().isoformat(),
            'access_level': random.choice(['public', 'community_only', 'restricted'])
        }

    def generate_dataset(self, 
                        property_insights: int = 500,
                        community_reports: int = 50,
                        knowledge_entries: int = 100) -> Dict[str, List[Dict[str, Any]]]:
        """Generate complete community insights dataset"""
        
        print(f"🏘️  Generating community insights dataset...")
        print(f"   Property insights: {property_insights}")
        print(f"   Community reports: {community_reports}")
        print(f"   Knowledge base entries: {knowledge_entries}")
        
        dataset = {
            'property_insights': [],
            'community_reports': [],
            'local_knowledge': []
        }
        
        # Generate property insights
        print("📊 Generating property insights...")
        for i in range(property_insights):
            if i % 100 == 0:
                print(f"   Generated {i} property insights...")
            dataset['property_insights'].append(self.generate_property_insight())
        
        # Generate community reports
        print("📋 Generating community reports...")
        for i in range(community_reports):
            if i % 10 == 0:
                print(f"   Generated {i} community reports...")
            dataset['community_reports'].append(self.generate_community_report())
        
        # Generate local knowledge base
        print("📚 Generating local knowledge entries...")
        for i in range(knowledge_entries):
            if i % 25 == 0:
                print(f"   Generated {i} knowledge entries...")
            dataset['local_knowledge'].append(self.generate_local_knowledge_base())
        
        return dataset

def main():
    parser = argparse.ArgumentParser(description='Generate Community Insights Data')
    parser.add_argument('--property-insights', type=int, default=500, help='Number of property insights')
    parser.add_argument('--community-reports', type=int, default=50, help='Number of community reports')
    parser.add_argument('--knowledge-entries', type=int, default=100, help='Number of knowledge base entries')
    parser.add_argument('--output', type=str, default='community_insights_dataset.json', help='Output file path')
    
    args = parser.parse_args()
    
    print("🚀 Starting Community Insights Data Generation")
    print("=" * 50)
    
    generator = CommunityInsightsGenerator()
    
    # Generate dataset
    dataset = generator.generate_dataset(
        property_insights=args.property_insights,
        community_reports=args.community_reports,
        knowledge_entries=args.knowledge_entries
    )
    
    # Calculate statistics
    total_insights = len(dataset['property_insights'])
    verified_insights = len([i for i in dataset['property_insights'] if i['verification_status'] == 'verified'])
    high_confidence = len([i for i in dataset['property_insights'] if i['confidence_level'] >= 80])
    
    # Save dataset
    output_path = os.path.join(os.path.dirname(__file__), args.output)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    
    # Generate statistics
    stats = {
        'total_property_insights': total_insights,
        'verified_insights': verified_insights,
        'high_confidence_insights': high_confidence,
        'community_reports': len(dataset['community_reports']),
        'knowledge_entries': len(dataset['local_knowledge']),
        'locations_covered': len(set(i['reporter']['location'] for i in dataset['property_insights'])),
        'insight_categories': {
            category: len([i for i in dataset['property_insights'] if i['category'] == category])
            for category in generator.insight_categories
        },
        'verification_rates': {
            status: len([i for i in dataset['property_insights'] if i['verification_status'] == status])
            for status in ['pending', 'verified', 'disputed', 'rejected']
        }
    }
    
    # Save statistics
    stats_path = os.path.join(os.path.dirname(__file__), 'community_insights_statistics.json')
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Generated community insights dataset")
    print(f"💾 Dataset saved to {output_path}")
    print(f"📊 Statistics saved to {stats_path}")
    print(f"📈 Dataset Statistics:")
    print(f"   Property Insights: {stats['total_property_insights']:,}")
    print(f"   Verified Insights: {stats['verified_insights']:,} ({stats['verified_insights']/stats['total_property_insights']:.1%})")
    print(f"   High Confidence: {stats['high_confidence_insights']:,} ({stats['high_confidence_insights']/stats['total_property_insights']:.1%})")
    print(f"   Community Reports: {stats['community_reports']:,}")
    print(f"   Knowledge Entries: {stats['knowledge_entries']:,}")
    print(f"   Locations Covered: {stats['locations_covered']}")
    
    print("\n🎉 Community insights data generation completed successfully!")

if __name__ == "__main__":
    main()