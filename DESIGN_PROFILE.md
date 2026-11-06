# DESIGN_PROFILE.md
## AURA & FORMA — Curated Artisanal Living & Contemporary Homeware

### 1. Brand Concept & Philosophy
**AURA & FORMA** is an editorial-grade, warm minimalist e-commerce platform dedicated to handcrafted artisanal homeware, ceramic design, sculptural lighting, sustainable textiles, and botanical living goods. Unlike typical cookie-cutter digital storefronts that use generic corporate blue or intense purple gradients, **AURA & FORMA** draws inspiration from high-end architectural monographs, Japanese craft studios, and Scandinavian organic interior spaces.

The user experience focuses on deliberate luxury: generous whitespace, high-contrast typography, tactile card elevations, calm transitions, and clear real-time feedback.

---

### 2. Color Palette & Visual System

| Token Name | Hex Code | Purpose / Usage | Psychological Impact |
| :--- | :--- | :--- | :--- |
| `--color-forest-deep` | `#1A2621` | Brandmark, headers, customer navigation, admin sidebar | Grounded, sophisticated, enduring |
| `--color-forest-charcoal` | `#23322C` | Secondary dark elements, button hover states | Subtle depth without harsh pure black |
| `--color-terracotta` | `#C85A32` | Primary Call-To-Action (CTA), badges, active highlights | Warmth, artisanal craftsmanship, vital energy |
| `--color-terracotta-hover` | `#AF4722` | Button hover and active states | Tactile tactile responsiveness |
| `--color-sage` | `#60725C` | Category pills, in-stock indicators, secondary accents | Organic tranquility, natural balance |
| `--color-sage-light` | `#EAEFE9` | Success badges, subtle background chips | Gentle confirmation without visual noise |
| `--color-sand-bg` | `#F9F7F2` | Global page background, linen canvas | Soft on the eyes, warm editorial feeling |
| `--color-card-bg` | `#FFFFFF` | Product cards, modals, checkout container | High clarity, pristine display surface |
| `--color-border` | `#E8E2D8` | Structural dividing lines, card borders | Crisp separation with soft contrast |
| `--color-text-main` | `#1A211D` | Headings and primary paragraph copy | Maximum legibility and optical weight |
| `--color-text-muted` | `#66736A` | Subtitles, stock counters, metadata | Elegant secondary hierarchy |
| `--color-danger` | `#C2410C` | Out of stock alerts, deletion confirmations | Urgent yet harmonious with palette |
| `--color-warning` | `#D97706` | Low stock counter indicators | Immediate attention |

---

### 3. Typography Hierarchy

- **Display & Headings**: `'Playfair Display', Georgia, serif`
  - Evokes editorial elegance, craft luxury, and timeless design.
  - Used for the primary brand wordmark, page headlines, hero banners, and section titles.
- **Body & Controls**: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
  - High geometric clarity, open counters, and exceptional legibility at small sizes.
  - Used for product descriptions, navigation links, forms, stock indicators, and buttons.
- **Monospace & Metadata**: `'JetBrains Mono', Consolas, monospace`
  - Used for Order IDs, SKU numbers, timestamps, and inventory counters.

---

### 4. Page Architecture & Layout Strategy

#### A. Public & Customer Experience
1. **Header & Navigation Bar**:
   - Distinctive brandmark with artisanal sub-label ("AURA & FORMA · Curated Living").
   - Quick search input with instant clear and search actions.
   - Dynamic cart icon with a live animated pill counter (`cart-count`).
   - Customer profile badge / Authentication toggle.
2. **Hero Banner**:
   - Editorial split design highlighting the "Spring Equinox Crafted Collection".
   - Warm earthy gradient background with actionable primary CTA buttons.
3. **Category Pill Bar**:
   - Filter by: All Goods, Handcrafted Ceramics, Architectural Lighting, Sustainable Textiles, Organic Furniture, Studio Fragrance.
4. **Product Card Grid**:
   - Clean aspect-ratio container with image zoom on hover.
   - Stock status badge (`In Stock`, `Low Stock (Only X Left)`, or `Out of Stock`).
   - Direct Quantity selector and `Add to Cart` button with micro-animation.
5. **Interactive Shopping Cart**:
   - Rich product cards with thumbnail, unit price, quantity increment/decrement controls, item subtotal, and individual item removal.
   - Server-synchronized totals with free shipping eligibility threshold.
6. **Checkout Experience**:
   - Minimalist order breakdown showing verified line items and calculated tax/shipping.
   - One-click simulated checkout with atomic database transaction protection.
7. **Customer Dashboard & Order History**:
   - Tabular and timeline view of verified historical orders, purchase dates, status pills, item breakdowns, and order total summaries.

#### B. Admin Cockpit (Distinct Identity)
- **Deep Slate Visual Theme**: Custom dark-tone sidebar (`#121B16`) clearly differentiating the administrative operations from the retail storefront.
- **Real-Time Key Metrics**:
  - Total Active Inventory
  - Low Stock Warning Tracker
  - Lifetime Customer Orders
  - Gross Revenue Summary
- **Inventory Management Matrix**:
  - Live data table with sorting, stock badge indicators, and instant Add/Edit/Deactivate modal triggers.
  - Form validation with clear feedback and error handling.

---

### 5. Micro-Interactions & Responsiveness
- **Hover Micro-Lifts**: Cards elevate by `-4px` with softened multi-layered shadows on hover.
- **Button Feedback**: Active buttons produce an elastic `-1px` depression feedback.
- **Stock Alert States**: Dynamically switches badges between Emerald (`In Stock`), Warm Amber (`Low Stock`), and Terracotta (`Sold Out`).
- **Responsive Layout**:
  - Desktop: 12-column dynamic CSS grid with fluid gutters.
  - Tablet: 2-to-3 column reflowing product card layout.
  - Mobile: Single-column streamlined layout with fixed bottom accessibility bar.
