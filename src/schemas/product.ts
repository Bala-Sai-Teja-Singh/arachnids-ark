import { z } from 'zod';

/**
 * Zod schema for Product validation.
 * Includes conditional validation for entity-specific metadata.
 */
export const ProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  scientificName: z.string().min(2, 'Scientific name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  images: z.array(z.string().url('Invalid image URL')),
  mainCategory: z.enum(['Tarantulas', 'Scorpions', 'Centipedes']),
  careLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  humidity: z.string().min(1, 'Required'),
  temperature: z.string().min(1, 'Required'),
  feeding: z.string().min(1, 'Required'),
  isVisible: z.boolean().default(true),
  available: z.boolean().default(true),
  
  // Dynamic Sizes Array
  sizes: z.array(z.object({
    size: z.string().min(1, 'Required'),
    price: z.number().min(0, 'Price cannot be negative'),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
  })).min(1, 'At least one size is required'),

  // Tarantula Specific
  tarantulaMeta: z.object({
    world: z.enum(['New World', 'Old World']),
    type: z.enum(['Terrestrial', 'Arboreal', 'Fossorial']),
    temperament: z.enum(['docile', 'semi-aggressive', 'aggressive', 'defensive']),
    growthRate: z.enum(['Slow', 'Medium', 'Fast']).optional(),
    sizeCategory: z.enum(['Sling', 'Juvenile', 'Sub-adult', 'Adult']).optional(),
    gender: z.enum(['Unsexed', 'Male', 'Female', 'Pair']).optional(),
  }).optional(),

  // Scorpion Specific
  scorpionMeta: z.object({
    habitatType: z.enum(['Desert', 'Tropical Forest']),
    venomPotency: z.enum(['Mild', 'Moderate', 'Medically Significant', 'Lethal']),
    pincerType: z.enum(['Thin', 'Medium', 'Thick']),
    communal: z.boolean().default(false),
    sizeCategory: z.enum(['Scorpling', 'Juvenile', 'Sub-adult', 'Adult']).optional(),
    gender: z.enum(['Unsexed', 'Male', 'Female', 'Pair']).optional(),
  }).optional(),

  // Centipede Specific
  centipedeMeta: z.object({
    habitatType: z.enum(['Tropical', 'Arid']),
    venomPotency: z.enum(['Mild', 'Moderate', 'Severe', 'Potent']),
    legPairs: z.string().optional(),
    sizeCategory: z.enum(['Pedeling', 'Juvenile', 'Sub-adult', 'Adult']).optional(),
    gender: z.enum(['Unsexed', 'Male', 'Female']).optional(),
  }).optional(),
});

export type ProductSchemaType = z.infer<typeof ProductSchema>;
