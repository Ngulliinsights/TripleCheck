import { ethers } from 'ethers';
import type { BlockchainVerification, Property } from '@shared/schema';

// Smart contract ABI for property verification
const PROPERTY_VERIFICATION_ABI = [
  "function verifyProperty(string propertyId, string titleDeedHash, string landRegistryRef) public returns (bool)",
  "function getVerificationStatus(string propertyId) public view returns (string)",
  "function getPropertyHistory(string propertyId) public view returns (string[])",
  "event PropertyVerified(string propertyId, string titleDeedHash, string landRegistryRef, uint256 timestamp)"
];

// Test network configuration for development
const TEST_CONFIG = {
  rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/test",
  contractAddress: "0x0000000000000000000000000000000000000000",
};

class BlockchainService {
  private provider: ethers.Provider | null = null;
  private contract: ethers.Contract | null = null;
  private initialized: boolean = false;
  private isDevelopment: boolean = process.env.NODE_ENV !== 'production';

  private async initialize() {
    if (this.initialized) return;

    try {
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || TEST_CONFIG.rpcUrl;
      const contractAddress = process.env.VERIFICATION_CONTRACT_ADDRESS || TEST_CONFIG.contractAddress;

      console.log(`Initializing blockchain service in ${this.isDevelopment ? 'development' : 'production'} mode`);

      if (this.isDevelopment) {
        console.log('Using test network configuration for development');
        // In development, we'll simulate blockchain operations
        this.initialized = true;
        return;
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.contract = new ethers.Contract(
        contractAddress,
        PROPERTY_VERIFICATION_ABI,
        this.provider
      );

      // Test connection
      await this.provider.getNetwork();
      this.initialized = true;
      console.log('Blockchain service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      if (!this.isDevelopment) {
        throw error;
      }
      console.log('Continuing in development mode with mocked responses');
      this.initialized = true;
    }
  }

  private mockBlockchainVerification(property: Property): BlockchainVerification {
    return {
      transactionHash: `0x${Array(64).fill('0').join('')}`,
      blockNumber: 1,
      timestamp: new Date().toISOString(),
      smartContractAddress: TEST_CONFIG.contractAddress,
      verificationData: {
        propertyId: property.id.toString(),
        titleDeedHash: `0x${Array(64).fill('1').join('')}`,
        landRegistryReference: property.landReferenceNumber || '',
        ownershipHistory: [{
          owner: "Mock Owner",
          timestamp: new Date().toISOString(),
          transactionHash: `0x${Array(64).fill('2').join('')}`
        }],
        verificationStatus: 'verified'
      }
    };
  }

  async verifyProperty(property: Property): Promise<BlockchainVerification> {
    try {
      await this.initialize();

      if (this.isDevelopment) {
        console.log('Development mode: Returning mock blockchain verification');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        return this.mockBlockchainVerification(property);
      }

      if (!this.contract) throw new Error('Blockchain service not initialized');
      if (!property.titleDeedNumber || !property.landReferenceNumber) {
        throw new Error('Property missing required verification documents');
      }

      // Create digital signature of property documents
      const titleDeedHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify({
          titleDeedNumber: property.titleDeedNumber,
          landReferenceNumber: property.landReferenceNumber,
          plotNumber: property.plotNumber
        }))
      );

      // Call smart contract to verify property
      const tx = await this.contract.verifyProperty(
        property.id.toString(),
        titleDeedHash,
        property.landReferenceNumber
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Return blockchain verification data
      return {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString(),
        smartContractAddress: this.contract.address as string,
        verificationData: {
          propertyId: property.id.toString(),
          titleDeedHash,
          landRegistryReference: property.landReferenceNumber,
          ownershipHistory: [],
          verificationStatus: 'verified'
        }
      };
    } catch (error) {
      console.error('Blockchain verification failed:', error);
      if (this.isDevelopment) {
        console.log('Development mode: Returning mock verification after error');
        return this.mockBlockchainVerification(property);
      }
      throw new Error(`Property verification failed on blockchain: ${error}`);
    }
  }

  async getVerificationStatus(propertyId: string): Promise<string> {
    try {
      await this.initialize();

      if (this.isDevelopment) {
        return 'verified'; // Mock status for development
      }

      if (!this.contract) throw new Error('Blockchain service not initialized');
      return await this.contract.getVerificationStatus(propertyId);
    } catch (error) {
      console.error('Failed to get verification status:', error);
      if (this.isDevelopment) {
        return 'verified'; // Mock status for development
      }
      throw error;
    }
  }

  async getPropertyHistory(propertyId: string): Promise<string[]> {
    try {
      await this.initialize();

      if (this.isDevelopment) {
        return ['Mock property history entry']; // Mock history for development
      }

      if (!this.contract) throw new Error('Blockchain service not initialized');
      return await this.contract.getPropertyHistory(propertyId);
    } catch (error) {
      console.error('Failed to get property history:', error);
      if (this.isDevelopment) {
        return ['Mock property history entry']; // Mock history for development
      }
      throw error;
    }
  }
}

// Export a singleton instance
export const blockchainService = new BlockchainService();