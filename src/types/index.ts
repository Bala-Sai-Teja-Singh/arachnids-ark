// ============ USER ============
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, 'password'>;

// ============ PRODUCT ============
export type ProductType = 'terrestrial' | 'arboreal' | 'fossorial';
export type ProductOrigin = 'new-world' | 'old-world';
export type MainCategory = 'Tarantulas' | 'Centipedes' | 'Scorpions';

export type CareLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type Temperament = 'docile' | 'semi-aggressive' | 'aggressive' | 'defensive';

// Tarantula-specific
export type TarantulaWorld = 'New World' | 'Old World';
export type TarantulaType = 'Terrestrial' | 'Arboreal' | 'Fossorial';
export type TarantulaSizeCategory = 'Sling' | 'Juvenile' | 'Sub-adult' | 'Adult';
export type TarantulaGrowthRate = 'Slow' | 'Medium' | 'Fast';

// Scorpion-specific
export type ScorpionHabitatType = 'Desert' | 'Tropical Forest';
export type ScorpionVenomPotency = 'Mild' | 'Moderate' | 'Medically Significant' | 'Lethal';
export type ScorpionPincerType = 'Thin' | 'Medium' | 'Thick';
export type ScorpionSizeCategory = 'Scorpling' | 'Juvenile' | 'Sub-adult' | 'Adult';

// Centipede-specific
export type CentipedeHabitatType = 'Tropical' | 'Arid';
export type CentipedeVenomPotency = 'Mild' | 'Moderate' | 'Severe' | 'Potent';
export type CentipedeSizeCategory = 'Pedeling' | 'Juvenile' | 'Sub-adult' | 'Adult';

export interface TarantulaMetadata {
  world: TarantulaWorld;
  type: TarantulaType;
  temperament: Temperament;
  growthRate?: TarantulaGrowthRate;
  sizeCategory?: TarantulaSizeCategory;
  gender?: 'Unsexed' | 'Male' | 'Female' | 'Pair';
}

export interface ScorpionMetadata {
  habitatType: ScorpionHabitatType;
  venomPotency: ScorpionVenomPotency;
  pincerType: ScorpionPincerType;
  communal: boolean;
  sizeCategory?: ScorpionSizeCategory;
  gender?: 'Unsexed' | 'Male' | 'Female' | 'Pair';
}

export interface CentipedeMetadata {
  habitatType: CentipedeHabitatType;
  venomPotency: CentipedeVenomPotency;
  legPairs?: string;
  sizeCategory?: CentipedeSizeCategory;
  gender?: 'Unsexed' | 'Male' | 'Female';
}

export interface ProductSize {
  size: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  scientificName: string;
  mainCategory: MainCategory;
  careLevel: CareLevel;
  humidity: string;
  temperature: string;
  feeding: string;
  description: string;
  images: string[];
  featured: boolean;
  available: boolean;
  isVisible: boolean;
  sizes: ProductSize[];

  // Entity-specific metadata (only one will be populated based on mainCategory)
  tarantulaMeta?: TarantulaMetadata;
  scorpionMeta?: ScorpionMetadata;
  centipedeMeta?: CentipedeMetadata;

  // Legacy fields kept for backwards compatibility with shop filters/badges
  category?: ProductType;
  origin?: ProductOrigin;
  temperament?: Temperament;
  sizeCategory?: string;
  gender?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  category?: ProductType;
  mainCategory?: MainCategory;
  origin?: ProductOrigin;
  careLevel?: CareLevel;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
}

// ============ ORDER ============
export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'payment_uploaded'
  | 'verified'
  | 'rejected'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  size: string;
}

// ============ SYSTEM SETTINGS ============
export interface UPIId {
  id: string;
  label: string;
  value: string;
  isDefault: boolean;
}

export interface SystemSettings {
  upiIds: UPIId[];
  bankDetails: string;
  paymentInstructions: string;
  emailNotifications: {
    orderConfirmations: boolean;
    paymentVerification: boolean;
    consultationReminders: boolean;
  };
  storeStatus: {
    maintenanceMode: boolean;
    acceptingConsultations: boolean;
  };
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  message: string;
  status: OrderStatus;
  paymentScreenshot?: string;
  adminNote?: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  totalPrice: number;
  upiId?: string; // The UPI ID used for payment
  createdAt: string;
  updatedAt: string;
}

// ============ COURSE ============
export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  contentPreview: string;
  modules: CourseModule[];
  difficulty: CareLevel;
  duration: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  locked: boolean;
}

export type EnrollmentStatus = OrderStatus;

export interface CourseEnrollment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseTitle: string;
  status: EnrollmentStatus;
  paymentScreenshot?: string;
  adminNote?: string;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

// ============ CONSULTATION ============
export type ConsultationDuration = number;
export type ConsultationUrgency = 'normal' | 'priority' | 'emergency';

export interface ConsultationPricing {
  duration: ConsultationDuration;
  basePrice: number;
  label: string;
}

export interface UrgencyMultiplier {
  urgency: ConsultationUrgency;
  multiplier: number;
  label: string;
}

export interface ConsultationSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export interface ConsultationSettings {
  pricing: ConsultationPricing[];
  urgencyMultipliers: UrgencyMultiplier[];
  slots: ConsultationSlot[];
}

export type BookingStatus = OrderStatus;

export interface ConsultationBooking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  duration: ConsultationDuration;
  urgency: ConsultationUrgency;
  slotId: string;
  slotDate: string;
  slotTime: string;
  query: string;
  basePrice?: number;
  multiplier?: number;
  totalPrice?: number;
  status: BookingStatus;
  paymentScreenshot?: string;
  adminNote?: string;
  minutesUsed?: number;
  items?: {
    duration: number;
    quantity: number;
    label: string;
    basePrice: number;
    urgency: string;
    minutesUsed?: number;
    slots?: {
      id: string;
      date: string;
      time: string;
      duration: number;
    }[];
  }[];
  createdAt: string;
  updatedAt: string;
}

// ============ NOTIFICATION ============
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'payment' | 'order' | 'booking';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ============ REVIEW ============
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
}

// ============ CARE GUIDE ============
export interface CareGuide {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  readTime: string;
}
