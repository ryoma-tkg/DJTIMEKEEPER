# DJ Timekeeper Pro - Tactile Design System Specification

**Version:** 2.2.0 (Tactile Hierarchy Added)
**Last Updated:** 2025-11-21
**Concept:** "The Digital Instrument" - Precise, Weighted, Responsive.

---

## 1. Core Philosophy: The Physics of UI

This system simulates a physical interface. Elements are not just pixels; they have **mass, resistance, and elevation**.

### 1.1. The Lighting Model
* **Light Source:** Top-center (90°), slightly diffuse.
* **Shadows (Reflective):** Standard elements cast black/gray shadows downwards.
* **Glow (Emissive):** Only "Active/Emissive" elements cast colored light. They cast a "Glow", not a shadow.

### 1.2. Materiality
* **Glass:** Used for overlays and floating headers (`backdrop-blur-sm` or `md`).
* **Plastic/Metal:** Used for cards and buttons. Opaque, smooth, low friction.
* **Rubber:** Used for inputs and touch targets. High friction, matte finish.

### 1.3. Tactile Hierarchy (Logic Update)
To preserve the current aesthetics while reducing visual noise:
* **Emissive (光る):** Reserved for the **Primary Action** (1 per view) or Active States (ON AIR).
* **Physical (光らない):** Used for **Secondary Actions** (Cancel, Settings, Edit). They have depth but no glow.
* **Flat:** Used for tertiary actions.

---

## 2. Foundation: Design Tokens

### 2.1. Color System (Semantic)

Colors are defined as **RGB Triplets** in CSS variables to allow alpha transparency modifiers.

| Token Name                   | Value (Light) | Value (Dark)  | Usage                                     |
| :--------------------------- | :------------ | :------------ | :---------------------------------------- |
| `--color-brand-primary`      | `0 123 255`   | `0 145 255`   | Main actions, active states, focus rings. |
| `--color-surface-background` | `240 242 244` | `24 24 27`    | The "Table" surface.                      |
| `--color-surface-container`  | `255 255 255` | `39 39 42`    | Cards, Modals, floating elements.         |
| `--color-on-surface`         | `15 23 42`    | `244 244 245` | Primary text (Headings).                  |
| `--color-on-surface-variant` | `100 116 139` | `161 161 170` | Secondary text, icons, borders.           |
| `--color-destructive`        | `239 68 68`   | `239 68 68`   | Irreversible actions (Delete).            |

### 2.2. Elevation & Shadows (The "Lift")

We use a **Double-Layer Shadow System** to distinguish between "Physical Object" and "Light Source".

* **Level 0 (Flat):** `shadow-none`. Inputs, inactive list items.
* **Level 1 (Resting - Physical):** `shadow-sm`. Buttons, Cards.
    * *CSS:* `0 1px 2px 0 rgb(0 0 0 / 0.05)`
* **Level 2 (Hover/Lift):** `shadow-lg` + **Colored Glow (if Emissive)**.
    * *Concept:* The object lifts closer to the light source.
    * *CSS:* `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(var(--color-brand-primary) / 0.1)`
* **Level 3 (Floating/Modal):** `shadow-2xl`.
    * *CSS:* `0 25px 50px -12px rgb(0 0 0 / 0.25)`
* **Level 4 (Dragging):** `shadow-[0_20px_30px_-5px_rgba(0,0,0,0.3)]`.
    * *Scale:* Object scales up to `1.05` to simulate being picked up.

### 2.3. Typography & Rhythm

* **Base Size:** 16px (`text-base`).
* **Scale:** `text-xs` (12px), `text-sm` (14px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px).
* **Font Stacks:**
    * **UI/Labels:** `Montserrat` (Geometric, clean).
    * **Data/Time:** `Orbitron` (Futuristic, monospace-like) or `Montserrat` with `tabular-nums`.
    * **Body/JP:** `IBM Plex Sans JP`.
* **Letter Spacing:**
    * Headings/Buttons: `tracking-wide` (0.025em) or `tracking-wider` (0.05em) for readability.

### 2.4. Radius (Corner Rounding)
* **Cards / Modals / Containers:** `rounded-2xl` (1rem).
* **Buttons / Inputs:** `rounded-xl` (0.75rem).
* **Tags:** `rounded-lg` (0.5rem).

### 2.5. Borders & Strokes (The "Edge")

Borders define the physical edges of elements and indicate active states with thickness changes.

* **Standard (Resting):** `1px` solid.
    * *Color:* `border-on-surface/10` (Light) / `border-white/5` (Dark).
    * *Usage:* Defining the shape of cards against the background.
* **Active (ON AIR / Selected):** `2px` solid.
    * *Color:* Theme color or Item color (e.g., `border-brand-primary`).
    * *Usage:* Indicating the currently active element. The increased thickness simulates internal illumination or physical prominence.
* **Focus:** Handled via `ring`, not border, to avoid layout shifts.

---

## 3. Motion Physics (Animation)

Transitions must follow a specific physics curve to feel "Tactile." Linear animations are strictly forbidden for interactions.

### 3.1. The "Snap" Curve
* **Bezier:** `cubic-bezier(0.16, 1, 0.3, 1)`
* **Feeling:** High initial velocity, distinct overshoot (bounce), smooth settling.
* **Usage:** Modal opening, Hover in/out, Layout changes, Drag release.

### 3.2. Duration Constants
* **Instant (Feedback):** `duration-75` or `duration-100` (Button press down).
* **Fast (Recovery):** `duration-200` (Button release, Hover out).
* **Normal (Transition):** `duration-300` (Modal open, Page fade).
* **Slow (Ambient):** `duration-1000` (Background gradient shift).

---

## 4. Component Blueprints

### 4.1. Buttons (`<Button />`)

Buttons are physical keys. They must depress when pushed.

* **Shape:** `rounded-xl` (12px radius).
* **Padding:** `py-2 px-4` (min-height 44px).
* **Interaction States:**
    * **Rest:** `scale-100`, `shadow-md`.
    * **Hover:** `scale-102` or `-translate-y-0.5`, `shadow-lg` (colored if primary), `brightness-105`.
    * **Active (Press):** `scale-95`, `shadow-inner` or `shadow-none`, `translate-y-0`. **CRITICAL:** This provides the "click" feeling.
    * **Disabled:** `opacity-50`, `cursor-not-allowed`, `scale-100` (no interaction).

#### Variant Definitions (Hierarchy Update)

* **Primary (Emissive):**
    * **Usage:** Main action (Save, Create, Start). **Max 1-2 per screen.**
    * **Style:** `bg-brand-primary` text-white.
    * **Shadow:** `shadow-lg shadow-brand-primary/30` (Blue Glow enabled).

* **Secondary (Physical):**
    * **Usage:** Auxiliary actions (Cancel, Settings, Edit).
    * **Style:** `bg-surface-background` hover:`bg-on-surface/5`.
    * **Shadow:** `shadow-sm` (Standard Black Shadow). **No Blue Glow.**

* **Ghost / Icon:**
    * **Usage:** Navigation, weak actions.
    * **Style:** Transparent background.

* **Danger:**
    * **Usage:** Destructive actions.
    * **Style:** `bg-red-500/10 text-red-500`.

### 4.2. Inputs (`<Input />`)

Inputs are recessed areas on the surface.

* **Shape:** `rounded-xl`.
* **Background:** `bg-surface-background`.
* **Border:** `border border-transparent` (Rest) -> `border-brand-primary/20` (Focus).
* **Focus:**
    * **Ring:** `ring-2 ring-brand-primary`.
    * **Transition:** `transition-all duration-200`.
* **Icon:** Left-aligned, color `text-on-surface-variant`.

### 4.3. Time Input (`<CustomTimeInput />`)

A specialized control that feels like a mechanical counter.

* **Layout:** Horizontal strip. `[ -15 ] [ -5 ] [ 12:00 ] [ +5 ] [ +15 ]`.
* **Wrapper:** Flat layout (No background container).
* **Input Field:** Centered, `font-mono`, `text-lg`, `tracking-widest`. Bordered with `border-on-surface/5`.
* **Stepper Buttons:**
    * `flex-1`, `py-3`.
    * **Interaction:** `active:scale-95`, `active:bg-brand-primary/10`.

### 4.4. Modals (`<BaseModal />`)

Modals are sheets of glass/material sliding in from the bottom-center.

* **Backdrop:** `bg-black/70` + `backdrop-blur-sm`.
* **Panel:** `bg-surface-container`, `rounded-2xl`, `shadow-2xl`.
* **Entrance Animation:**
    * **Start:** `opacity: 0`, `transform: scale(0.95) translateY(10px)`.
    * **End:** `opacity: 1`, `transform: scale(1) translateY(0)`.
    * **Timing:** `duration-300`, `ease-out` (Snap curve).
* **Close Button:** Top-right, circular hover effect (`hover:bg-surface-background`).

### 4.5. Sortable List Cards (`<SortableListCard />`)

* **Base Style:**
    * `bg-surface-container`, `rounded-2xl`, `p-4`.
    * **Border:** `border border-on-surface/10` (Default).
* **State: Active (ON AIR):**
    * **Border:** `border-2` + Color (e.g., `border-blue-500`).
    * **Shadow:** "Glow" effect using double-layer colored shadow.
    * **Transform:** `translateY(0)` (Grounded).
* **State: Dragging:**
    * **Trigger:** `pointerdown`.
    * **State Change:** `z-index: 50`, `scale: 1.05`, `shadow-xl`.
* **Grip Handle:** Left side, `cursor-grab`, `text-on-surface-variant`.

### 4.6. Performance Monitor
* **Style:** "Cyber-Tactile".
* **Background:** `bg-gray-900/95` (Always dark).
* **Border:** `border-gray-700`.
* **Typography:** `font-mono`, `text-xs`.
* **Graphs:** Bar charts using CSS width transition (`transition-all duration-500`).

---

## 5. Implementation Rules (Code of Conduct)

1.  **No Raw HTML:** Do not use `<button>` or `<input>` directly. ALWAYS use `<Button>` and `<Input>` from `/ui`.
2.  **Consistent Spacing:** Use Tailwind's spacing scale (`gap-2`, `gap-4`, `p-4`, `p-6`). Avoid arbitrary pixel values (e.g., `margin: 13px`).
3.  **Touch First:** All interactive areas must have a minimum dimension of 44px.
4.  **Feedback Loop:** Every user action must result in a visual state change within 100ms.

## 6. Tailwind Config Extension (Reference)

To achieve this system, the `tailwind.config.js` MUST include:

```javascript
theme: {
  extend: {
    fontFamily: {
      sans: ['Montserrat', '"IBM Plex Sans JP"', 'sans-serif'],
      mono: ['Orbitron', 'Montserrat', 'sans-serif'],
    },
    colors: {
      // Define brand colors with CSS variable references for RGB
      'brand-primary': 'rgb(var(--color-brand-primary) / <alpha-value>)',
      'surface-background': 'rgb(var(--color-surface-background) / <alpha-value>)',
      'surface-container': 'rgb(var(--color-surface-container) / <alpha-value>)',
      // ... other colors
    },
    animation: {
      'modal-in': 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
    },
    keyframes: {
      modalIn: {
        '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
        '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
      },
      // ... other keyframes
    }
  }
}

## 7. Responsive Strategy (New)

We adopt a **Mobile-First** approach with specific tuning for small devices.

| Breakpoint  | Width    | Usage                                           |
| :---------- | :------- | :---------------------------------------------- |
| **Default** | `0px` ~  | Mobile layout (Stack, 1 column).                |
| **sp**      | `390px`  | Modern Smartphones (Adjust font sizes/padding). |
| **sm**      | `640px`  | Tablets / Large Phones.                         |
| **md**      | `768px`  | Dashboard Sidebar appears, Grid becomes 2 cols. |
| **lg**      | `1024px` | Desktop layout, Grid 3 cols.                    |