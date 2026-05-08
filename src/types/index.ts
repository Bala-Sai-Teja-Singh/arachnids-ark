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

export type CareLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type Temperament = 'docile' | 'semi-aggressive' | 'aggressive' | 'defensive';

export interface Product {
  id: string;
  name: string;
  scientificName: string;
  category: ProductType;
  origin: ProductOrigin;
  price: number;
  stock: number;
  careLevel: CareLevel;
  temperament: Temperament;
  humidity: string;
  temperature: string;
  feeding: string;
  description: string;
  images: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilter {
  category?: ProductType;
  origin?: ProductOrigin;
  careLevel?: CareLevel;
  temperament?: Temperament;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  inStock?: boolean;
}

// ============ INQUIRY ============
export type InquiryStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'payment_uploaded'
  | 'verified'
  | 'rejected'
  | 'confirmed'
  | 'completed'
  | 'cancelled';

export interface Inquiry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  productId: string;
  productName: string;
  message: string;
  quantity: number;
  status: InquiryStatus;
  paymentScreenshot?: string;
  adminNote?: string;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  totalPrice: number;
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

export type EnrollmentStatus = InquiryStatus;

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

export type BookingStatus = InquiryStatus;

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
  createdAt: string;
  updatedAt: string;
}

// ============ NOTIFICATION ============
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'payment' | 'inquiry' | 'booking';

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
