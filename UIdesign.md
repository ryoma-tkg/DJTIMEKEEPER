# DJ Timekeeper Pro - Design System Specification

**Version:** 3.1.0 (Engineering Detail)
**Last Updated:** 2025-11-23
**Source of Truth:** `src/components/UITestPage.jsx` (v4.7.0)

---

## 1. Core Philosophy: The Tactile Instrument

This system mimics a physical instrument. Every interaction must feel weighted and responsive.

### 1.1. Interaction Physics
* **Click (Active):** Elements **MUST** shrink to `scale-95` (or `scale-[0.97]`) on active state to simulate physical depression.
* **Drag (Lift):** Draggable elements scale up to `1.05` and increase shadow depth, simulating being lifted off the surface.
* **Motion:** All transitions use `cubic-bezier(0.16, 1, 0.3, 1)` (The "Snap" curve) or `ease-out` for natural deceleration.

---

## 2. Responsive Layout Strategy

We use a **Mobile-First** approach. Default styles are for mobile (`0px`~), with overrides for larger screens.

### 2.1. Breakpoints
| Prefix    | Min-Width | Device Target                                                   |
| :-------- | :-------- | :-------------------------------------------------------------- |
| (default) | `0px`     | Standard Mobile (iPhone SE ~)                                   |
| `sp:`     | `390px`   | Modern Smartphones (iPhone 14 Pro ~) - *Custom Tailwind Config* |
| `sm:`     | `640px`   | Large Phones / Small Tablets                                    |
| `md:`     | `768px`   | Tablets (iPad) / Desktop Sidebar Appears                        |
| `lg:`     | `1024px`  | Desktop / Laptop                                                |
| `xl:`     | `1280px`  | Large Desktop                                                   |

### 2.2. Global Layout Container
* **Wrapper:** `max-w-7xl mx-auto` (Max width 1280px).
* **Page Padding (Gutters):**
    * Mobile (`< 768px`): `p-4` (16px)
    * Desktop (`>= 768px`): `p-8` (32px)
    * Bottom Padding: `pb-32` (128px) to account for floating action buttons.

---

## 3. Component Specifications

### 3.1. Colors (Tailwind Tokens)
Colors are defined as RGB variables for alpha transparency support.

| Token                | Value (Light) | Value (Dark)  | Purpose                                      |
| :------------------- | :------------ | :------------ | :------------------------------------------- |
| `brand-primary`      | `0 123 255`   | `0 145 255`   | Primary Actions, Focus Rings, Active States. |
| `surface-background` | `248 250 252` | `24 24 27`    | App Background (Base Layer).                 |
| `surface-container`  | `255 255 255` | `39 39 42`    | Cards, Modals, Lists (Elevated Layer).       |
| `on-surface`         | `15 23 42`    | `244 244 245` | Primary Text.                                |
| `on-surface-variant` | `100 116 139` | `161 161 170` | Secondary Text, Icons, Borders.              |

### 3.2. Shadows & Elevation (The "Z-Index" of Light)

Shadows define the hierarchy. We use specific shadows for specific states.

| State               | Class          | CSS Value                                                                                 | Usage                                         |
| :------------------ | :------------- | :---------------------------------------------------------------------------------------- | :-------------------------------------------- |
| **Recessed**        | `shadow-inner` | `inset 0 2px 4px 0 rgb(0 0 0 / 0.05)`                                                     | Inputs, Time Fields.                          |
| **Level 1 (Rest)**  | `shadow-sm`    | `0 1px 2px 0 rgb(0 0 0 / 0.05)`                                                           | Buttons (Secondary), Cards (Rest).            |
| **Level 2 (Hover)** | `shadow-md`    | `0 4px 6px -1px rgb(0 0 0 / 0.1)`                                                         | Buttons (Hover), Dropdowns.                   |
| **Level 3 (Lift)**  | `shadow-xl`    | `0 20px 25px -5px rgb(0 0 0 / 0.1)`                                                       | Draggable Items, Active Modals.               |
| **Emissive**        | Custom         | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(var(--color-brand-primary) / 0.1)` | **Primary Button Only**. Adds a colored glow. |

### 3.3. Radius (Corner Rounding)
* **Standard:** `rounded-xl` (12px) -> Buttons, Inputs, List Items.
* **Large:** `rounded-2xl` (16px) -> Modals, Cards (Sortable).
* **Extra Large:** `rounded-3xl` (24px) -> Dashboard Cards, Section Containers.

---

## 4. Detailed Component Blueprints

### 4.1. Buttons (`<NewButton />`)
* **Height:**
    * `sm`: `min-h-[36px]`
    * `md`: `min-h-[48px]` (Standard Touch Target)
    * `lg`: `min-h-[64px]`
* **Padding:** `py-3 px-6` (size: md).
* **Transition:** `transition-all duration-200 ease-out`.
* **Active State:** `active:scale-[0.97]`.
* **Primary Variant:** `bg-brand-primary text-white shadow-lg shadow-brand-primary/40 hover:shadow-xl hover:shadow-brand-primary/50 hover:-translate-y-0.5`.

### 4.2. Inputs (`<NewInput />`)
* **Background:** `bg-surface-background` (Recessed).
* **Border:** `border border-on-surface/5 dark:border-white/10`.
* **Shadow:** `shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.02)]`.
* **Text:** `font-medium text-base`.
* **Focus:** `focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary`.

### 4.3. Sortable List Card (`<NewSortableCard />`)
This component has a **Strict Responsive Layout**.

#### Mobile Layout (`< 768px`)
* **Structure:** Flex Column (`flex-col`).
* **Row 1 (Header):** Flex Row (`justify-between`). Contains Grip, Icon, and Action Buttons.
    * **Action Buttons:** Visible on the top-right. `flex-row`, `gap-4`.
* **Row 2 (Body):** Name Input.
    * **Width:** Full Width (`w-full`).
* **Row 3 (Footer):** Time Controls.
    * **Container:** `bg-surface-background/30 rounded-lg p-2`.

#### Desktop Layout (`>= 768px`)
* **Structure:** Flex Row (`items-center`).
* **Section 1 (Left):** Grip + Icon.
* **Section 2 (Center - Flexible):** Name Input.
    * **Flex:** `flex-grow-[2]`. Takes up 2x space relative to others.
* **Section 3 (Right):** Time Controls + Actions.
    * **Actions:** Vertical Layout (`flex-col`), `border-l` separator.

#### Dragging State (`isDragging`)
* **Transform:** `scale-105`.
* **Z-Index:** `z-50`.
* **Shadow:** `shadow-2xl`.
* **Ring:** `ring-2 ring-brand-primary`.

### 4.4. Dashboard Event Card (`<NewEventCard />`)
* **Container:** `relative bg-surface-container rounded-3xl p-6 border border-on-surface/10`.
* **Interaction:** `hover:-translate-y-1` `hover:shadow-xl`.
* **Gradients:**
    * **Normal:** `from-brand-primary/5` (Blue tint).
    * **Active (ON AIR):** `from-red-500/5` (Red tint) + `border-red-500/40`.
* **Status Badge:**
    * **ON AIR:** Emissive Red. `bg-surface-container text-red-500 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]`.

---

## 5. Typography System

* **Font Family:**
    * UI / Headings: `Montserrat` (Geometric).
    * Body / JP: `IBM Plex Sans JP`.
    * Numbers / Time: `Orbitron` or `Montserrat` (Tabular).
* **Weights:**
    * **Bold (700):** Buttons, Headings, Labels.
    * **Medium (500):** Input Text, Body.
* **Tracking:**
    * Headings: `tracking-wide` (0.025em).
    * Captions: `tracking-wider` (0.05em).

---

## 6. Animation Constants

| Name               | Class                | Definition                                                                                                               |
| :----------------- | :------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| **Fade In Up**     | `animate-fade-in-up` | `0% { opacity: 0; transform: translateY(20px) }` -> `100% { opacity: 1; transform: translateY(0) }`                      |
| **Modal In**       | `animate-modal-in`   | `0% { opacity: 0; transform: scale(0.95) translateY(10px) }` -> `100% { opacity: 1; transform: scale(1) translateY(0) }` |
| **Pulse (Custom)** | `animate-pulse`      | Standard Tailwind pulse for "ON AIR" indicators.                                                                         |
| **Spin (Glow)**    | (Custom CSS)         | `box-shadow` rotation for the Tactile Spinner.                                                                           |

---

## 7. Iconography Rules
* **Stroke Width:** `2` (Standard).
* **Size:**
    * Small: `w-4 h-4` (16px) - Labels, Metadata.
    * Medium: `w-5 h-5` (20px) - Buttons, Nav.
    * Large: `w-6 h-6` (24px) - Primary Actions, Modal Close.
* **Color:**
    * Inactive: `text-on-surface-variant`.
    * Active/Hover: `text-brand-primary` or `text-on-surface`.