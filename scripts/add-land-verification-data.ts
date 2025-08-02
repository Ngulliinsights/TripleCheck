#!/usr/bin/env tsx
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function addLandVerificationData() {
  try {
    console.log("🔍 Adding land verification sessions...");
    
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get some users and properties
    const users = await sql`SELECT id FROM users LIMIT 20`;
    const properties = await sql`SELECT id FROM properties WHERE verification_status = 'pending' LIMIT 30`;
    
    if (users.length === 0 || properties.length === 0) {
      console.log("❌ No users or properties found");
      return;
    }
    
    let insertedSessions = 0;
    
    // Create 25 land verification sessions
    for (let i = 0; i < 25; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProperty = properties[Math.floor(Math.random() * properties.length)];
      
      const statuses = ['not_started', 'in_progress', 'completed', 'suspended'];
      const riskLevels = ['low', 'medium', 'high', 'critical'];
      const layers = ['registry', 'physical', 'community', 'government', 'legal', 'expert'];
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const currentLayer = layers[Math.floor(Math.random() * layers.length)];
      
      try {
        const result = await sql`
          INSERT INTO land_verification_sessions (
            property_id, user_id, status, current_layer, overall_risk_score, 
            risk_level, confidence, monitoring_enabled
          )
          VALUES (
            ${randomProperty.id}, 
            ${randomUser.id}, 
            ${status}, 
            ${currentLayer}, 
            ${Math.floor(Math.random() * 100)}, 
            ${riskLevel}, 
            ${(Math.random() * 0.8 + 0.2).toFixed(2)}, 
            ${Math.random() > 0.5}
          )
          RETURNING id
        `;
        
        if (result.length > 0) {
          const sessionId = result[0].id;
          insertedSessions++;
          
          // Add some verification layers for this session
          const numLayers = Math.floor(Math.random() * 4) + 2; // 2-5 layers
          for (let j = 0; j < numLayers; j++) {
            const layerType = layers[j % layers.length];
            const layerStatus = Math.random() > 0.5 ? 'completed' : 'in_progress';
            
            try {
              await sql`
                INSERT INTO verification_layers (
                  session_id, layer_type, status, estimated_duration, actual_duration
                )
                VALUES (
                  ${sessionId}, 
                  ${layerType}, 
                  ${layerStatus}, 
                  ${Math.floor(Math.random() * 48) + 12}, 
                  ${layerStatus === 'completed' ? Math.floor(Math.random() * 36) + 6 : null}
                )
              `;
            } catch (error) {
              // Skip duplicate layers
              continue;
            }
          }
          
          // Add some risk factors
          const riskCategories = ['ownership', 'government', 'legal', 'physical', 'community'];
          const numRisks = Math.floor(Math.random() * 3) + 1; // 1-3 risks
          
          for (let k = 0; k < numRisks; k++) {
            const category = riskCategories[Math.floor(Math.random() * riskCategories.length)];
            const severity = riskLevels[Math.floor(Math.random() * riskLevels.length)];
            const sourceLayer = layers[Math.floor(Math.random() * layers.length)];
            
            try {
              await sql`
                INSERT INTO risk_factors (
                  session_id, category, severity, confidence, description, 
                  impact, likelihood, source_layer
                )
                VALUES (
                  ${sessionId}, 
                  ${category}, 
                  ${severity}, 
                  ${(Math.random() * 0.6 + 0.4).toFixed(2)}, 
                  ${`${severity} risk identified in ${category} verification`}, 
                  ${`Potential impact on property ${category} status`}, 
                  ${(Math.random() * 0.8 + 0.2).toFixed(2)}, 
                  ${sourceLayer}
                )
              `;
            } catch (error) {
              // Skip if error
              continue;
            }
          }
        }
        
        if (insertedSessions % 10 === 0) {
          console.log(`   ✅ Created ${insertedSessions} verification sessions...`);
        }
      } catch (error) {
        // Skip this session
        continue;
      }
      
      // Small delay
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Successfully created ${insertedSessions} land verification sessions`);
    
    // Show final counts
    const sessionCount = await sql`SELECT COUNT(*) as count FROM land_verification_sessions`;
    const layerCount = await sql`SELECT COUNT(*) as count FROM verification_layers`;
    const riskCount = await sql`SELECT COUNT(*) as count FROM risk_factors`;
    
    console.log("\n📊 Land Verification Data:");
    console.log(`   Sessions: ${sessionCount[0].count}`);
    console.log(`   Layers: ${layerCount[0].count}`);
    console.log(`   Risk Factors: ${riskCount[0].count}`);
    
  } catch (error) {
    console.error("❌ Failed to add land verification data:", error);
  }
}

addLandVerificationData();