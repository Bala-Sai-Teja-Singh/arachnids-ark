'use client';

import type { User, Product, Course, ConsultationSettings, ConsultationSlot, CareGuide, SystemSettings } from '@/types';
import { LocalStorage } from './storage';
import { DEFAULT_CONSULTATION_PRICING, DEFAULT_URGENCY_MULTIPLIERS } from '@/constants/pricing';

const PRODUCTS: Product[] = [
  {
    id: 'prod-001', name: 'Mexican Red Knee', scientificName: 'Brachypelma hamorii',
    mainCategory: 'Tarantulas', careLevel: 'beginner',
    category: 'terrestrial', origin: 'new-world', temperament: 'docile',
    humidity: '60-70%', temperature: '24-28°C',
    feeding: 'Crickets, mealworms - Weekly', description: 'One of the most iconic tarantula species in the hobby. The Mexican Red Knee is known for its stunning coloration with bright orange-red patches on its leg joints.',
    images: ['/images/mexicanRedKnee.webp'], featured: true, isVisible: true, available: true,
    tarantulaMeta: { world: 'New World', type: 'Terrestrial', temperament: 'docile', growthRate: 'Slow', sizeCategory: 'Juvenile', gender: 'Female' },
    sizes: [
      { size: '1/2" Sling', price: 1500, stock: 5 },
      { size: '3" Adult', price: 4500, stock: 1 }
    ],
    likes: 124,
    createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'prod-002', name: 'Green Bottle Blue', scientificName: 'Chromatopelma cyaneopubescens',
    mainCategory: 'Tarantulas', careLevel: 'beginner',
    category: 'terrestrial', origin: 'new-world', temperament: 'semi-aggressive',
    humidity: '40-60%', temperature: '26-30°C',
    feeding: 'Crickets, roaches - Twice weekly', description: 'A breathtaking species featuring metallic blue legs, a green carapace, and an orange abdomen.',
    images: ['/images/greenBottleBlue.webp'], featured: true, isVisible: true, available: true,
    tarantulaMeta: { world: 'New World', type: 'Terrestrial', temperament: 'semi-aggressive', growthRate: 'Fast', sizeCategory: 'Sling', gender: 'Unsexed' },
    sizes: [
      { size: '1/4" Sling', price: 1200, stock: 10 },
      { size: '2.5" Sub-adult', price: 3800, stock: 1 }
    ],
    likes: 89,
    createdAt: '2025-01-02T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z'
  },
  {
    id: 'prod-003', name: 'Cobalt Blue', scientificName: 'Cyriopagopus lividus',
    mainCategory: 'Tarantulas', careLevel: 'expert',
    category: 'fossorial', origin: 'old-world', temperament: 'aggressive',
    humidity: '75-85%', temperature: '25-28°C',
    feeding: 'Crickets, roaches - Weekly', description: 'The Cobalt Blue is a stunning Old World species known for its iridescent blue coloration.',
    images: ['/images/cobaltBlue-1.webp', '/images/cobaltBlue-2.jpg'], featured: true, isVisible: true, available: true,
    tarantulaMeta: { world: 'Old World', type: 'Fossorial', temperament: 'aggressive', growthRate: 'Medium', sizeCategory: 'Adult', gender: 'Female' },
    sizes: [
      { size: '1/2" Sling', price: 2000, stock: 5 },
      { size: 'Adult Female', price: 5500, stock: 1 }
    ],
    likes: 56,
    createdAt: '2025-01-03T00:00:00Z', updatedAt: '2025-01-03T00:00:00Z'
  },
  {
    id: 'prod-004', name: 'Pinktoe Tarantula', scientificName: 'Avicularia avicularia',
    mainCategory: 'Tarantulas', careLevel: 'intermediate',
    category: 'arboreal', origin: 'new-world', temperament: 'docile',
    humidity: '70-80%', temperature: '24-27°C',
    feeding: 'Crickets, flying insects - Twice weekly', description: 'A charming arboreal species with a dark body and distinctive pink toes.',
    images: ['/images/pinkToe.webp'], featured: false, isVisible: true, available: true,
    tarantulaMeta: { world: 'New World', type: 'Arboreal', temperament: 'docile', growthRate: 'Medium', sizeCategory: 'Sling', gender: 'Unsexed' },
    sizes: [
      { size: '1/2" Sling', price: 800, stock: 20 },
      { size: 'Adult', price: 2800, stock: 5 }
    ],
    likes: 42,
    createdAt: '2025-01-04T00:00:00Z', updatedAt: '2025-01-04T00:00:00Z'
  },
  {
    id: 'prod-005', name: 'Brazilian Black', scientificName: 'Grammostola pulchra',
    mainCategory: 'Tarantulas', careLevel: 'beginner',
    category: 'terrestrial', origin: 'new-world', temperament: 'docile',
    humidity: '50-60%', temperature: '22-26°C',
    feeding: 'Crickets - Weekly', description: 'Famous for its jet-black velvet appearance and calm demeanor.',
    images: ['/images/brazilianBlack-1.webp', '/images/brazilianBlack-2.jpg'], featured: true, isVisible: true, available: true,
    tarantulaMeta: { world: 'New World', type: 'Terrestrial', temperament: 'docile', growthRate: 'Slow', sizeCategory: 'Sling', gender: 'Unsexed' },
    sizes: [
      { size: '1/2" Sling', price: 1800, stock: 10 },
      { size: 'Juvenile', price: 3500, stock: 2 }
    ],
    likes: 215,
    createdAt: '2025-01-05T00:00:00Z', updatedAt: '2025-01-05T00:00:00Z'
  },
  {
    id: 'prod-006', name: 'Curly Hair', scientificName: 'Tliltocatl albopilosus',
    mainCategory: 'Tarantulas', careLevel: 'beginner',
    category: 'terrestrial', origin: 'new-world', temperament: 'docile',
    humidity: '60-70%', temperature: '24-27°C',
    feeding: 'Crickets - Weekly', description: 'Known for its unique "curly" bronze-colored hairs.',
    images: ['/images/curlyHair.webp', '/images/curlyHair-2.avif'], featured: true, isVisible: true, available: true,
    tarantulaMeta: { world: 'New World', type: 'Terrestrial', temperament: 'docile', growthRate: 'Medium', sizeCategory: 'Sling', gender: 'Unsexed' },
    sizes: [
      { size: '1/4" Sling', price: 600, stock: 30 },
      { size: 'Adult', price: 2500, stock: 5 }
    ],
    likes: 187,
    createdAt: '2025-01-06T00:00:00Z', updatedAt: '2025-01-06T00:00:00Z'
  },
  {
    id: 'prod-008', name: 'Gooty Sapphire', scientificName: 'Poecilotheria metallica',
    mainCategory: 'Tarantulas', careLevel: 'expert',
    category: 'arboreal', origin: 'old-world', temperament: 'aggressive',
    humidity: '70-80%', temperature: '25-28°C',
    feeding: 'Insects - Weekly', description: 'One of the most beautiful arboreal species with intense blue coloration.',
    images: ['/images/gootSapphire.webp'], featured: true, isVisible: true, available: true,
    tarantulaMeta: { world: 'Old World', type: 'Arboreal', temperament: 'aggressive', growthRate: 'Medium', sizeCategory: 'Sling', gender: 'Unsexed' },
    sizes: [{ size: '1" Sling', price: 4500, stock: 3 }],
    likes: 312,
    createdAt: '2025-01-08T00:00:00Z', updatedAt: '2025-01-08T00:00:00Z'
  },
  {
    id: 'prod-009', name: 'Indian Ornamental', scientificName: 'Poecilotheria regalis',
    mainCategory: 'Tarantulas', careLevel: 'advanced',
    category: 'arboreal', origin: 'old-world', temperament: 'aggressive',
    humidity: '70-80%', temperature: '25-28°C',
    feeding: 'Insects - Weekly', description: 'A large, fast, and beautiful arboreal species from India.',
    images: ['/images/indianOrnamental.webp'], featured: false, isVisible: true, available: true,
    tarantulaMeta: { world: 'Old World', type: 'Arboreal', temperament: 'aggressive', growthRate: 'Fast', sizeCategory: 'Juvenile', gender: 'Unsexed' },
    sizes: [{ size: '1.5" Juvenile', price: 3200, stock: 4 }],
    likes: 156,
    createdAt: '2025-01-09T00:00:00Z', updatedAt: '2025-01-09T00:00:00Z'
  },
  {
    id: 'prod-010', name: 'King Baboon', scientificName: 'Pelinobius muticus',
    mainCategory: 'Tarantulas', careLevel: 'expert',
    category: 'fossorial', origin: 'old-world', temperament: 'aggressive',
    humidity: '50-60%', temperature: '26-30°C',
    feeding: 'Roaches - Weekly', description: 'A massive Old World fossorial species known for its thick back legs and defensive nature.',
    images: ['/images/kingBaboon.jpg'], featured: false, isVisible: true, available: true,
    tarantulaMeta: { world: 'Old World', type: 'Fossorial', temperament: 'aggressive', growthRate: 'Slow', sizeCategory: 'Sub-adult', gender: 'Unsexed' },
    sizes: [{ size: '2" Sub-adult', price: 4800, stock: 2 }],
    likes: 98,
    createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z'
  },
  {
    id: 'prod-011', name: 'Mexican Fireleg', scientificName: 'Brachypelma boehmei',
    mainCategory: 'Tarantulas', careLevel: 'beginner',
    category: 'terrestrial', origin: 'new-world', temperament: 'docile',
    humidity: '50-60%', temperature: '24-28°C',
    feeding: 'Crickets - Weekly', description: 'Stunning species with bright orange legs and a calm temperament.',
    images: ['/images/mexicanFireleg.jpg'], featured: true, isVisible: true, available: true,
    tarantulaMeta: { world: 'New World', type: 'Terrestrial', temperament: 'docile', growthRate: 'Slow', sizeCategory: 'Sling', gender: 'Unsexed' },
    sizes: [{ size: '1/2" Sling', price: 1800, stock: 10 }],
    likes: 210,
    createdAt: '2025-01-11T00:00:00Z', updatedAt: '2025-01-11T00:00:00Z'
  },
  {
    id: 'prod-012', name: 'Singapore Blue', scientificName: 'Lampropelma violaceopes',
    mainCategory: 'Tarantulas', careLevel: 'expert',
    category: 'arboreal', origin: 'old-world', temperament: 'aggressive',
    humidity: '80-90%', temperature: '25-28°C',
    feeding: 'Insects - Weekly', description: 'A large and beautiful arboreal species with deep purple and blue tones.',
    images: ['/images/singaporeBlue.webp'], featured: true, isVisible: true, available: true,
    tarantulaMeta: { world: 'Old World', type: 'Arboreal', temperament: 'aggressive', growthRate: 'Fast', sizeCategory: 'Juvenile', gender: 'Unsexed' },
    sizes: [{ size: '2" Juvenile', price: 4200, stock: 3 }],
    likes: 145,
    createdAt: '2025-01-12T00:00:00Z', updatedAt: '2025-01-12T00:00:00Z'
  },
  {
    id: 'prod-015', name: 'Rose Hair', scientificName: 'Grammostola rosea',
    mainCategory: 'Tarantulas', careLevel: 'beginner',
    category: 'terrestrial', origin: 'new-world', temperament: 'docile',
    humidity: '40-50%', temperature: '22-26°C',
    feeding: 'Crickets - Weekly', description: 'The classic beginner tarantula. Hardy, docile, and long-lived.',
    images: ['/images/roseHair.jpg'], featured: false, isVisible: true, available: true,
    tarantulaMeta: { world: 'New World', type: 'Terrestrial', temperament: 'docile', growthRate: 'Slow', sizeCategory: 'Adult', gender: 'Female' },
    sizes: [{ size: 'Adult', price: 3500, stock: 2 }],
    likes: 67,
    createdAt: '2025-01-15T00:00:00Z', updatedAt: '2025-01-15T00:00:00Z'
  },
  {
    id: 'prod-016', name: 'Emperor Scorpion', scientificName: 'Pandinus imperator',
    mainCategory: 'Scorpions', careLevel: 'beginner',
    category: 'tropical forest', sizeCategory: 'Adult', gender: 'Unsexed',
    humidity: '70-80%', temperature: '26-30°C',
    feeding: 'Crickets, mealworms - Weekly', description: 'The most popular pet scorpion. Large, glossy black, and one of the mildest-venomed species. Their thick pincers indicate they rely on grip over sting.',
    images: ['/images/emperorScorpion.webp'], featured: true, isVisible: true, available: true,
    scorpionMeta: { habitatType: 'Tropical Forest', venomPotency: 'Mild', pincerType: 'Thick', communal: true, sizeCategory: 'Adult', gender: 'Unsexed' },
    sizes: [{ size: 'Adult', price: 2500, stock: 5 }],
    likes: 432,
    createdAt: '2025-02-01T00:00:00Z', updatedAt: '2025-02-01T00:00:00Z'
  },
  {
    id: 'prod-017', name: 'Vietnamese Centipede', scientificName: 'Scolopendra subspinipes',
    mainCategory: 'Centipedes', careLevel: 'expert',
    category: 'tropical', sizeCategory: 'Adult', gender: 'Unsexed',
    humidity: '75-85%', temperature: '24-28°C',
    feeding: 'Crickets, roaches, mealworms - Weekly', description: 'One of the largest and most impressive centipede species. Fast, aggressive, and carries potent venom. Strictly solitary — never cohabitate.',
    images: ['/images/vietnameseGiantCentipede.webp'], featured: true, isVisible: true, available: true,
    centipedeMeta: { habitatType: 'Tropical', venomPotency: 'Potent', legPairs: '21', sizeCategory: 'Adult', gender: 'Unsexed' },
    sizes: [{ size: 'Large', price: 1800, stock: 3 }],
    likes: 278,
    createdAt: '2025-02-02T00:00:00Z', updatedAt: '2025-02-02T00:00:00Z'
  },
];

const COURSES: Course[] = [
  {
    id: 'course-001', 
    title: 'Tarantula Keeping 101', 
    description: 'The complete beginner\'s guide to keeping your first tarantula. Learn about enclosure setup, feeding, temperature and humidity requirements, and common health issues.',
    price: 999, 
    thumbnail: '/images/curlyHair.webp',
    contentPreview: 'This comprehensive course covers everything from choosing your first species to creating the perfect habitat.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    difficulty: 'beginner', 
    duration: '4 hours', 
    featured: true,
    likes: 124,
    createdAt: '2025-01-01T00:00:00Z', 
    updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'course-002', 
    title: 'Advanced Husbandry', 
    description: 'Deep dive into advanced tarantula husbandry techniques including breeding, creating bioactive enclosures, and managing large collections.',
    price: 1999, 
    thumbnail: '/images/brazilianBlack-1.webp',
    contentPreview: 'Take your tarantula keeping to the next level with professional-grade husbandry techniques.',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Placeholder
    difficulty: 'advanced', 
    duration: '8 hours', 
    featured: true,
    likes: 89,
    createdAt: '2025-01-02T00:00:00Z', 
    updatedAt: '2025-01-02T00:00:00Z'
  },
];

function generateSlots(): ConsultationSlot[] {
  const slots: ConsultationSlot[] = [];
  const times = ['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  const today = new Date();

  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0) continue; // Skip Sundays

    const dateStr = date.toISOString().split('T')[0];
    times.forEach((time, idx) => {
      slots.push({
        id: `slot-${dateStr}-${idx}`,
        date: dateStr,
        time,
        available: Math.random() > 0.3,
      });
    });
  }
  return slots;
}

const CARE_GUIDES: CareGuide[] = [
  {
    id: 'guide-001', title: 'Complete Beginner\'s Guide to Tarantula Care',
    excerpt: 'Everything you need to know before getting your first tarantula companion. From species selection to basic housing.',
    content: 'Tarantulas make fascinating and low-maintenance pets for the right person. Before bringing home your first eight-legged friend, there are several key things to consider.\n\n### 1. Choosing Your First Species\nFor beginners, we highly recommend New World terrestrial species. They are generally slower-moving, less defensive, and have less potent venom than Old World species. Excellent first choices include:\n- Mexican Red Knee (Brachypelma hamorii)\n- Brazilian Black (Grammostola pulchra)\n- Curly Hair (Tliltocatl albopilosus)\n\n### 2. Enclosure Basics\nA proper enclosure should be secure, well-ventilated, and appropriately sized. For terrestrial species, floor space is more important than height. A general rule is the enclosure should be 3-4 times the leg span of the spider in length.\n\n### 3. Temperature and Humidity\nMost common beginner species thrive at room temperature (22-28°C). Humidity requirements vary by species but generally range from 60-70%. Always provide a shallow water dish with fresh water.\n\n### 4. Feeding\nTarantulas are insectivores. Slings (babies) should be fed twice a week, while adults usually only need to eat once every 7-10 days. Appropriate prey includes crickets, roaches, and mealworms.',
    image: '/images/curlyHair-2.avif', category: 'Beginner',
    readTime: '8 min read'
  },
];

const DEFAULT_USERS: User[] = [
  {
    id: 'admin',
    name: 'Admin',
    email: 'admin@arachnidsark.com',
    password: 'admin123',
    role: 'admin',
    phone: '+91 9876543210',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-001',
    name: 'User',
    email: 'user@example.com',
    password: 'user123',
    role: 'user',
    phone: '+91 9999988888',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

export function seedDatabase(): void {
  const products = LocalStorage.getAll<Product>('products');
  const users = LocalStorage.getAll<User>('users');
  const needsReseed = products.length < 14 || users.length < 2 || products.some(p => !p.mainCategory);

  if (LocalStorage.isSeeded() && !needsReseed) return;

  LocalStorage.setAll('users', DEFAULT_USERS);
  LocalStorage.setAll('products', PRODUCTS);
  LocalStorage.setAll('courses', COURSES);
  LocalStorage.setAll('orders', []); // Changed from inquiries
  LocalStorage.setAll('enrollments', []);
  LocalStorage.setAll('bookings', []);
  LocalStorage.setAll('notifications', []);
  LocalStorage.setAll('reviews', []);
  LocalStorage.setAll('care_guides', CARE_GUIDES);

  const settings: ConsultationSettings = {
    pricing: DEFAULT_CONSULTATION_PRICING,
    urgencyMultipliers: DEFAULT_URGENCY_MULTIPLIERS,
    slots: generateSlots(),
  };
  LocalStorage.setAll('consultation_settings', [settings]);

  const systemSettings: SystemSettings = {
    upiIds: [
      { id: 'upi-1', label: 'Primary UPI', value: 'payments@arachnidsark', isDefault: true },
    ],
    bankDetails: 'Bank Name: HDFC Bank\nAccount Name: ArachnidsArk Pvt Ltd\nAccount Number: 50200001234567\nIFSC Code: HDFC0001234',
    paymentInstructions: 'Please ensure you add your order ID in the payment remarks.',
    emailNotifications: {
      orderConfirmations: true,
      paymentVerification: true,
      consultationReminders: true,
    },
    storeStatus: {
      maintenanceMode: false,
      acceptingConsultations: true,
    },
    shippingSettings: {
      rules: [
        { id: 'ship-1', minQuantity: 1, maxQuantity: 2, charge: 250 },
        { id: 'ship-2', minQuantity: 3, maxQuantity: 5, charge: 400 },
        { id: 'ship-3', minQuantity: 6, maxQuantity: 99, charge: 600 },
      ],
      disclaimer: 'Note: Shipping charges may vary based on the time and seasonal conditions to ensure the safety of live arrivals.',
    },
  };
  LocalStorage.setAll('system_settings', [systemSettings]);

  LocalStorage.markSeeded();
}
