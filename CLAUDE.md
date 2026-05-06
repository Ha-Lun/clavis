# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development Server**: `npm run dev`
- **Build Project**: `npm run build`
- **Start Production Server**: `npm run start`
- **Linting**: `npm run lint`

## Architecture & Structure

Flux is a Next.js 14 application using the App Router, designed with a "Dark Luxury" aesthetic.

### Core Architecture
- **Frontend Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with a focus on glassmorphism and luxury gold accents (`#c9a84c`).
- **Backend/Database**: Appwrite (Auth, Database, Storage).
- **State Management**: Zustand (`src/stores/`) for UI, chat, and project state.
- **AI Integration**: Multi-model support via NVIDIA API and others, handled in `src/lib/`.

### Directory Layout
- `src/app/`: Next.js App Router pages and API routes.
  - `api/`: Backend endpoints for chat and project management.
  - `dashboard/`: The main authenticated application area.
- `src/components/`: UI components, organized by feature (e.g., `chat/`, `project/`, `ui/`).
- `src/lib/`: Core business logic and external integrations.
  - `appwrite/`: Configuration and server-side actions for Appwrite.
  - `nvidia.ts`: Implementation of the NVIDIA AI API.
- `src/stores/`: Zustand stores for global state management.
- `src/hooks/`: Custom React hooks (e.g., `use-smooth-stream.ts` for AI response animations).
- `src/context/`: React context providers.

### Design Guidelines
- **Aesthetic**: High background blur (`backdrop-blur-md`), subtle borders (`border-white/10`), and deep backgrounds (`#0a0a0f`).
- **Typography**: Cormorant Garamond for headings.
- **Components**: Uses Radix UI primitives via shadcn/ui patterns.
