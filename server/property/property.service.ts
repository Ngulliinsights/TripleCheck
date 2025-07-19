import { PropertyRepository } from './property.repository';

export class PropertyService {
  private propertyRepository: PropertyRepository;

  constructor() {
    this.propertyRepository = new PropertyRepository();
  }

  async getProperties(filters: any) {
    return this.propertyRepository.findMany(filters);
  }

  async getProperty(id: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new Error('Property not found');
    }
    return { data: property, success: true };
  }

  async createProperty(propertyData: any, ownerId: string) {
    const property = await this.propertyRepository.create({
      ...propertyData,
      ownerId,
    });
    return { data: property, success: true, message: 'Property created successfully' };
  }

  async updateProperty(id: string, updates: any, userId: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new Error('Property not found');
    }
    if (property.ownerId !== userId) {
      throw new Error('Unauthorized: You can only update your own properties');
    }

    const updatedProperty = await this.propertyRepository.update(id, updates);
    return { data: updatedProperty, success: true, message: 'Property updated successfully' };
  }

  async deleteProperty(id: string, userId: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property) {
      throw new Error('Property not found');
    }
    if (property.ownerId !== userId) {
      throw new Error('Unauthorized: You can only delete your own properties');
    }

    await this.propertyRepository.delete(id);
  }

  async getPropertiesByOwner(ownerId: string) {
    const properties = await this.propertyRepository.findByOwner(ownerId);
    return { data: properties, success: true };
  }
}