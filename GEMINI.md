# Flux: AI Dark Luxury - Project Context

This file provides instructional context for AI agents working on the **Flux** project. Flux is a premium, high-performance AI chat interface featuring a "Dark Luxury" aesthetic.

## 🏗️ Project Architecture & Tech Stack

*   **Framework:** Next.js 14 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS with a custom "Dark Luxury" theme (glassmorphism, dark backgrounds `#0a0a0f`, gold accents `#c9a84c`).
*   **UI Components:** shadcn/ui (Radix UI primitives). The components use the `new-york` style with CSS variables.
*   **Backend & Auth:** Appwrite (Database and Authentication). Configuration and types are in `src/lib/appwrite/`.
*   **AI Integration:** OpenAI SDK configured to point to NVIDIA's API endpoints (`https://integrate.api.nvidia.com/v1`). Handled in `src/lib/nvidia.ts` and `src/app/api/chat/route.ts`.
*   **State Management:** React Context (`src/context/chat-context.tsx`) is currently the primary provider in the layout, though Zustand stores (`src/stores/`) exist and may be used for specific global state or are part of a refactor.

## 📂 Directory Structure

*   `src/app/`: Next.js App Router pages, layouts, and API routes (`src/app/api/`).
*   `src/components/`: Reusable UI components.
    *   `src/components/ui/`: shadcn/ui components.
    *   `src/components/chat/`: Chat-specific components (input, message bubbles, etc.).
*   `src/context/`: React Context providers (Theme, Chat).
*   `src/hooks/`: Custom React hooks (e.g., streaming hooks).
*   `src/lib/`: Utility functions, API clients, and Appwrite configuration.
*   `src/stores/`: Zustand state management stores.
*   `public/`: Static assets like icons and logos.

## ⚙️ Development & Scripts

Use standard npm scripts defined in `package.json`:

*   **Development Server:** `npm run dev`
*   **Build:** `npm run build`
*   **Production Start:** `npm run start`
*   **Linting:** `npm run lint`

**Environment Variables:**
Ensure `.env.local` is present with the following required keys:
*   `NEXT_PUBLIC_APPWRITE_ENDPOINT`
*   `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
*   `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
*   `NVIDIA_API_KEY`

## 📝 Conventions & Best Practices

1.  **UI/UX:** Adhere to the "Dark Luxury" aesthetic. Use modern glassmorphism (backdrop-blur, subtle borders) and maintain high contrast for interactive elements.
2.  **Components:** Use `lucide-react` for icons. Utilize existing `shadcn/ui` components located in `src/components/ui/` before creating custom base components.
3.  **State:** Be aware of the dual presence of Zustand (`src/stores/`) and React Context (`src/context/`). Prefer `useChat` from `chat-context.tsx` for chat-related state as it is provided at the root level.
4.  **AI:** The app supports multiple models (DeepSeek, Nemotron, etc.) via the NVIDIA API integration. Ensure streaming logic uses the established `use-smooth-stream` mechanisms if applicable.
5.  **Styling:** Use `clsx` and `tailwind-merge` (typically via a `cn` utility in `src/lib/utils.ts`) for conditional class joining.