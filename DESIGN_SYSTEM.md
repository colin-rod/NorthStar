# North Design System

This document defines the design system for NorthStar, ensuring consistent typography, spacing, colors, and component styling across the application.

## Typography

### Font Families

**Primary Font (UI/Body)**: Inter

- Usage: All body text, buttons, form inputs, navigation
- Class: `font-ui` or default (applied to body)
- Stack: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

**Accent Font (Headings)**: Fraunces

- Usage: All headings (h1-h6), page titles, wordmark
- Class: `font-accent`
- Stack: `'Fraunces', Georgia, serif`
- Note: Applied automatically to h1-h6 in `@layer base`

### Typography Scale

Use these utility classes instead of generic Tailwind typography classes:

| Class                 | Size | Weight | Letter Spacing | Line Height | Usage                            |
| --------------------- | ---- | ------ | -------------- | ----------- | -------------------------------- |
| `text-page-title`     | 22px | 600    | -0.3px         | 1.2         | Page titles (h1)                 |
| `text-section-header` | 16px | 600    | 0              | 1.3         | Section headers (h2, h3, h4)     |
| `text-issue-title`    | 16px | 500    | 0              | 1.3         | Issue titles in lists            |
| `text-metadata`       | 13px | 500    | 0              | 1.5         | Labels, metadata, secondary info |
| `text-body`           | 15px | 400    | 0              | 1.5         | Body text (default)              |

### Typography Rules

**✅ DO:**

- Use `font-accent text-page-title` for all page titles (h1)
- Use `text-section-header` for all section headers (h2, h3, h4)
- Use `text-issue-title` for clickable issue titles
- Use `text-metadata` for labels and secondary information
- Keep body text at default 15px (no class needed)

**❌ DON'T:**

- Use generic Tailwind classes (`text-xl`, `text-2xl`, `text-3xl`, `font-bold`)
- Mix serif and sans-serif arbitrarily
- Use custom font sizes outside the defined scale

### Examples

```svelte
<!-- Page Title -->
<h1 class="font-accent text-page-title">Projects</h1>

<!-- Section Header -->
<h2 class="text-section-header">Profile Settings</h2>

<!-- Issue Title -->
<span class="text-issue-title">Set up CI/CD pipeline</span>

<!-- Metadata/Label -->
<label class="text-metadata">Priority</label>

<!-- Body Text (default) -->
<p>This is body text at 15px.</p>
```

## Spacing

### Spacing Scale (4px Grid)

The North Design System uses a 4px-based spacing grid. All spacing should align to this grid.

| North Utility | Tailwind Equivalent | Pixels | Usage                         |
| ------------- | ------------------- | ------ | ----------------------------- |
| `north-xs`    | `1`                 | 4px    | Tight spacing, icon gaps      |
| `north-sm`    | `2`                 | 8px    | Small gaps, compact layouts   |
| `north-md`    | `3`                 | 12px   | Medium gaps                   |
| `north-base`  | `4`                 | 16px   | Base spacing unit             |
| `north-lg`    | `6`                 | 24px   | Section spacing, page gutters |
| `north-xl`    | `8`                 | 32px   | Large spacing, page sections  |
| `north-2xl`   | `12`                | 48px   | Extra large spacing           |

### Using North Spacing

The `spacing` extension in `tailwind.config.js` enables North utilities for:

- Padding: `p-north-lg`, `px-north-base`, `py-north-xl`
- Margin: `m-north-lg`, `mb-north-xl`, `mt-north-base`
- Gap: `gap-north-sm`, `gap-north-lg`
- Space: `space-y-north-lg`, `space-x-north-md`

### Spacing Rules

**✅ DO:**

- Use North spacing utilities for page layouts (`space-y-north-lg`)
- Use `p-north-lg` (24px) or `p-north-base` (16px) for card/sheet padding
- Align all spacing to the 4px grid
- Use `gap-2` (8px) for small component gaps (equivalent to `north-sm`)

**❌ DON'T:**

- Use fractional spacing values (gap-1.5, space-y-2.5) except where necessary
- Use spacing values outside the 4px grid without documentation
- Mix North utilities with arbitrary pixel values

### Acceptable Tailwind Equivalents

For backwards compatibility, these Tailwind classes are equivalent to North spacing:

- `gap-1` = `gap-north-xs` (4px)
- `gap-2` = `gap-north-sm` (8px)
- `gap-3` = `gap-north-md` (12px)
- `gap-4` = `gap-north-base` (16px)
- `gap-6` = `gap-north-lg` (24px)
- `gap-8` = `gap-north-xl` (32px)
- `gap-12` = `gap-north-2xl` (48px)

The same applies to padding (`p-*`), margin (`m-*`), and space (`space-*`).

### Examples

```svelte
<!-- Page Layout Spacing -->
<div class="space-y-north-lg">
  <!-- Sections are 24px apart -->
</div>

<!-- Card Padding -->
<div class="p-north-lg">
  <!-- 24px padding on all sides -->
</div>

<!-- Component Gap -->
<div class="flex gap-2">
  <!-- 8px gap (north-sm equivalent) -->
</div>

<!-- Section Margins -->
<section class="mb-north-xl">
  <!-- 32px bottom margin -->
</section>
```

## Colors

### Semantic Colors

North Design System uses semantic color naming based on intent:

**Backgrounds:**

- `bg-background` - Base page background (#FAF9F6)
- `bg-surface` - Card/sheet backgrounds (#FFFFFF)
- `bg-surface-subtle` - Subtle tinted backgrounds (#F3F1EC)

**Text:**

- `text-foreground` - Primary text (#1F2937)
- `text-foreground-secondary` - Secondary text (#6B7280)
- `text-foreground-muted` - Muted text (#9CA3AF)
- `text-foreground-disabled` - Disabled text (#D1D5DB)

**Borders:**

- `border-border` - Light border (#E7E2DA)
- `border-border-divider` - Divider lines (#EAE6DF)

**Primary (Burnt Orange):**

- `bg-primary` - Brand accent (#C2410C)
- `bg-primary-hover` - Hover state (#9A3412)
- `bg-primary-tint` - Soft background tint (#FDE8DD)
- `text-primary` - Primary text color
- `text-primary-foreground` - Text on primary background

**Status Colors:**

- `bg-status-todo` - Gray (#D1D5DB)
- `bg-status-doing` - Blue (#2563EB)
- `bg-status-in-review` - Violet (#7C3AED)
- `bg-status-done` - Forest green (#166534)
- `bg-status-blocked` - Amber (#D97706)
- `bg-status-canceled` - Gray (#9CA3AF)

### Color Usage Rules

**✅ DO:**

- Use semantic color names (`bg-primary`, `text-foreground-secondary`)
- Use status colors for badges and indicators
- Maintain sufficient contrast for accessibility

**❌ DON'T:**

- Use arbitrary color values (hex codes, rgb)
- Use generic color names without semantic meaning
- Override status colors

## Components

### shadcn/svelte Components

NorthStar uses shadcn/svelte components with North Design System customizations:

**Customized Components:**

- `Card`, `CardHeader`, `CardContent` - Use `p-north-lg` padding
- `Sheet`, `SheetHeader` - Use North spacing
- `Badge` - Custom status variants matching North colors

**Uncustomized Components:**

- `Button`, `Input`, `Select`, `Tabs` - Use shadcn defaults
- These maintain their own padding/spacing for UX consistency

### Component Guidelines

**✅ DO:**

- Use shadcn/svelte components as the base
- Apply North typography classes to headings and text
- Use North spacing for custom layouts

**❌ DON'T:**

- Override component internals unnecessarily
- Mix competing component libraries
- Create custom components when shadcn provides them

## Enforcement

### Code Review Checklist

- [ ] All page titles use `font-accent text-page-title`
- [ ] All section headers use `text-section-header`
- [ ] No generic Tailwind typography classes (`text-xl`, `font-bold`)
- [ ] Spacing aligns to 4px grid (use North utilities)
- [ ] Semantic color names used (no hex/rgb)
- [ ] shadcn/svelte components used where applicable

### Future Improvements

1. **ESLint Rules**: Add custom ESLint rules to catch non-North typography
2. **Pre-commit Hooks**: Validate spacing values before commit
3. **Storybook**: Create component library with North examples
4. **Design Tokens**: Export design tokens for design tools (Figma)

## Quick Reference

### Common Patterns

```svelte
<!-- Page Layout -->
<div class="space-y-north-lg">
  <h1 class="font-accent text-page-title">Page Title</h1>

  <section>
    <h2 class="text-section-header">Section Header</h2>
    <p>Body text at default 15px.</p>
  </section>
</div>

<!-- Card Component -->
<Card>
  <CardHeader>
    <h2 class="text-section-header">Card Title</h2>
  </CardHeader>
  <CardContent class="space-y-4">
    <p>Card content</p>
  </CardContent>
</Card>

<!-- Issue Row -->
<div class="flex items-center gap-3 p-north-base">
  <span class="text-issue-title">Issue title</span>
  <span class="text-metadata text-foreground-muted">Project / Epic</span>
  <Badge variant="status-doing">Doing</Badge>
</div>
```

## Resources

- **Tailwind Config**: `/tailwind.config.js` - Extended North utilities
- **Global CSS**: `/src/app.css` - Base styles and color definitions
- **Component Library**: `/src/lib/components/ui/` - shadcn/svelte components

---

Last updated: 2025-02-13
Maintained by: NorthStar Development Team
