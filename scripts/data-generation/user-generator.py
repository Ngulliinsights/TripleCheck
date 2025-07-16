#!/usr/bin/env python3
"""
TripleCheck User Profile and Transaction History Generation Script
Based on Prompt 2: User Profile and Transaction History Generation

This script generates realistic user profiles and transaction histories
for training fraud detection models.
"""

import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import json
import uuid
from faker import Faker

class UserDataGenerator:
    def __init__(self):
        # Initialize Faker for realistic data generation
        self.fake = Faker(['en_US'])  # US locale (Kenya-specific names handled separately)
        
        # Kenya-specific data
        self.kenyan_names = {
            'first_names': [
                'John', 'Mary', 'Peter', 'Grace', 'David', 'Sarah', 'James', 'Jane',
                'Michael', 'Elizabeth', 'Daniel', 'Margaret', 'Joseph', 'Catherine',
                'Samuel', 'Ann', 'Paul', 'Joyce', 'Francis', 'Rose', 'Anthony',
                'Lucy', 'Stephen', 'Nancy', 'Robert', 'Susan', 'Charles', 'Helen'
            ],
            'last_names': [
                'Kamau', 'Wanjiku', 'Mwangi', 'Njeri', 'Kiprotich', 'Achieng',
                'Otieno', 'Wambui', 'Kiplagat', 'Nyong\'o', 'Mutua', 'Wairimu',
                'Kiptoo', 'Adhiambo', 'Macharia', 'Wanjiru', 'Kimani', 'Njoki',
                'Rotich', 'Awino', 'Ochieng', 'Wangari', 'Cheruiyot', 'Akinyi'
            ]
        }
        
        self.user_types = {
            'buyer': {'weight': 0.45, 'transaction_frequency': (1, 3)},
            'seller': {'weight': 0.25, 'transaction_frequency': (1, 5)},
            'agent': {'weight': 0.15, 'transaction_frequency': (10, 50)},
            'investor': {'weight': 0.15, 'transaction_frequency': (3, 15)}
        }
        
        self.transaction_types = ['buy', 'sell', 'refinance', 'lease', 'rent']
        
        # Suspicious behavior patterns
        self.suspicious_patterns = [
            'rapid_flipping',      # Quick buy-sell cycles
            'high_frequency',      # Unusually high transaction volume
            'round_amounts',       # Suspiciously round transaction amounts
            'geographic_spread',   # Transactions across wide geographic areas
            'identity_inconsistency'  # Inconsistent personal information
        ]

    def generate_user_id(self) -> str:
        """Generate unique user ID"""
        return f"USER_{uuid.uuid4().hex[:8].upper()}"

    def generate_kenyan_name(self) -> Tuple[str, str]:
        """Generate realistic Kenyan name"""
        first_name = random.choice(self.kenyan_names['first_names'])
        last_name = random.choice(self.kenyan_names['last_names'])
        return first_name, last_name

    def generate_phone_number(self) -> str:
        """Generate realistic Kenyan phone number"""
        # Kenyan mobile numbers start with +254 7xx, 1xx, or 0xx
        prefixes = ['0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709',
                   '0710', '0711', '0712', '0713', '0714', '0715', '0716', '0717', '0718', '0719',
                   '0720', '0721', '0722', '0723', '0724', '0725', '0726', '0727', '0728', '0729']
        prefix = random.choice(prefixes)
        suffix = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        return f"+254{prefix[1:]}{suffix}"

    def generate_email(self, first_name: str, last_name: str) -> str:
        """Generate realistic email address"""
        domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'safaricom.co.ke']
        patterns = [
            f"{first_name.lower()}.{last_name.lower()}",
            f"{first_name.lower()}{last_name.lower()}",
            f"{first_name.lower()}{random.randint(1, 999)}",
            f"{first_name[0].lower()}{last_name.lower()}",
            f"{first_name.lower()}_{last_name.lower()}"
        ]
        email_base = random.choice(patterns)
        domain = random.choice(domains)
        return f"{email_base}@{domain}"

    def generate_address(self) -> Dict[str, str]:
        """Generate realistic Kenyan address"""
        locations = {
            'Nairobi': ['Kilimani', 'Karen', 'Westlands', 'Runda', 'Lavington'],
            'Mombasa': ['Nyali', 'Bamburi', 'Diani', 'Tudor'],
            'Kisumu': ['Milimani', 'Tom Mboya', 'Kondele'],
            'Nakuru': ['Milimani', 'Section 58', 'Flamingo']
        }
        
        city = random.choice(list(locations.keys()))
        area = random.choice(locations[city])
        
        return {
            'street': f"{random.randint(1, 999)} {area} Road",
            'area': area,
            'city': city,
            'postal_code': f"{random.randint(10000, 99999)}",
            'country': 'Kenya'
        }

    def generate_user_profile(self, is_suspicious: bool = False) -> Dict:
        """Generate a single user profile"""
        user_id = self.generate_user_id()
        first_name, last_name = self.generate_kenyan_name()
        
        # Select user type based on weights
        user_type = random.choices(
            list(self.user_types.keys()),
            weights=[self.user_types[ut]['weight'] for ut in self.user_types.keys()]
        )[0]
        
        # Generate birth date (18-80 years old)
        birth_date = self.fake.date_of_birth(minimum_age=18, maximum_age=80)
        
        # Generate account creation date (within last 10 years)
        account_created = self.fake.date_between(start_date='-10y', end_date='today')
        
        # Generate address
        address = self.generate_address()
        
        # Generate contact information
        email = self.generate_email(first_name, last_name)
        phone = self.generate_phone_number()
        
        # Introduce suspicious patterns
        if is_suspicious:
            suspicious_pattern = random.choice(self.suspicious_patterns)
            if suspicious_pattern == 'identity_inconsistency':
                # Introduce inconsistencies in personal information
                if random.choice([True, False]):
                    # Inconsistent name in email
                    fake_first = random.choice(self.kenyan_names['first_names'])
                    email = self.generate_email(fake_first, last_name)
                else:
                    # Suspicious phone number pattern
                    phone = f"+254{random.randint(100000000, 999999999)}"
        
        user_profile = {
            'id': user_id,
            'firstName': first_name,
            'lastName': last_name,
            'fullName': f"{first_name} {last_name}",
            'dateOfBirth': birth_date.isoformat(),
            'email': email,
            'phone': phone,
            'address': address,
            'userType': user_type,
            'accountCreated': account_created.isoformat(),
            'isVerified': random.choice([True, False]),
            'trustScore': random.randint(0, 100),
            'isSuspicious': is_suspicious,
            'suspiciousPattern': suspicious_pattern if is_suspicious else None,
            'createdAt': datetime.now().isoformat(),
            'updatedAt': datetime.now().isoformat()
        }
        
        return user_profile

    def generate_transaction_history(self, user: Dict, property_ids: List[str]) -> List[Dict]:
        """Generate transaction history for a user"""
        user_type = user['userType']
        is_suspicious = user['isSuspicious']
        
        # Determine number of transactions based on user type and suspicious status
        freq_range = self.user_types[user_type]['transaction_frequency']
        base_transactions = random.randint(freq_range[0], freq_range[1])
        
        if is_suspicious:
            suspicious_pattern = user.get('suspiciousPattern')
            if suspicious_pattern == 'high_frequency':
                base_transactions *= random.randint(3, 8)  # Unusually high frequency
            elif suspicious_pattern == 'rapid_flipping':
                base_transactions = random.randint(10, 25)  # Many quick transactions
        
        transactions = []
        account_created = datetime.fromisoformat(user['accountCreated'])
        
        for i in range(base_transactions):
            # Generate transaction date (between account creation and now)
            transaction_date = self.fake.date_between(
                start_date=account_created.date(),
                end_date=datetime.now().date()
            )
            
            # Select transaction type based on user type
            if user_type == 'buyer':
                transaction_type = random.choices(['buy', 'refinance'], weights=[0.8, 0.2])[0]
            elif user_type == 'seller':
                transaction_type = random.choices(['sell', 'lease'], weights=[0.7, 0.3])[0]
            elif user_type == 'agent':
                transaction_type = random.choice(['buy', 'sell', 'lease', 'rent'])
            else:  # investor
                transaction_type = random.choices(['buy', 'sell'], weights=[0.6, 0.4])[0]
            
            # Select property
            property_id = random.choice(property_ids)
            
            # Generate transaction amount
            base_amount = random.randint(5000000, 50000000)  # 5M to 50M KES
            
            if is_suspicious:
                if user.get('suspiciousPattern') == 'round_amounts':
                    # Suspiciously round amounts
                    base_amount = round(base_amount / 1000000) * 1000000
                elif user.get('suspiciousPattern') == 'rapid_flipping':
                    # Quick profit margins
                    if i > 0 and transaction_type == 'sell':
                        base_amount *= random.uniform(1.3, 2.0)  # High profit margin
            
            # Generate other parties involved
            other_parties = []
            if user_type != 'agent':
                other_parties.append({
                    'type': 'agent',
                    'name': f"{random.choice(self.kenyan_names['first_names'])} {random.choice(self.kenyan_names['last_names'])}",
                    'id': f"AGENT_{uuid.uuid4().hex[:6].upper()}"
                })
            
            if transaction_type in ['buy', 'refinance']:
                other_parties.append({
                    'type': 'bank',
                    'name': random.choice(['KCB Bank', 'Equity Bank', 'Cooperative Bank', 'NCBA Bank', 'Absa Bank']),
                    'id': f"BANK_{uuid.uuid4().hex[:6].upper()}"
                })
            
            transaction = {
                'id': f"TXN_{uuid.uuid4().hex[:8].upper()}",
                'userId': user['id'],
                'propertyId': property_id,
                'transactionType': transaction_type,
                'transactionDate': transaction_date.isoformat(),
                'amount': int(base_amount),
                'otherParties': other_parties,
                'status': random.choices(['completed', 'pending', 'cancelled'], weights=[0.85, 0.1, 0.05])[0],
                'isSuspicious': is_suspicious and random.choice([True, False]),
                'createdAt': datetime.now().isoformat(),
                'updatedAt': datetime.now().isoformat()
            }
            
            transactions.append(transaction)
        
        # Sort transactions by date
        transactions.sort(key=lambda x: x['transactionDate'])
        
        return transactions

    def generate_dataset(self, total_users: int = 50000, suspicious_rate: float = 0.02, 
                        property_ids: List[str] = None) -> Tuple[List[Dict], List[Dict]]:
        """Generate complete user and transaction dataset"""
        print(f"👥 Generating {total_users:,} user profiles...")
        print(f"📊 Suspicious users: {suspicious_rate*100:.1f}%")
        
        if property_ids is None:
            # Generate dummy property IDs if none provided
            property_ids = [f"PROP_{uuid.uuid4().hex[:8].upper()}" for _ in range(1000)]
        
        users = []
        all_transactions = []
        suspicious_count = int(total_users * suspicious_rate)
        
        # Generate suspicious users
        for i in range(suspicious_count):
            if i % 100 == 0:
                print(f"   Generated {i:,} suspicious users...")
            user = self.generate_user_profile(is_suspicious=True)
            users.append(user)
            
            # Generate transactions for this user
            transactions = self.generate_transaction_history(user, property_ids)
            all_transactions.extend(transactions)
        
        # Generate legitimate users
        for i in range(total_users - suspicious_count):
            if i % 2000 == 0:
                print(f"   Generated {i:,} legitimate users...")
            user = self.generate_user_profile(is_suspicious=False)
            users.append(user)
            
            # Generate transactions for this user
            transactions = self.generate_transaction_history(user, property_ids)
            all_transactions.extend(transactions)
        
        # Shuffle datasets
        random.shuffle(users)
        random.shuffle(all_transactions)
        
        print(f"✅ Generated {len(users):,} users and {len(all_transactions):,} transactions")
        return users, all_transactions

    def save_datasets(self, users: List[Dict], transactions: List[Dict], 
                     users_filename: str = "user_dataset.json",
                     transactions_filename: str = "transaction_dataset.json"):
        """Save datasets to JSON files"""
        with open(users_filename, 'w') as f:
            json.dump(users, f, indent=2, default=str)
        print(f"💾 Users dataset saved to {users_filename}")
        
        with open(transactions_filename, 'w') as f:
            json.dump(transactions, f, indent=2, default=str)
        print(f"💾 Transactions dataset saved to {transactions_filename}")

    def generate_statistics(self, users: List[Dict], transactions: List[Dict]) -> Dict:
        """Generate dataset statistics"""
        users_df = pd.DataFrame(users)
        transactions_df = pd.DataFrame(transactions)
        
        stats = {
            'users': {
                'total_users': len(users),
                'suspicious_users': len(users_df[users_df['isSuspicious'] == True]),
                'user_types': users_df['userType'].value_counts().to_dict(),
                'cities': users_df.apply(lambda x: x['address']['city'], axis=1).value_counts().to_dict(),
                'verified_users': len(users_df[users_df['isVerified'] == True])
            },
            'transactions': {
                'total_transactions': len(transactions),
                'suspicious_transactions': len(transactions_df[transactions_df['isSuspicious'] == True]),
                'transaction_types': transactions_df['transactionType'].value_counts().to_dict(),
                'transaction_status': transactions_df['status'].value_counts().to_dict(),
                'amount_statistics': {
                    'mean': float(transactions_df['amount'].mean()),
                    'median': float(transactions_df['amount'].median()),
                    'min': float(transactions_df['amount'].min()),
                    'max': float(transactions_df['amount'].max()),
                    'std': float(transactions_df['amount'].std())
                }
            }
        }
        
        return stats

def main():
    """Main execution function"""
    print("🚀 Starting TripleCheck User Data Generation")
    
    # Initialize generator
    generator = UserDataGenerator()
    
    # Generate dataset
    users, transactions = generator.generate_dataset(total_users=5000, suspicious_rate=0.02)  # Start with 5k for testing
    
    # Save datasets
    generator.save_datasets(
        users, transactions,
        "scripts/data-generation/user_dataset.json",
        "scripts/data-generation/transaction_dataset.json"
    )
    
    # Generate and save statistics
    stats = generator.generate_statistics(users, transactions)
    with open("scripts/data-generation/user_statistics.json", 'w') as f:
        json.dump(stats, f, indent=2, default=str)
    
    print("\n📊 Dataset Statistics:")
    print(f"Total Users: {stats['users']['total_users']:,}")
    print(f"Suspicious Users: {stats['users']['suspicious_users']:,} ({stats['users']['suspicious_users']/stats['users']['total_users']*100:.1f}%)")
    print(f"Total Transactions: {stats['transactions']['total_transactions']:,}")
    print(f"Average Transaction: KES {stats['transactions']['amount_statistics']['mean']:,.0f}")
    
    print("\n🎉 User data generation completed successfully!")

if __name__ == "__main__":
    main()