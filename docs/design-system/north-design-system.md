# North Design System

**Version:** 1.0
**Philosophy:** Calm structure. Intentional progress. Human tone.

## Overview

North is the design system for the Personal Issue Tracker application. It emphasizes clarity, minimal visual noise, and thoughtful interaction design. The system is built to support focused work without distractions.

## Brand Foundation

### Brand Positioning

**This is:**
- A personal clarity tool
- A thinking workspace
- A structured way to move forward

**This is not:**
- A team management suite
- A productivity gamification app
- A "hustle" tool

### Brand Personality

- Calm
- Focused
- Thoughtful
- Minimal
- Slightly warm
- Serious but not corporate

### Brand Voice

**Tone:** Direct, minimal, slightly reflective, no hype language

**Examples:**

| Instead of | Say |
|------------|-----|
| "Crush your goals!" | "What's next?" |
| "You're blocked!" | "Blocked by 2 issues." |
| Empty state | "Nothing ready.<br>Either everything is blocked — or you're done." |

---

## Color System

### Core Neutrals

#### Background
- **Base:** `#FAF9F6` - `hsl(42 17% 98%)` - `--background`
- **Surface:** `#FFFFFF` - `hsl(0 0% 100%)` - `--surface`
- **Subtle tint:** `#F3F1EC` - `hsl(40 18% 95%)` - `--surface-subtle`

#### Borders
- **Light border:** `#E7E2DA` - `hsl(35 17% 88%)` - `--border`
- **Divider:** `#EAE6DF` - `hsl(38 16% 91%)` - `--border-divider`

#### Text
- **Primary:** `#1F2937` - `hsl(217 19% 15%)` - `--foreground` (deep navy)
- **Secondary:** `#6B7280` - `hsl(215 14% 48%)` - `--foreground-secondary`
- **Muted:** `#9CA3AF` - `hsl(214 11% 64%)` - `--foreground-muted`
- **Disabled:** `#D1D5DB` - `hsl(214 14% 82%)` - `--foreground-disabled`

### Primary Accent (Brand Accent)

**Warm Burnt Orange**
- **Default:** `#C2410C` - `hsl(17 91% 40%)` - `--primary`
- **Hover:** `#9A3412` - `hsl(17 89% 33%)` - `--primary-hover`
- **Tint:** `#FDE8DD` - `hsl(17 97% 93%)` - `--primary-tint`

**Used for:**
- Active tab indicator
- Primary action button
- Selected state
- Focus rings (subtle)

### Secondary Accent (Cool Anchor)

**Deep Indigo**
- **Color:** `#4F46E5` - `hsl(239 68% 60%)` - `--accent`

**Used sparingly for:**
- Focus indicators
- Links
- Optional highlights

### Status Colors

Muted, not loud.

| Status | Color | Hex | HSL | Variable |
|--------|-------|-----|-----|----------|
| **Todo** | Neutral gray | `#D1D5DB` | `214 14% 82%` | `--status-todo` |
| **Doing** | Blue | `#2563EB` | `221 83% 53%` | `--status-doing` |
| **In Review** | Muted violet | `#7C3AED` | `258 70% 57%` | `--status-in-review` |
| **Done** | Forest green | `#166534` | `150 78% 29%` | `--status-done` |
| **Blocked** | Amber | `#D97706` | `36 87% 45%` | `--status-blocked` |
| **Canceled** | Gray | `#9CA3AF` | `214 11% 64%` | `--status-canceled` |

### Semantic Background Tints

Very subtle — never loud.

- **Done background:** `#F0FDF4` - `hsl(138 76% 97%)` - `--bg-done`
- **Blocked background:** `#FFFBEB` - `hsl(48 100% 97%)` - `--bg-blocked`
- **Review background:** `#F5F3FF` - `hsl(252 100% 98%)` - `--bg-review`

---

## Typography System

### Font Pairing

**Primary UI Font:** Inter
- Used for: Body, labels, buttons, metadata
- Weights: 400 (regular), 500 (medium), 600 (semibold)

**Accent Serif:** Fraunces
- Used for: Page titles, brand wordmark, empty states
- Weight: 600 (semibold)

### Type Scale

| Use Case | Size | Weight | Line Height | Letter Spacing | Class |
|----------|------|--------|-------------|----------------|-------|
| **Page Title** | 22px | 600 | 1.2 | -0.3px | `.text-page-title` |
| **Section Header** | 16px | 600 | 1.3 | — | `.text-section-header` |
| **Issue Title** | 16px | 500 | 1.3 | — | `.text-issue-title` |
| **Body Text** | 15px | 400 | 1.5 | — | `.text-body` |
| **Metadata** | 13px | 500 | 1.5 | — | `.text-metadata` |

### Usage

```svelte
<!-- Page title with serif font -->
<h1 class="font-accent text-page-title">Projects</h1>

<!-- Section header -->
<h2 class="text-section-header">Ready Issues</h2>

<!-- Issue title -->
<h3 class="text-issue-title">Fix authentication bug</h3>

<!-- Body text -->
<p class="text-body">Description goes here...</p>

<!-- Metadata -->
<span class="text-metadata">Project / Epic</span>
```

---

## Spacing System

**Base grid:** 4px

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps, icon spacing |
| `sm` | 8px | Label-to-control spacing |
| `md` | 12px | Compact sections |
| `base` | 16px | Issue row vertical padding |
| `lg` | 24px | Drawer section spacing |
| `xl` | 32px | Large gaps |
| `2xl` | 48px | Major section breaks |

### Rules

- **Issue rows:** 16px vertical padding
- **Drawer sections:** 24px spacing between groups
- **Label + control:** 8px spacing

---

## Layout Principles

### Cards vs Lists

**Default: List-first**

**Issue rows:**
- No heavy cards
- Light divider lines
- Slight hover/active tint only

**Cards only used for:**
- Drawer (bottom sheet)
- Project blocks (optional)

### Border Radius

| Size | Value | Usage |
|------|-------|-------|
| **Small** | 6px | Badges, small elements |
| **Medium** | 10px | Cards, buttons |
| **Large** | 20px | Drawer top corners |

**Never over-round.**

### Elevation

Two shadow levels only:

- **Level 1:** `0 1px 2px rgba(0,0,0,0.05)` - `.shadow-level-1`
- **Level 2:** `0 6px 24px rgba(0,0,0,0.08)` - `.shadow-level-2`

No more.

---

## Component Design Rules

### Issue Row

**Structure:**
- 16px vertical padding
- Title: bold-ish (16px, weight 500)
- Metadata below (13px, secondary color)
- Priority as subtle pill (light burnt orange tint background)
- Status indicator: small colored dot (4-6px)

**Implementation:**
```svelte
<button class="w-full px-4 py-4 border-b border-border-divider hover:bg-surface-subtle">
  <!-- Status dot -->
  <div class="w-1.5 h-1.5 rounded-full bg-status-doing" />

  <!-- Title -->
  <h3 class="text-issue-title">Issue title</h3>

  <!-- Metadata -->
  <p class="text-metadata">Project / Epic</p>

  <!-- Priority badge -->
  <Badge variant="default">P0</Badge>
</button>
```

### Status Indicator

Never full-width color bars.

**Use:**
- Small left border accent (2-3px), OR
- Subtle colored dot (4-6px diameter)

**Examples:**
- Doing → blue dot
- Blocked → amber dot

### Buttons

**Primary:**
- Background: burnt orange (`--primary`)
- Text: white
- Radius: 8px
- Padding: 12px horizontal, maintain vertical for touch

**Secondary:**
- Transparent background
- Border: subtle neutral
- Text: primary foreground

**Destructive:**
- Red text only (no filled red buttons in MVP)

```svelte
<!-- Primary -->
<Button variant="default">Save</Button>

<!-- Secondary -->
<Button variant="secondary">Cancel</Button>

<!-- Destructive -->
<Button variant="destructive">Delete</Button>
```

### Segmented Control (Home View)

**Design:**
- Underline indicator in burnt orange
- Text: muted by default, primary when active
- No background fills

**Implementation:**
```svelte
<Tabs>
  <TabsList>
    <TabsTrigger value="ready">Ready</TabsTrigger>
    <TabsTrigger value="doing">Doing</TabsTrigger>
    <TabsTrigger value="blocked">Blocked</TabsTrigger>
  </TabsList>
</Tabs>
```

### Issue Drawer (Sheet)

**Design:**
- White surface with level 2 shadow
- Rounded top corners (20px)
- Sections separated by 24px spacing (not heavy borders)
- Labels: 12px uppercase, muted color

**Section structure:**
```svelte
<section>
  <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
    Section Title
  </h3>
  <div class="space-y-4">
    <!-- Section content -->
  </div>
</section>
```

---

## Interaction & Motion

### Motion Principles

Motion should feel:
- **Quick** - No waiting
- **Quiet** - No bouncy animations
- **Predictable** - Expected behavior

### Animation Durations

| Action | Duration | Easing |
|--------|----------|--------|
| **Drawer open** | 200-250ms | Ease-out |
| **Status change** | 150ms | Linear |
| **Hover states** | 150ms | Linear |

### Specific Behaviors

**Drawer open:**
- Slide up 200-250ms
- Ease-out curve
- No overshoot

**Status change:**
- Small fade + reorder animation
- No celebration

**Add dependency:**
- Instant — no celebratory animation

**No bouncy animations.**

---

## Microcopy System

Short. Clear. No fluff.

### Buttons
- "Add issue"
- "Move"
- "Mark done"

### Errors
- "That creates a cycle."
- "Story points must be 1–21."

### Empty States
- "No issues yet."
- "Nothing ready."
- "Either everything is blocked — or you're done."

---

## Design Principles (Guardrails)

1. **Remove visual noise.**
   - Don't introduce color unless it communicates state.

2. **Lists should breathe.**
   - Use space instead of borders.

3. **If unsure, make it quieter.**
   - Err on the side of subtlety.

4. **Typography hierarchy matters.**
   - Use the defined scale consistently.

5. **Status colors are muted.**
   - Never loud or garish.

6. **Two shadow levels only.**
   - More than that is noise.

7. **Motion is quick and quiet.**
   - No bouncy, celebratory animations.

---

## Implementation Notes

### CSS Custom Properties

All colors are defined as CSS custom properties in `src/app.css`:

```css
:root {
  --background: 42 17% 98%;
  --foreground: 217 19% 15%;
  --primary: 17 91% 40%;
  /* ... etc */
}
```

### Tailwind Configuration

Extended in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    fontFamily: {
      ui: ['Inter', 'sans-serif'],
      accent: ['Fraunces', 'serif']
    },
    colors: {
      primary: 'hsl(var(--primary))',
      // ... etc
    }
  }
}
```

### Design Tokens Utility

Reusable helpers in `src/lib/utils/design-tokens.ts`:

```typescript
import { getStatusColor, getPriorityLabel, typography } from '$lib/utils/design-tokens';

// Get status color class
const color = getStatusColor('doing'); // 'status-doing'

// Get priority label
const label = getPriorityLabel(0); // 'P0'

// Typography classes
<h1 class={typography.pageTitle}>Title</h1>
```

---

## Resources

- **Fonts:** Installed via `@fontsource/inter` and `@fontsource/fraunces`
- **Component Library:** shadcn/svelte (customized)
- **Icons:** Lucide Svelte

---

## Changelog

### Version 1.0 (2026-02-11)
- Initial North design system implementation
- Complete color palette definition
- Typography system with Inter + Fraunces
- Component redesigns (Button, Badge, Tabs, Sheet, IssueRow, etc.)
- Design tokens utility file
- Full documentation
