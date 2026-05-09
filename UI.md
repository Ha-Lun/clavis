# UI Redesign Progress: Flux Premium

## Original Prompt
You are a senior UI/UX engineer and motion designer specializing in premium, AI-native web products. Rework the UI of this Next.js LLM wrapper app from the ground up with a luxury, high-end aesthetic. 

### Design Direction
- **Dark mode first**: deep blacks (#0a0a0a, #111111), rich dark grays, with subtle warm or cool undertones.
- **Reference aesthetics**: Stripe (polished surfaces, gradient accents) + Perplexity/Gemini (AI-native glassmorphism, depth, blur layers).
- **Visual Hierarchy**: Clear typographic scale, generous whitespace.
- **Animations**: Smooth fade + subtle upward slide on route changes, glowing border pulse on focus, gradient shimmer on AI response streaming, staggered fade-in for messages, spring-based micro-interactions.
- **Glassmorphism & Depth**: Frosted glass effect (backdrop-blur, semi-transparent backgrounds, soft 1px rgba white/10 stroke), layered shadows, z-axis separation.
- **Components to Rework**: Navigation/sidebar, Chat input bar, Message bubbles, Loading/streaming states, Empty/onboarding states, Settings/model selector, Custom scrollbars.

---

## Work Completed

### 1. Design Token Architecture (Phase 1)
- **Tailwind Config**: Extended the theme with a luxury palette:
    - `void`: `#020205` (Deep background), `#0A0A0F` (Surface), `#16161E` (Elevated).
    - `gold`: `#C5A059` (Primary Luxury Gold), `#E6C892` (Highlight), `#8B6B32` (Contrast).
    - `glass`: Transparent white and border tokens for consistent refraction.
- **Typography**: Integrated `Playfair Display` (Serif) for high-end headings and `Inter` for UI precision.
- **Global CSS**: Implemented "Liquid Glass" utility classes:
    - `.glass-panel`: `backdrop-blur-xl` with a subtle linear-gradient highlight.
    - `.glass-card`: `backdrop-blur-md` with `border-glass-border`.
    - `.glass-card-hover`: Smooth transition to gold-tinted borders and shadows.

### 2. Core Chat Experience (Phase 2)
- **Message Bubbles (`message-bubble.tsx`)**:
    - **AI Messages**: "Frosted Obsidian" look. Deep void surfaces with gold accent borders and refined Serif typography for headings.
    - **User Messages**: "Transparent Quartz" aesthetic using `glass-card` and high-blur backgrounds.
    - **Avatars**: Updated to gold/void themes with `shadow-gold-glow`.
    - **Code Blocks**: Redesigned as "Obsidian Glass" panes with deep charcoal backgrounds and gold syntax accents.
- **Chat Input (`chat-input.tsx`)**:
    - **The Floating Capsule**: Transformed the input area into a centered, blurred glass capsule.
    - **Jewel Elements**: Converted buttons to circular, metallic gold variants with `shadow-gold-glow`.
    - **Refined Interaction**: Added `glass-panel` dropdowns for file uploads and model selection.

---

## Pending Work

### 3. Layout & Navigation (Phase 3 - In Progress)
- [ ] **Sidebar**: Transition to a semi-transparent frosted pane with "liquid" hover transitions and Z-axis depth.
- [ ] **UI Primitives**: Evolve `Button` and `Card` components into "Jewel" and "Light-leak" versions globally.
- [ ] **Dashboard Layout**: Establish the "Deep Void" base layer across all pages.

### 4. Motion & Liquid Polish (Phase 4)
- [ ] **Page Transitions**: Implement `SlideFade` animations using Framer Motion.
- [ ] **Staggered Entry**: Add staggered animations to message lists.
- [ ] **AI Aura**: Replace the blinking cursor with a pulsing gold aura animation.
- [ ] **Tactile Interactions**: Add spring-based scales (`whileHover`, `whileTap`) to all interactive elements.

### 5. Accessibility & Performance (Phase 5)
- [ ] Contrast and color-a11y audits; ensure WCAG AA for text and UI components.
- [ ] Keyboard-first navigation, visible focus rings, proper ARIA roles and labels.
- [ ] Reduced-motion toggle and testing across motion-preference settings.
- [ ] Performance budgets: optimize images/icons, minimize CSS footprint, enable Tailwind purge/tree-shaking.

### 6. Component Spec & Tokens (Phase 6)
- Deliver a component spec (props, variants, states) for Button, Card, Input, Sidebar, MessageBubble.
- Centralize tokens in tailwind.config.ts and DESIGN_TOKENS.md; include examples and usage patterns.
- Add Storybook stories and visual regression snapshots for all major components.

### Implementation Plan (Developer Tasks)
1. Implement Sidebar (src/components/layout/Sidebar.tsx) with responsive, frosted glass behaviors.
2. Add motion utilities (src/lib/motion.tsx) and Framer Motion wrappers for Page and List transitions.
3. Convert Button/Card to "Jewel" components; add unit + storybook tests.
4. Accessibility pass and performance profiling; iterate on tokens.

PR checklist
- Design tokens updated and documented
- Visual regression screenshots included
- Keyboard and screen-reader pass documented
- Lighthouse perf/accessibility checked (target >=90 where feasible)

Next steps: Start Phase 3 (Sidebar) implementation, open a draft PR, assign reviewer and include visual diffs.
