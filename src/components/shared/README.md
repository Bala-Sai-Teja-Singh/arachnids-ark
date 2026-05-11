# ArachnidsArk Shared Component Library

This directory contains the core UI architecture of the platform, following **Atomic Design** principles. These components are generic, highly configurable, and used across both User and Admin interfaces.

## 🏗 Structure

- **Atoms**: Pure UI primitives (Input, Select, Button) that wrap Shadcn components with standard props (`value`, `onChange`, `onClear`, `onClose`).
- **Molecules**: Combinations of atoms with minimal logic (FormField, Modal, NavItem).
- **Organisms**: Complex, data-driven components (FormBuilder, Sidebar, Header).

## 🚀 Key Features

### 1. Universal App Shell
The `Sidebar` and `Header` components are universal. They accept a `sections` configuration to render different menus for Admin and User roles.
```tsx
const sections = [{ label: "Admin", items: ADMIN_NAV_ITEMS }];
<Sidebar sections={sections} isCollapsed={false} ... />
```

### 2. Form Builder
Standardize form creation using Zod schemas and JSON-like field configurations.
```tsx
const fields = [{ name: 'name', label: 'Full Name', type: 'text' }];
<FormBuilder schema={mySchema} fields={fields} onSubmit={handleSubmit} />
```

### 3. Consistency
All components use the standard `brand-gold` and `brand-red` color palette, premium micro-animations, and consistent glassmorphism effects.

## 📝 Usage Guidelines
- Always use these shared components instead of duplicating logic in pages.
- If a new feature requires a generic UI pattern, add it here as an Atom or Molecule.
- Maintain strict typing for all props to ensure build stability.
