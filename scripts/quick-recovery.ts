#!/usr/bin/env tsx
/**
 * Quick Recovery Script
 * Restores users and properties, then loads transactions and statistics
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, properties, reviews, transactions, statistics } from "../src/shared/schema";
import * as fs from 'fs/promises';
import * as path from 'path';
import * as bcrypt from "bcrypt";

async function quickRecovery() {
  try {
    console.log('🚨 Quick Recovery: Restoring your data...');
    
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);
    
    // Load users first
    console.log('👥 Restoring users...');
    const userFile = path.join(process.cwd(), 'scripts', 'data-generation', 'user_dataset.json');
    const userData = JSON.parse(await fs.readFile(userFile, 'utf8'));
    
    // Take first 1000 users to avoid duplicates
    const usersToLoad = userData.slice(0, 1000);
    const hashedPassword = await bcrypt.hash('test_password_2024', 12);
    
    const userInserts = usersToLoad.map((user: any, index: number) => ({
      username: `${user.firstName?.toLowerCase()}_${user.lastName?.toLowerCase()}_${Date.now()}_${index}`.substring(0, 50),
      email: `${user.firstName?.toLowerCase()}.${user.lastName?.toLowerCase()}.${index}@example.com`, // Ensure unique emails
      password: hashedPassword,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      trustScore: user.trustScore || 50,
      role: "user" as const,
      isVerifiedAgent: false,
    }));
    
    const insertedUsers = await db.insert(users).values(userInserts).returning();
    console.log(`✅ Restored ${insertedUsers.length} users`);
    
    // Load properties
    console.log('🏠 Restoring properties...');
    const propertyFile = path.join(process.cwd(), 'scripts', 'data-generation', 'property_dataset.json');
    const propertyData = JSON.parse(await fs.readFile(propertyFile, 'utf8'));
    
    const propertiesToLoad = propertyData.slice(0, 1500);
    const userIds = insertedUsers.map(u => u.id);
    
    const propertyInserts = propertiesToLoad.map((property: any) => ({
      ownerId: userIds[Math.floor(Math.random() * userIds.length)],
      title: property.title,
      description: property.description,
      location: property.location,
      price: property.price.toString(),
      imageUrls: property.imageUrls || [],
      features: {
        bedrooms: property.features?.bedrooms || 1,
        bathrooms: property.features?.bathrooms || 1,
        squareFeet: property.features?.squareFeet || 1000,
        parkingSpaces: property.features?.parkingSpaces || 0,
        yearBuilt: property.features?.yearBuilt || 2020,
        amenities: property.features?.amenities || [],
        petFriendly: property.features?.petFriendly || false,
        furnished: property.features?.furnished || false,
        propertyType: property.propertyType || "apartment",
      },
    }));
    
    const insertedProperties = await db.insert(properties).values(propertyInserts).returning();
    console.log(`✅ Restored ${insertedProperties.length} properties`);
    
    // Generate some reviews
    console.log('⭐ Adding reviews...');
    const reviewInserts = [];
    for (let i = 0; i < 200; i++) {
      reviewInserts.push({
        propertyId: insertedProperties[Math.floor(Math.random() * insertedProperties.length)].id,
        userId: insertedUsers[Math.floor(Math.random() * insertedUsers.length)].id,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: `Great property! Review #${i + 1}`,
      });
    }
    
    await db.insert(reviews).values(reviewInserts);
    console.log(`✅ Added ${reviewInserts.length} reviews`);
    
    // Now load transactions
    console.log('💰 Loading transactions...');
    const transactionFile = path.join(process.cwd(), 'scripts', 'data-generation', 'transaction_dataset.json');
    const transactionData = JSON.parse(await fs.readFile(transactionFile, 'utf8'));
    
    const transactionsToLoad = transactionData.slice(0, 500);
    const propertyIds = insertedProperties.map(p => p.id);
    
    const transactionInserts = transactionsToLoad.map((transaction: any) => ({
      externalId: transaction.id,
      userId: userIds[Math.floor(Math.random() * userIds.length)],
      propertyId: propertyIds[Math.floor(Math.random() * propertyIds.length)],
      transactionType: transaction.transactionType as 'buy' | 'sell' | 'rent' | 'lease',
      amount: transaction.amount.toString(),
      transactionDate: new Date(transaction.transactionDate),
      status: transaction.status as 'pending' | 'completed' | 'cancelled' | 'failed',
      otherParties: transaction.otherParties || [],
      isSuspicious: transaction.isSuspicious || false,
      fraudScore: Math.floor(Math.random() * 30),
      notes: `Recovered transaction`,
    }));
    
    const insertedTransactions = await db.insert(transactions).values(transactionInserts).returning();
    console.log(`✅ Loaded ${insertedTransactions.length} transactions`);
    
    // Load basic statistics
    console.log('📊 Loading statistics...');
    const statisticInserts = [
      {
        metricType: 'user_count',
        metricKey: 'total',
        metricValue: { count: insertedUsers.length },
        periodType: 'all_time',
      },
      {
        metricType: 'property_count',
        metricKey: 'total',
        metricValue: { count: insertedProperties.length },
        periodType: 'all_time',
      },
      {
        metricType: 'transaction_count',
        metricKey: 'total',
        metricValue: { count: insertedTransactions.length },
        periodType: 'all_time',
      },
    ];
    
    await db.insert(statistics).values(statisticInserts);
    console.log(`✅ Loaded ${statisticInserts.length} statistics`);
    
    console.log('\n🎉 Quick recovery completed!');
    console.log(`   👥 Users: ${insertedUsers.length}`);
    console.log(`   🏠 Properties: ${insertedProperties.length}`);
    console.log(`   ⭐ Reviews: ${reviewInserts.length}`);
    console.log(`   💰 Transactions: ${insertedTransactions.length}`);
    console.log(`   📊 Statistics: ${statisticInserts.length}`);
    console.log('\n✅ Your app is ready for testing with transaction and fraud data!');
    
  } catch (error) {
    console.error('❌ Recovery failed:', error);
    throw error;
  }
}

quickRecovery();