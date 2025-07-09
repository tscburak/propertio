import { PropertyType } from './PropertyType';

const defaultPropertyTypes = [
  { label: 'House' },
  { label: 'Apartment' },
  { label: 'Office' },
  { label: 'Land' },
  { label: 'Condo' },
  { label: 'Townhouse' }
];

export async function seedPropertyTypes() {
  try {
    // Check if property types already exist
    const existingTypes = await PropertyType.find();
    
    if (existingTypes.length === 0) {
      // Insert default property types
      await PropertyType.insertMany(defaultPropertyTypes);
      console.log('Property types seeded successfully');
    } else {
      console.log('Property types already exist, skipping seed');
    }
  } catch (error) {
    console.error('Error seeding property types:', error);
  }
} 