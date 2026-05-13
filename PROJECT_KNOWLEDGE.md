# Project Knowledge Base: ArachnidsArk

This document serves as a comprehensive technical guide for AI agents to understand the ArachnidsArk codebase, architecture, and feature set instantly.

## 1. Project Overview
ArachnidsArk is a premium ecommerce and educational platform for the arachnid hobby. It combines a specialized livestock shop, a course management system, and an expert consultation service.

- **Frontend**: Next.js 15+ (App Router), React, Tailwind CSS.
- **Animations**: Framer Motion (used extensively for premium UI "vibes").
- **State Management**: Zustand (Auth, Cart, Notifications, Favorites).
- **Communication**: Resend API for automated email notifications.
- **Database**: 
  - **Current**: Client-side `LocalStorage` (via `src/mock-db/storage.ts`).
  - **Migration Path**: MongoDB Atlas (Mongoose).
- **Styling**: Vanilla CSS + Tailwind. Design aesthetic is "Dark Premium/Glassmorphism" with Gold/Red accents.

---

## 2. File Structure Highlights
- `/src/app/(auth)`: OTP-based signup, login, and password reset flows.
- `/src/app/(user)`: Customer-facing pages (Shop, Courses, Consultation, Care Guides).
- `/src/app/admin`: Comprehensive admin dashboard for orders, products, and system settings.
- `/src/components/shared`: Reusable complex organisms like `video-player.tsx`, `cart-drawer.tsx`, and `form-builder.tsx`.
- `/src/store`: Zustand stores handling global application state.
- `/src/mock-db`: Mock database logic and initial seeding data.

---

## 3. Core Features & Business Logic

### A. Shop & Products
- **Categories**: Tarantulas, Scorpions, Centipedes.
- **Metadata**: Each category has unique attributes (e.g., Venom Potency for Scorpions, Habitat Type for Centipedes).
- **Varieties**: Products support multiple sizes (Sling, Juvenile, etc.) with individual price/stock.
- **Shipping**: Dynamic shipping charges based on quantity-range rules defined in System Settings.

### B. Course Management & Video Security
- **Access**: Courses are unlocked automatically when an order containing a course is marked as `payment_verified`.
- **Security Player (`video-player.tsx`)**:
  - **Grid Watermark**: Repeating identifier (Email | Phone) covering the background.
  - **Floating Watermark**: Moving SECURE badge to prevent screen recording.
  - **Reactive Deterrents**: Video pauses and blurs for 3 seconds if screenshot shortcuts (`PrintScreen`, `Cmd+Shift+3/4`) are detected.
  - **Hard Blocks**: Right-click disabled, `nodownload` enforced, Picture-in-Picture disabled.

### C. Consultation System
- **Model**: Flexible "Talktime" sessions. Users buy minutes (e.g., 60 mins) and use them for multiple interactions.
- **Layout**: Desktop-optimized sidebar layout for save vertical space.
- **Urgency**: Pricing multipliers for Normal, Priority, and Emergency consultations.

### D. Authentication Flow
- **Signup**: 2-step process. 1) Info entry with unique email check. 2) 6-digit OTP verification via email (Resend).
- **Roles**: `admin` (access to `/admin`) and `user` (access to `/dashboard`).

---

## 4. Database Schemas (Types)
Defined in `src/types/index.ts`:
- **User**: ID, Name, Email, Phone, Role, Timestamps.
- **Product**: ID, Scientific Name, MainCategory, CareLevel, Sizes (Price/Stock), Meta (Tarantula/Scorpion/Centipede specific).
- **Order**: Items (OrderItem), Status (OrderStatus), ShippingCharge, PaymentScreenshot, TrackingID.
- **Course**: Title, VideoUrl, Difficulty, EnrollmentStatus.
- **Consultation**: Duration, Urgency, Slots, MinutesUsed.
- **SystemSettings**: UPI IDs, Shipping Rules, Module Toggles (Show/Hide Shop/Courses).

---

## 5. Development Guidelines for Agents
- **Aesthetics**: Always prioritize "wow" factor. Use gradients, glassmorphism, and smooth transitions.
- **Security**: Never compromise the video player's identification watermarks.
- **Data Integrity**: When performing mutations, always check the `users` collection for uniqueness (especially email).
- **Next.js Conventions**: Follow the App Router structure. Use `'use client'` sparingly for interactive components.
- **Email Testing**: Use `IS_SANDBOX_MODE` in `.env.local` to redirect all emails to a single `TEST_EMAIL` during development.

---

## 6. Recent Major Updates
1. **Hardened Video Security**: Implemented reactive blurring and grid watermarks.
2. **Consultation Layout**: Refactored to a side-by-side desktop grid with a sticky sidebar.
3. **OTP Signup**: Added email verification and unique email constraint.
4. **Self-Healing Enrollment**: Added logic to `My Courses` that auto-syncs missing enrollments if a paid order exists.

---

## 7. Future Roadmap: MongoDB Atlas Migration
The platform is currently in a "Bridge" phase, transitioning from `LocalStorage` to **MongoDB Atlas**.

### Migration Goals:
- **Persistence**: Move away from browser-specific storage to a centralized, real-time database.
- **Async Architecture**: Refactor `src/mock-db/storage.ts` to act as an asynchronous proxy for MongoDB API routes.
- **Mongoose Integration**: Implement schemas for all existing types in `src/models/*.ts`.
- **Infrastructure**:
    - **MONGODB_URI**: Required in `.env.local` for cluster connection.
    - **NextAuth.js**: Transition custom auth to use the official NextAuth MongoDB adapter.
    - **Real-time**: Potential for MongoDB Change Streams to power instant notifications.

### Implementation Strategy:
1. **The API Bridge**: Modify the `LocalStorage` helper to use `fetch()` calls to `/api/db/[collection]` instead of reading from the browser. This allows for a "drop-in" backend replacement with minimal UI changes.
2. **Data Sync**: Implement a one-time migration script to push current browser data to the Atlas cluster.
