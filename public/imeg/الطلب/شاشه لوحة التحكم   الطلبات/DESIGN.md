---
name: Emerald Admin
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#414944'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#717973'
  outline-variant: '#c0c9c2'
  surface-tint: '#396752'
  primary: '#002215'
  on-primary: '#ffffff'
  primary-container: '#043927'
  on-primary-container: '#73a48c'
  inverse-primary: '#a0d1b8'
  secondary: '#775a19'
  on-secondary: '#ffffff'
  secondary-container: '#fed488'
  on-secondary-container: '#785a1a'
  tertiary: '#002116'
  on-tertiary: '#ffffff'
  tertiary-container: '#003927'
  on-tertiary-container: '#62a689'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bbeed3'
  primary-fixed-dim: '#a0d1b8'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#204f3c'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#abf1d0'
  tertiary-fixed-dim: '#8fd5b5'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#00513a'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  status-success: '#107C10'
  status-warning: '#F5A623'
  status-danger: '#D83B01'
  status-info: '#0078D4'
  border-subtle: '#E2E8F0'
  surface-card: '#FFFFFF'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 52px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 280px
  container-padding: 32px
  grid-gutter: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The design system embodies a **Sophisticated Corporate** aesthetic tailored for high-end e-commerce administration. It balances the luxury heritage of the brand with the functional rigor required for a high-density data environment. 

The visual language is rooted in **Modern Professionalism**: it utilizes generous white space, crisp borders, and a refined color palette to reduce cognitive load for administrators. While the storefront may be immersive and atmospheric, the admin interface is a high-performance tool—prioritizing legibility, efficiency, and clear information hierarchy.

The style leverages **Minimalism** with subtle **Tonal Layering**. Key brand moments—like the sidebar and primary actions—use the signature Emerald and Gold to maintain brand continuity, while the data-heavy workspace remains neutral and high-contrast to ensure long-term usability without eye strain.

## Colors

The palette is anchored by **Emerald Green (#043927)**, used for structural navigation and primary brand identifiers. **Gold (#C5A059)** is employed as a sophisticated accent for interactive highlights and premium indicators, though it is used sparingly to maintain professional restraint.

For the administrative workspace, the system defaults to a **Light Mode** with a neutral background of `#F8F9FA`. Data tables and forms utilize pure white surfaces (`#FFFFFF`) with subtle slate-gray borders to create clear containment. 

Status colors (Success, Warning, Danger, Info) are calibrated for high legibility against light backgrounds, ensuring that operational alerts are immediately recognizable without clashing with the brand's primary emerald tones.

## Typography

This design system uses a **Full RTL (Right-to-Left)** typographic engine. **Playfair Display** is reserved for high-level page headers and dashboard metrics, lending a sense of luxury and authority to the data. 

For all functional UI elements—labels, inputs, and body text—**Hanken Grotesk** is used for its exceptional clarity and modern proportions. In data tables, a secondary monospace font (JetBrains Mono) is used for SKU numbers, price figures, and technical specs to ensure perfect vertical alignment and scannability.

When rendering Arabic script, font weights are adjusted to ensure the "thinner" appearance of certain Arabic typefaces remains legible; generally, use a step higher in weight (e.g., Medium instead of Regular) for body text in Arabic.

## Layout & Spacing

The layout is a **Fixed Sidebar + Fluid Content** model optimized for wide-screen desktop displays (1440px+). 

1. **Sidebar:** A persistent 280px sidebar on the right side (RTL) houses the primary navigation.
2. **Main Canvas:** A fluid area with a minimum 32px padding on all sides.
3. **Grid System:** Content is organized into a 12-column grid. Dashboard widgets typically span 3, 4, or 6 columns. Data tables always span the full 12 columns.
4. **RTL Logic:** All horizontal flows are mirrored. The sidebar sits on the right, chevron icons point left for "forward," and form labels are right-aligned above their inputs.

Spacing follows an 8px base unit, ensuring a rhythmic and predictable vertical stack across all forms and lists.

## Elevation & Depth

This design system avoids heavy shadows in favor of **Tonal Layering** and **Low-Contrast Outlines**.

- **Level 0 (Background):** `#F8F9FA` - The base canvas.
- **Level 1 (Cards/Surface):** White background with a 1px solid border (`#E2E8F0`). No shadow. Used for data tables and standard content blocks.
- **Level 2 (Interactive/Floating):** White background with a very soft, diffused shadow (Offset: 0, 4px; Blur: 12px; Color: `rgba(4, 57, 39, 0.08)`). Used for dropdown menus, date pickers, and modals.
- **Active State:** A subtle Emerald-tinted inner glow or 2px border highlight is used to indicate focus on inputs or active sidebar items.

## Shapes

The shape language is **Soft and Professional**. A standard radius of 4px (`rounded-sm`) is applied to buttons, input fields, and small UI components. Larger containers like dashboard cards and modals use an 8px radius (`rounded-lg`). 

This conservative use of rounding maintains the "Admin" feel—efficient and structured—without feeling clinical or sharp. Status badges and tags utilize a full pill-shape (999px) to distinguish them from interactive buttons.

## Components

### Navigation Sidebar
- **Inactive:** Transparent background, Slate text, right-aligned icons.
- **Active:** Emerald Green (#043927) background with White text. A Gold (#C5A059) vertical bar (4px) on the far right edge.
- **Hover:** Light tint of Emerald (`rgba(4, 57, 39, 0.05)`).

### Action Buttons
- **Primary:** Emerald Green background, White text.
- **Secondary:** White background, 1px Gold border, Gold text.
- **Danger:** White background, 1px Red border, Red text.
- **Loading:** Button text fades to 50% opacity with a centering spinner in the button's accent color.

### Data Tables
- **Header:** Light gray background (`#F1F5F9`), bold right-aligned labels.
- **Rows:** Alternating zebra stripes are not used; instead, use a 1px bottom border. Hover state highlights the entire row in a very pale Gold (`#FCF9F2`).
- **Cells:** Vertical padding of 16px to ensure touch/click targets are generous.

### Form Inputs
- **Text/Number:** 1px border (`#E2E8F0`). On focus: 1px Emerald border with a soft Emerald glow. Labels are positioned directly above the input, right-aligned.
- **Image Upload Zone:** Dashed border in Gold. Background is a pale tint of the accent color. Large centered icon with "Drag and Drop" instructions in Arabic.

### Status Badges
- Small, uppercase, bold font.
- **Active/Verified:** Green text on pale green background.
- **Pending/New:** Amber text on pale amber background.
- **Out of Stock/Cancelled:** Red text on pale red background.

### Dashboard Cards
- Large Playfair Display numbers for metrics.
- Small sparkline charts in Emerald for "growth" or Red for "decline" positioned in the bottom-left corner of the card.