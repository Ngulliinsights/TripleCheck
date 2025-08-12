# TripleCheck Data Generation System

This comprehensive data generation system creates realistic training data for the TripleCheck fraud detection platform, implementing all the prompts from your data generation requirements.

## 🎯 Overview

The system generates:
- **Properties**: Realistic property listings with market-based pricing
- **Users**: Diverse user profiles with authentic Kenyan characteristics  
- **Transactions**: Complex transaction histories with behavioral patterns
- **Fraud Patterns**: Sophisticated fraud scenarios for ML training
- **Time Series**: Market trends and seasonal variations
- **Quality Issues**: Realistic data noise and inconsistencies

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ with npm
- Python 3.7+ with pip
- PostgreSQL database (Neon recommended)

### Installation
```bash
# Install Python dependencies (automatic during integration)
pip install pandas numpy faker uuid

# Or run the full integration (recommended)
npm run data:generate
```

## 📊 Data Generation Scripts

### 1. Property Generator (`property-generator.py`)
**Based on Prompt 1: Property Details Generation**

Generates 100,000+ realistic property records with:
- ✅ Kenya-specific locations (Nairobi, Mombasa, Kisumu, Nakuru)
- ✅ Market-based pricing with seasonal adjustments
- ✅ Realistic property features and amenities
- ✅ 2-3% suspicious properties with pricing anomalies
- ✅ Time-based market trends and fluctuations

```bash
npm run data:properties
```

**Features:**
- Authentic Kenyan property types and locations
- Market-driven pricing algorithms
- Seasonal demand patterns
- Suspicious pricing detection patterns
- Comprehensive property metadata

### 2. User Generator (`user-generator.py`)
**Based on Prompt 2: User Profile and Transaction History Generation**

Creates 50,000+ user profiles with transaction histories:
- ✅ Realistic Kenyan names and contact information
- ✅ Diverse user types (buyers, sellers, agents, investors)
- ✅ Complex transaction patterns and behaviors
- ✅ 1-2% suspicious users with fraud indicators
- ✅ Geographic and temporal transaction patterns

```bash
npm run data:users
```

**Features:**
- Authentic Kenyan personal information
- Behavioral transaction patterns
- User type-specific activities
- Suspicious behavior detection
- Comprehensive transaction histories

### 3. Fraud Simulator (`fraud-simulator.py`)
**Based on Prompt 3: Fraud Pattern Simulation**

Implements 5+ sophisticated fraud patterns:
- ✅ **Identity Theft**: Stolen/fake identities
- ✅ **Property Value Manipulation**: Artificial pricing
- ✅ **Straw Buyer Schemes**: Hidden ownership
- ✅ **Illegal Property Flipping**: Rapid buy-sell cycles
- ✅ **Mortgage Fraud**: Fraudulent applications

```bash
npm run data:fraud
```

**Features:**
- Subtle, realistic fraud patterns
- Time-based fraud evolution
- Correlated fraud indicators
- 3-5% overall fraud rate
- Sophisticated detection challenges

### 4. Data Integrator (`integrate-data.ts`)
**Comprehensive Integration System**

Combines all generators and integrates data into TripleCheck:
- ✅ Runs all Python generators automatically
- ✅ Integrates data into PostgreSQL database
- ✅ Creates user accounts with secure passwords
- ✅ Generates sample reviews and ratings
- ✅ Produces integration reports and statistics

```bash
npm run data:generate
```

## 📈 Generated Data Statistics

### Properties Dataset
- **Total Records**: 10,000+ (configurable up to 100,000+)
- **Suspicious Rate**: 3%
- **Locations**: 4 major Kenyan cities, 25+ areas
- **Price Range**: KES 5M - 65M with market-based variations
- **Property Types**: Apartments, houses, condos, townhouses, studios

### Users Dataset  
- **Total Records**: 5,000+ (configurable up to 50,000+)
- **Suspicious Rate**: 2%
- **User Types**: Buyers (45%), Sellers (25%), Agents (15%), Investors (15%)
- **Geographic Distribution**: Matches property locations
- **Transaction Volume**: 10,000+ realistic transactions

### Fraud Patterns
- **Identity Theft**: 30% of fraud cases
- **Property Value Manipulation**: 25% of fraud cases  
- **Straw Buyer Schemes**: 20% of fraud cases
- **Illegal Property Flipping**: 15% of fraud cases
- **Mortgage Fraud**: 10% of fraud cases

## 🔍 Data Quality Features

### Realistic Characteristics
- **Kenyan Context**: Authentic names, locations, phone numbers
- **Market Dynamics**: Seasonal pricing, location-based values
- **Behavioral Patterns**: User type-specific transaction behaviors
- **Temporal Consistency**: Logical date sequences and patterns

### Fraud Detection Training
- **Subtle Patterns**: Sophisticated fraud indicators
- **Mixed Data**: Fraud seamlessly integrated with legitimate data
- **Evolution**: Time-based fraud technique advancement
- **Correlation**: Related fraud indicators across entities

### Data Quality Issues
- **Missing Values**: Realistic data gaps
- **Inconsistencies**: Subtle data quality problems
- **Noise**: Real-world data imperfections
- **Duplicates**: Controlled duplicate scenarios

## 🛠️ Usage Examples

### Generate Complete Dataset
```bash
# Full integration (recommended)
npm run data:generate

# This will:
# 1. Install Python dependencies
# 2. Run all data generators
# 3. Integrate data into database
# 4. Generate reports and statistics
```

### Generate Individual Components
```bash
# Generate only properties
npm run data:properties

# Generate only users and transactions  
npm run data:users

# Apply fraud patterns to existing data
npm run data:fraud
```

### Custom Configuration
Edit the Python scripts to adjust:
- Dataset sizes
- Fraud rates
- Geographic focus
- Market parameters
- Quality issue rates

## 📊 Output Files

The system generates several data files:

### Core Datasets
- `property_dataset.json` - Clean property data
- `user_dataset.json` - Clean user profiles
- `transaction_dataset.json` - Clean transaction histories

### Fraud-Enhanced Datasets
- `fraudulent_property_dataset.json` - Properties with fraud patterns
- `fraudulent_user_dataset.json` - Users with suspicious behaviors
- `fraudulent_transaction_dataset.json` - Transactions with fraud indicators

### Analysis Reports
- `property_statistics.json` - Property data analysis
- `user_statistics.json` - User behavior analysis
- `fraud_analysis_report.json` - Comprehensive fraud pattern analysis
- `integration_report.json` - Database integration summary

## 🎯 Machine Learning Applications

### Training Data Features
- **Balanced Classes**: Appropriate fraud/legitimate ratios
- **Feature Rich**: Comprehensive property and user attributes
- **Temporal Patterns**: Time-based fraud evolution
- **Realistic Noise**: Real-world data quality issues

### Model Training Support
- **Classification**: Fraud vs. legitimate detection
- **Regression**: Risk scoring and price prediction
- **Clustering**: User behavior segmentation
- **Time Series**: Market trend analysis

### Evaluation Datasets
- **Holdout Sets**: Clean test data separation
- **Challenge Sets**: Sophisticated fraud scenarios
- **Benchmark Data**: Standardized evaluation metrics
- **Edge Cases**: Rare but important scenarios

## 🔧 Customization

### Adjusting Dataset Size
```python
# In property-generator.py
properties = generator.generate_dataset(
    total_records=100000,  # Adjust size
    suspicious_rate=0.025  # Adjust fraud rate
)
```

### Adding New Fraud Patterns
```python
# In fraud-simulator.py
def apply_new_fraud_pattern(self, user, properties, transactions):
    # Implement custom fraud logic
    pass
```

### Market Customization
```python
# In property-generator.py - modify location data
self.locations = {
    'YourCity': {
        'areas': ['Area1', 'Area2'],
        'price_multiplier': 1.0,
        'zip_codes': ['12345']
    }
}
```

## 📋 Integration with TripleCheck

The generated data integrates seamlessly with TripleCheck:

1. **Database Schema**: Matches TripleCheck's Drizzle schema
2. **User Authentication**: Generates secure password hashes
3. **Property Features**: Compatible with existing property system
4. **Fraud Detection**: Provides training data for AI models
5. **Reviews System**: Generates sample reviews and ratings

## 🚀 Next Steps

After generating data:

1. **Start TripleCheck**: `npm run dev`
2. **Test Fraud Detection**: Use the AI verification features
3. **Analyze Patterns**: Review the generated fraud reports
4. **Train Models**: Use the data for ML model improvement
5. **Validate Results**: Test detection accuracy with known fraud cases

## 📞 Support

For issues or customization needs:
1. Check the generated log files for errors
2. Review the integration reports for data quality
3. Adjust Python script parameters as needed
4. Ensure all dependencies are properly installed

The system is designed to be robust and handle various edge cases, but can be customized for specific requirements or different geographic markets.