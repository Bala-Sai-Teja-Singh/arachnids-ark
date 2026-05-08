'use client';

import type { User, Product, Course, ConsultationSettings, ConsultationSlot, CareGuide } from '@/types';
import { LocalStorage } from './storage';
import { DEFAULT_CONSULTATION_PRICING, DEFAULT_URGENCY_MULTIPLIERS } from '@/constants/pricing';

const PRODUCTS: Product[] = [
  {
    id: 'prod-001', name: 'Mexican Red Knee', scientificName: 'Brachypelma hamorii',
    category: 'terrestrial', origin: 'new-world', price: 4500, stock: 8, careLevel: 'beginner',
    temperament: 'docile', humidity: '60-70%', temperature: '24-28°C',
    feeding: 'Crickets, mealworms - Weekly', description: 'One of the most iconic tarantula species in the hobby. The Mexican Red Knee is known for its stunning coloration with bright orange-red patches on its leg joints. This species is incredibly docile, making it the perfect choice for beginners. They are slow-growing and can live up to 30 years in captivity.',
    images: ['/images/mexicanRedKnee.webp'], featured: true,
    createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'prod-002', name: 'Green Bottle Blue', scientificName: 'Chromatopelma cyaneopubescens',
    category: 'terrestrial', origin: 'new-world', price: 3800, stock: 5, careLevel: 'beginner',
    temperament: 'semi-aggressive', humidity: '40-60%', temperature: '26-30°C',
    feeding: 'Crickets, roaches - Twice weekly', description: 'A breathtaking species featuring metallic blue legs, a green carapace, and an orange abdomen. The Green Bottle Blue is a prolific webber, creating impressive web structures in its enclosure. Despite its beauty, this species can be skittish but is generally not aggressive.',
    images: ['/images/greenBottleBlue.webp'], featured: true,
    createdAt: '2025-01-02T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z'
  },
  {
    id: 'prod-003', name: 'Cobalt Blue', scientificName: 'Cyriopagopus lividus',
    category: 'fossorial', origin: 'old-world', price: 5500, stock: 3, careLevel: 'expert',
    temperament: 'aggressive', humidity: '75-85%', temperature: '25-28°C',
    feeding: 'Crickets, roaches - Weekly', description: 'The Cobalt Blue is a stunning Old World species known for its iridescent blue coloration. This fossorial species spends most of its time in deep burrows and can be extremely defensive when disturbed. Recommended only for experienced keepers due to its potent venom and aggressive nature.',
    images: ['/images/cobaltBlue-1.webp', '/images/cobaltBlue-2.jpg'], featured: true,
    createdAt: '2025-01-03T00:00:00Z', updatedAt: '2025-01-03T00:00:00Z'
  },
  {
    id: 'prod-004', name: 'Pinktoe Tarantula', scientificName: 'Avicularia avicularia',
    category: 'arboreal', origin: 'new-world', price: 2800, stock: 12, careLevel: 'intermediate',
    temperament: 'docile', humidity: '70-80%', temperature: '24-27°C',
    feeding: 'Crickets, flying insects - Twice weekly', description: 'A charming arboreal species with a dark body and distinctive pink toes. The Pinktoe Tarantula is known for its gentle temperament and fascinating arboreal behavior. They require good ventilation and vertical space in their enclosure.',
    images: ['/images/pinkToe.webp'], featured: false,
    createdAt: '2025-01-04T00:00:00Z', updatedAt: '2025-01-04T00:00:00Z'
  },
  {
    id: 'prod-005', name: 'Indian Ornamental', scientificName: 'Poecilotheria regalis',
    category: 'arboreal', origin: 'old-world', price: 6200, stock: 4, careLevel: 'expert',
    temperament: 'aggressive', humidity: '70-80%', temperature: '24-28°C',
    feeding: 'Crickets, roaches - Weekly', description: 'A magnificent Old World arboreal species known for its intricate fractal-like patterns. The Indian Ornamental is incredibly fast and possesses medically significant venom. Their stunning appearance makes them highly sought after, but they should only be kept by experienced hobbyists.',
    images: ['/images/indianOrnamental.webp'], featured: true,
    createdAt: '2025-01-05T00:00:00Z', updatedAt: '2025-01-05T00:00:00Z'
  },
  {
    id: 'prod-006', name: 'Curly Hair Tarantula', scientificName: 'Tliltocatl albopilosus',
    category: 'terrestrial', origin: 'new-world', price: 1800, stock: 15, careLevel: 'beginner',
    temperament: 'docile', humidity: '65-75%', temperature: '24-28°C',
    feeding: 'Crickets, mealworms - Weekly', description: 'An adorable species covered in curly golden-brown hairs. The Curly Hair is one of the most docile tarantulas available, making it an excellent beginner species. They are hardy, easy to care for, and have a calm temperament that makes handling possible.',
    images: ['/images/curlyHair.webp', '/images/curlyHair-2.avif'], featured: false,
    createdAt: '2025-01-06T00:00:00Z', updatedAt: '2025-01-06T00:00:00Z'
  },
  {
    id: 'prod-007', name: 'Gooty Sapphire Ornamental', scientificName: 'Poecilotheria metallica',
    category: 'arboreal', origin: 'old-world', price: 12000, stock: 2, careLevel: 'expert',
    temperament: 'aggressive', humidity: '70-80%', temperature: '22-26°C',
    feeding: 'Crickets, roaches - Weekly', description: 'One of the most stunning and sought-after tarantula species in existence. The Gooty Sapphire features an incredible metallic blue coloration that has made it the crown jewel of many collections. Critically endangered in the wild, captive breeding programs are essential for this species.',
    images: ['/images/gootSapphire.webp'], featured: true,
    createdAt: '2025-01-07T00:00:00Z', updatedAt: '2025-01-07T00:00:00Z'
  },
  {
    id: 'prod-008', name: 'Brazilian Black', scientificName: 'Grammostola pulchra',
    category: 'terrestrial', origin: 'new-world', price: 8500, stock: 3, careLevel: 'beginner',
    temperament: 'docile', humidity: '60-70%', temperature: '22-26°C',
    feeding: 'Crickets, roaches - Weekly', description: 'An elegant, jet-black species that is both stunning and incredibly docile. The Brazilian Black is a heavy-bodied terrestrial species prized for its velvety black appearance and calm demeanor. Slow-growing but long-lived, this species is a prized addition to any collection.',
    images: ['/images/brazilianBlack-1.webp', '/images/brazilianBlack-2.jpg'], featured: true,
    createdAt: '2025-01-08T00:00:00Z', updatedAt: '2025-01-08T00:00:00Z'
  },
  {
    id: 'prod-009', name: 'King Baboon', scientificName: 'Pelinobius muticus',
    category: 'fossorial', origin: 'old-world', price: 7000, stock: 4, careLevel: 'advanced',
    temperament: 'aggressive', humidity: '65-75%', temperature: '24-28°C',
    feeding: 'Crickets, roaches, small mice - Weekly', description: 'The King Baboon is one of the largest and most impressive Old World species. This massive tarantula can reach leg spans of up to 20cm. Known for their burrowing behavior and defensive stridulation (hissing). They are not recommended for beginners due to their defensive nature.',
    images: ['/images/kingBaboon.jpg'], featured: false,
    createdAt: '2025-01-09T00:00:00Z', updatedAt: '2025-01-09T00:00:00Z'
  },
  {
    id: 'prod-010', name: 'Mexican Fireleg', scientificName: 'Brachypelma boehmei',
    category: 'terrestrial', origin: 'new-world', price: 5000, stock: 6, careLevel: 'intermediate',
    temperament: 'semi-aggressive', humidity: '55-65%', temperature: '24-28°C',
    feeding: 'Crickets, mealworms - Weekly', description: 'A vibrant species with striking fire-red legs and a dark body. The Mexican Fireleg is closely related to the Red Knee but features even more vivid coloration. While generally calm, they can flick urticating hairs when stressed.',
    images: ['/images/mexicanFireleg.jpg'], featured: false,
    createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z'
  },
  {
    id: 'prod-011', name: 'Singapore Blue', scientificName: 'Omothymus violaceopes',
    category: 'arboreal', origin: 'old-world', price: 9500, stock: 2, careLevel: 'advanced',
    temperament: 'aggressive', humidity: '75-85%', temperature: '25-30°C',
    feeding: 'Crickets, roaches - Twice weekly', description: 'One of the largest arboreal tarantulas in the world, the Singapore Blue can reach impressive leg spans of over 25cm. Featuring stunning metallic blue and yellow-gold coloration, this species is a showstopper. Fast and defensive, it requires an experienced keeper.',
    images: ['/images/singaporeBlue.webp'], featured: false,
    createdAt: '2025-01-11T00:00:00Z', updatedAt: '2025-01-11T00:00:00Z'
  },
  {
    id: 'prod-012', name: 'Rose Hair Tarantula', scientificName: 'Grammostola rosea',
    category: 'terrestrial', origin: 'new-world', price: 1500, stock: 20, careLevel: 'beginner',
    temperament: 'docile', humidity: '50-60%', temperature: '22-26°C',
    feeding: 'Crickets, mealworms - Weekly', description: 'The quintessential beginner tarantula. The Rose Hair is incredibly hardy and forgiving of husbandry mistakes. With its pinkish-brown coloration and calm disposition, this species has introduced countless people to the tarantula hobby.',
    images: ['/images/roseHair.jpg'], featured: false,
    createdAt: '2025-01-12T00:00:00Z', updatedAt: '2025-01-12T00:00:00Z'
  },
];

const COURSES: Course[] = [
  {
    id: 'course-001', title: 'Tarantula Keeping 101', description: 'The complete beginner\'s guide to keeping your first tarantula. Learn about enclosure setup, feeding, temperature and humidity requirements, and common health issues.',
    price: 999, thumbnail: '/images/curlyHair.webp',
    contentPreview: 'This comprehensive course covers everything from choosing your first species to creating the perfect habitat.',
    difficulty: 'beginner', duration: '4 hours', featured: true,
    modules: [
      { id: 'mod-001', title: 'Choosing Your First Tarantula', description: 'Species selection, what to look for, reputable sources', locked: false },
      { id: 'mod-002', title: 'Enclosure Setup', description: 'Substrates, hides, water dishes, ventilation', locked: true },
      { id: 'mod-003', title: 'Feeding & Nutrition', description: 'Prey items, feeding schedules, supplements', locked: true },
      { id: 'mod-004', title: 'Health & Molting', description: 'Signs of illness, molting process, when to seek help', locked: true },
    ],
    createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z'
  },
  {
    id: 'course-002', title: 'Advanced Husbandry', description: 'Deep dive into advanced tarantula husbandry techniques including breeding, creating bioactive enclosures, and managing large collections.',
    price: 1999, thumbnail: '/images/brazilianBlack-1.webp',
    contentPreview: 'Take your tarantula keeping to the next level with professional-grade husbandry techniques.',
    difficulty: 'advanced', duration: '8 hours', featured: true,
    modules: [
      { id: 'mod-005', title: 'Bioactive Enclosures', description: 'Creating self-sustaining ecosystems', locked: false },
      { id: 'mod-006', title: 'Breeding Basics', description: 'Pairing, mating, egg sacs', locked: true },
      { id: 'mod-007', title: 'Collection Management', description: 'Record keeping, organization, health checks', locked: true },
      { id: 'mod-008', title: 'Advanced Feeding', description: 'Diverse prey items, gutloading, nutrition', locked: true },
    ],
    createdAt: '2025-01-02T00:00:00Z', updatedAt: '2025-01-02T00:00:00Z'
  },
  {
    id: 'course-003', title: 'Old World Species Mastery', description: 'Specialized course on keeping Old World tarantula species safely. Covers venom considerations, defensive behaviors, and specialized enclosure requirements.',
    price: 2499, thumbnail: '/images/cobaltBlue-1.webp',
    contentPreview: 'Learn the specialized skills needed to safely keep some of the world\'s most beautiful and challenging spiders.',
    difficulty: 'expert', duration: '6 hours', featured: true,
    modules: [
      { id: 'mod-009', title: 'Understanding Old World Species', description: 'Differences from New World, venom potency', locked: false },
      { id: 'mod-010', title: 'Safe Handling & Rehousing', description: 'Catch cups, transfer techniques, safety protocols', locked: true },
      { id: 'mod-011', title: 'Species Profiles', description: 'Detailed care sheets for popular OW species', locked: true },
      { id: 'mod-012', title: 'Emergency Protocols', description: 'Bite procedures, escape protocols', locked: true },
    ],
    createdAt: '2025-01-03T00:00:00Z', updatedAt: '2025-01-03T00:00:00Z'
  },
  {
    id: 'course-004', title: 'Tarantula Photography', description: 'Capture stunning photos of your tarantulas. Learn macro photography techniques, lighting setups, and post-processing for the perfect arachnid portrait.',
    price: 1499, thumbnail: '/images/mexicanRedKnee.webp',
    contentPreview: 'Turn your tarantula hobby into art with professional photography techniques.',
    difficulty: 'intermediate', duration: '3 hours', featured: false,
    modules: [
      { id: 'mod-013', title: 'Gear & Setup', description: 'Camera, lenses, lighting for macro', locked: false },
      { id: 'mod-014', title: 'Shooting Techniques', description: 'Angles, focus stacking, composition', locked: true },
      { id: 'mod-015', title: 'Post-Processing', description: 'Editing, color correction, sharpening', locked: true },
    ],
    createdAt: '2025-01-04T00:00:00Z', updatedAt: '2025-01-04T00:00:00Z'
  },
  {
    id: 'course-005', title: 'Breeding Masterclass', description: 'Complete guide to breeding tarantulas commercially. From pairing to raising slings, this course covers everything you need to become a successful breeder.',
    price: 3499, thumbnail: '/images/mexicanFireleg.jpg',
    contentPreview: 'Learn the art and science of tarantula breeding from an expert with 15+ years of experience.',
    difficulty: 'expert', duration: '10 hours', featured: false,
    modules: [
      { id: 'mod-016', title: 'Breeding Preparation', description: 'Maturing, conditioning, timing', locked: false },
      { id: 'mod-017', title: 'The Pairing Process', description: 'Introduction, mating, post-mating care', locked: true },
      { id: 'mod-018', title: 'Egg Sac Management', description: 'Incubation, pulling, artificial incubation', locked: true },
      { id: 'mod-019', title: 'Raising Slings', description: 'Communal rearing, individual housing, feeding', locked: true },
      { id: 'mod-020', title: 'Business Aspects', description: 'Pricing, marketing, shipping', locked: true },
    ],
    createdAt: '2025-01-05T00:00:00Z', updatedAt: '2025-01-05T00:00:00Z'
  },
  {
    id: 'course-006', title: 'Enclosure Design Workshop', description: 'Learn to create beautiful, functional tarantula enclosures. This workshop covers natural-looking terrariums, custom builds, and creative display solutions.',
    price: 1299, thumbnail: '/images/greenBottleBlue.webp',
    contentPreview: 'Transform standard enclosures into stunning displays that benefit both you and your tarantulas.',
    difficulty: 'intermediate', duration: '5 hours', featured: false,
    modules: [
      { id: 'mod-021', title: 'Design Principles', description: 'Form vs function, species requirements', locked: false },
      { id: 'mod-022', title: 'Natural Terrariums', description: 'Substrates, plants, hardscape', locked: true },
      { id: 'mod-023', title: 'Custom Builds', description: 'Acrylic, wood, 3D printing enclosures', locked: true },
    ],
    createdAt: '2025-01-06T00:00:00Z', updatedAt: '2025-01-06T00:00:00Z'
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
    excerpt: 'Everything you need to know before getting your first tarantula companion.',
    content: 'Detailed care guide content...',
    image: '/images/curlyHair-2.avif', category: 'Beginner',
    readTime: '8 min read'
  },
  {
    id: 'guide-002', title: 'Understanding Tarantula Molting',
    excerpt: 'Learn the signs of pre-molt, what to do during molting, and post-molt care.',
    content: 'Molting guide content...',
    image: '/images/brazilianBlack-2.jpg', category: 'Health',
    readTime: '6 min read'
  },
  {
    id: 'guide-003', title: 'Feeding Your Tarantula: A Complete Guide',
    excerpt: 'From prey selection to feeding schedules, master the art of tarantula nutrition.',
    content: 'Feeding guide content...',
    image: '/images/roseHair.jpg', category: 'Nutrition',
    readTime: '5 min read'
  },
  {
    id: 'guide-004', title: 'Setting Up the Perfect Enclosure',
    excerpt: 'Create the ideal habitat for your tarantula with proper substrate, humidity, and decoration.',
    content: 'Enclosure setup content...',
    image: '/images/kingBaboon.jpg', category: 'Housing',
    readTime: '7 min read'
  },
];

const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Admin',
    email: 'admin@arachnidsark.com',
    password: 'admin123',
    role: 'admin',
    phone: '+91 9876543210',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

export function seedDatabase(): void {
  const products = LocalStorage.getAll<Product>('products');
  const needsReseed = products.length > 0 && products.some(p => !p.origin);

  if (LocalStorage.isSeeded() && !needsReseed) return;

  LocalStorage.setAll('users', DEFAULT_USERS);
  LocalStorage.setAll('products', PRODUCTS);
  LocalStorage.setAll('courses', COURSES);
  LocalStorage.setAll('inquiries', []);
  LocalStorage.setAll('enrollments', []);
  LocalStorage.setAll('bookings', []);
  LocalStorage.setAll('notifications', []);
  LocalStorage.setAll('care_guides', CARE_GUIDES);
  
  const settings: ConsultationSettings = {
    pricing: DEFAULT_CONSULTATION_PRICING,
    urgencyMultipliers: DEFAULT_URGENCY_MULTIPLIERS,
    slots: generateSlots(),
  };
  LocalStorage.setAll('consultation_settings', [settings]);
  
  LocalStorage.markSeeded();
}
