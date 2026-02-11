import tailwindcssAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      /* North Design System Extensions */
      fontFamily: {
        ui: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        accent: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      fontSize: {
        'page-title': ['22px', { lineHeight: '1.2', letterSpacing: '-0.3px', fontWeight: '600' }],
        'section-header': ['16px', { lineHeight: '1.3', fontWeight: '600' }],
        'issue-title': ['16px', { lineHeight: '1.3', fontWeight: '500' }],
        body: ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        metadata: ['13px', { lineHeight: '1.5', fontWeight: '500' }],
      },
      spacing: {
        /* North spacing scale based on 4px grid */
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
      },
      borderRadius: {
        sm: '6px' /* Small radius */,
        md: '10px' /* Medium radius */,
        lg: '20px' /* Drawer top radius */,
        DEFAULT: '10px',
      },
      boxShadow: {
        'level-1': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'level-2': '0 6px 24px rgba(0, 0, 0, 0.08)',
      },
      transitionDuration: {
        drawer: '250ms' /* Drawer open animation */,
      },
      transitionTimingFunction: {
        drawer: 'cubic-bezier(0.4, 0, 0.2, 1)' /* Ease-out curve */,
      },
      colors: {
        /* Core variables mapped to semantic names */
        border: 'hsl(var(--border))',
        'border-divider': 'hsl(var(--border-divider))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        surface: 'hsl(var(--surface))',
        'surface-subtle': 'hsl(var(--surface-subtle))',
        foreground: 'hsl(var(--foreground))',
        'foreground-secondary': 'hsl(var(--foreground-secondary))',
        'foreground-muted': 'hsl(var(--foreground-muted))',
        'foreground-disabled': 'hsl(var(--foreground-disabled))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          tint: 'hsl(var(--primary-tint))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* North status colors */
        status: {
          todo: 'hsl(var(--status-todo))',
          doing: 'hsl(var(--status-doing))',
          'in-review': 'hsl(var(--status-in-review))',
          done: 'hsl(var(--status-done))',
          blocked: 'hsl(var(--status-blocked))',
          canceled: 'hsl(var(--status-canceled))',
        },
        /* Semantic background tints */
        bg: {
          done: 'hsl(var(--bg-done))',
          blocked: 'hsl(var(--bg-blocked))',
          review: 'hsl(var(--bg-review))',
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
