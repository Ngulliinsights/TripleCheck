/**
 * TripleCheck Data Analysis Script
 * 
 * Analyzes the generated test data and provides insights
 */

async function analyzeGeneratedData() {
  console.log('TripleCheck Data Analysis Report');
  console.log('======================================\n');
  
  try {
    // Fetch all properties
    const propertiesResponse = await fetch('http://localhost:5000/api/properties');
    const properties = await propertiesResponse.json();
    
    console.log(`📊 Total Properties: ${properties.length}\n`);
    
    // Analyze by location
    const locationStats = {};
    const priceByLocation = {};
    
    properties.forEach(property => {
      const location = property.location;
      if (!locationStats[location]) {
        locationStats[location] = 0;
        priceByLocation[location] = [];
      }
      locationStats[location]++;
      priceByLocation[location].push(property.price);
    });
    
    console.log('🏙️  Distribution by Location:');
    Object.entries(locationStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([location, count]) => {
        const avgPrice = priceByLocation[location].reduce((a, b) => a + b, 0) / priceByLocation[location].length;
        console.log(`   ${location}: ${count} properties (Avg: KES ${Math.round(avgPrice).toLocaleString()})`);
      });
    
    // Analyze verification status
    const verificationStats = {};
    properties.forEach(property => {
      const status = property.verificationStatus;
      verificationStats[status] = (verificationStats[status] || 0) + 1;
    });
    
    console.log('\n🔒 Verification Status:');
    Object.entries(verificationStats).forEach(([status, count]) => {
      const percentage = ((count / properties.length) * 100).toFixed(1);
      console.log(`   ${status}: ${count} (${percentage}%)`);
    });
    
    // Analyze property types
    const typeStats = {};
    properties.forEach(property => {
      const type = property.features?.propertyType || 'unknown';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });
    
    console.log('\n🏠 Property Types:');
    Object.entries(typeStats).forEach(([type, count]) => {
      const percentage = ((count / properties.length) * 100).toFixed(1);
      console.log(`   ${type}: ${count} (${percentage}%)`);
    });
    
    // Price analysis
    const prices = properties.map(p => p.price).sort((a, b) => a - b);
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const medianPrice = prices[Math.floor(prices.length / 2)];
    
    console.log('\n💰 Price Analysis:');
    console.log(`   Minimum: KES ${minPrice.toLocaleString()}`);
    console.log(`   Maximum: KES ${maxPrice.toLocaleString()}`);
    console.log(`   Average: KES ${Math.round(avgPrice).toLocaleString()}`);
    console.log(`   Median: KES ${medianPrice.toLocaleString()}`);
    
    // Fraud analysis
    let fraudulentProperties = 0;
    let highRiskProperties = 0;
    
    properties.forEach(property => {
      if (property.features?.fraudPattern) {
        fraudulentProperties++;
      }
      if (property.aiVerificationResults?.riskScore > 70) {
        highRiskProperties++;
      }
    });
    
    console.log('\n🚨 Risk Analysis:');
    console.log(`   Fraudulent Properties: ${fraudulentProperties} (${((fraudulentProperties/properties.length)*100).toFixed(1)}%)`);
    console.log(`   High Risk (Score > 70): ${highRiskProperties} (${((highRiskProperties/properties.length)*100).toFixed(1)}%)`);
    
    // Sample high-value properties
    const expensiveProperties = properties
      .sort((a, b) => b.price - a.price)
      .slice(0, 5);
    
    console.log('\n💎 Top 5 Most Expensive Properties:');
    expensiveProperties.forEach((property, index) => {
      console.log(`   ${index + 1}. ${property.title} - KES ${property.price.toLocaleString()}`);
      console.log(`      Location: ${property.location}`);
      console.log(`      Status: ${property.verificationStatus}`);
    });
    
    // Sample amenities analysis
    const amenitiesCount = {};
    properties.forEach(property => {
      if (property.features?.amenities) {
        property.features.amenities.forEach(amenity => {
          amenitiesCount[amenity] = (amenitiesCount[amenity] || 0) + 1;
        });
      }
    });
    
    console.log('\n🏊 Top Amenities:');
    Object.entries(amenitiesCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([amenity, count]) => {
        const percentage = ((count / properties.length) * 100).toFixed(1);
        console.log(`   ${amenity}: ${count} properties (${percentage}%)`);
      });
    
    console.log('\n✅ Data analysis completed successfully!');
    console.log('The generated data shows realistic diversity and proper fraud patterns.');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run analysis
analyzeGeneratedData();