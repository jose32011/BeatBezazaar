# Design Guidelines: Instrumental Beats Marketplace

## Design Approach
**Reference-Based Approach** - Drawing inspiration from Spotify's dark music UI, Beatport's beat marketplace aesthetics, and Shopify's e-commerce patterns. This creates a premium, music-focused experience that balances artistic presentation with commercial functionality.

## Core Design Principles
- **Dark & Immersive**: Deep blues create focus on beat artwork and audio controls
- **Audio-First**: Prominent waveform visualizers and playback controls
- **Professional Commerce**: Clear pricing, licensing info, and seamless checkout flow

---

## Color Palette

### Dark Mode (Primary)
- **Background Primary**: 210 40% 8% (deep navy blue)
- **Background Secondary**: 215 35% 12% (elevated surfaces)
- **Background Tertiary**: 220 30% 16% (cards, modals)
- **Primary Brand**: 210 90% 55% (electric blue for CTAs)
- **Primary Hover**: 210 90% 65% (lighter blue)
- **Accent**: 280 65% 60% (purple for premium/featured beats)
- **Text Primary**: 210 15% 95% (near white)
- **Text Secondary**: 210 10% 70% (muted text)
- **Border**: 215 20% 25% (subtle dividers)
- **Success**: 145 65% 50% (purchase confirmations)

### Audio Player Specific
- **Waveform**: 210 70% 45% (muted blue waveform)
- **Waveform Progress**: 210 90% 55% (bright blue playback)
- **Player Background**: 215 40% 10% (darker player bar)

---

## Typography

**Font Families** (via Google Fonts):
- **Primary**: 'Inter' - Clean, modern sans-serif for UI and body text
- **Display**: 'Space Grotesk' - Bold, geometric for headings and beat titles

**Scale**:
- Hero Display: text-6xl font-bold (Space Grotesk)
- Section Headings: text-4xl font-bold (Space Grotesk)
- Beat Titles: text-xl font-semibold (Inter)
- Body Text: text-base (Inter)
- Metadata (BPM, Genre): text-sm font-medium (Inter)
- Pricing: text-2xl font-bold (Inter)

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16, 24 consistently
- Component padding: p-6
- Section spacing: py-16 md:py-24
- Card gaps: gap-6
- Container max-width: max-w-7xl

**Grid Structure**:
- Beat catalog: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Featured beats: grid-cols-1 lg:grid-cols-2
- Cart items: Single column stack

---

## Component Library

### Navigation
- Sticky header with blur backdrop (backdrop-blur-md bg-[210_40%_8%]/90)
- Logo + Browse/Genres/Upload/Cart icons
- Search bar with waveform icon
- Shopping cart badge with count

### Beat Cards
- Album artwork (square, rounded-lg)
- Hover state: scale-105 transition with play button overlay
- Beat title, producer name (text-sm text-secondary)
- BPM badge, genre tag (pill-shaped)
- Waveform visualization preview
- Price + Add to Cart button (ghost on image, solid on hover)
- Audio preview player (mini-bar at bottom of card)

### Audio Player Components
- Global persistent player bar (bottom of viewport)
- Play/pause, 30-second countdown timer, volume control
- Animated waveform with progress indicator
- "Watermark" text overlay on waveform
- Skip to next beat in queue

### Hero Section
- Full-width background with subtle gradient (top: navy, bottom: darker)
- Large heading: "Premium Instrumental Beats for Your Next Hit"
- Subheading about royalty-free licensing
- Dual CTAs: "Browse Beats" (primary) + "Upload Your Beats" (outline with blur)
- Floating beat cards preview (3-4 cards with subtle animation)
- **Hero Image**: Abstract audio waveform visualization or producer/studio aesthetic in background (use high-quality dark blue tinted imagery)

### Filter Sidebar
- Genre checkboxes (Hip-Hop, R&B, Pop, Trap, etc.)
- BPM range slider (60-200)
- Price range filter
- Sort dropdown (Popular, Newest, Price)
- Mood/vibe tags

### Shopping Cart
- Slide-out panel from right
- Beat thumbnail, title, price per item
- Remove button
- Subtotal + PayPal checkout button
- License type selector (Basic/Premium)

### PayPal Integration
- Prominent PayPal button (signature blue/gold)
- Secure badge icons
- "Pay with PayPal" copy

---

## Images
- **Hero Background**: Large atmospheric image of studio equipment, producer at work, or abstract audio waveform visualization - dark blue color graded, 1920x800px
- **Beat Artwork Placeholders**: Square album-style artwork (600x600px) showcasing beat mood/genre
- **Producer Avatars**: Circular, 48x48px next to beat titles
- **Trust Badges**: PayPal secure, SSL icons in footer

---

## Key Sections

1. **Hero**: Full-width with image background, centered CTA, floating beat cards
2. **Featured Beats**: 2-column grid of premium instrumentals
3. **Browse Catalog**: 4-column grid with filters, 16 beats visible
4. **Genre Categories**: Horizontal scroll cards for quick navigation
5. **How It Works**: 3-step process (Browse → Preview → Purchase) with icons
6. **Producer Spotlight**: Featured beat makers with their top tracks
7. **Testimonials**: Producer success stories, 2-column layout
8. **Footer**: Newsletter signup, social links, FAQs, licensing info

---

## Interactions

**Minimal Animations** (use sparingly):
- Beat card hover: subtle scale and shadow increase
- Waveform: animated playback progress only
- Add to cart: micro-bounce feedback
- Page transitions: subtle fade (200ms)

**No animations on**:
- Buttons (rely on color change)
- Text elements
- Filter interactions

---

## Accessibility
- All audio controls keyboard navigable
- ARIA labels on play buttons ("Play 30-second preview of [Beat Name]")
- Focus states with 2px blue outline
- Contrast ratio 4.5:1 minimum for text
- Form inputs maintain dark theme with light borders (1px 215 20% 35%)