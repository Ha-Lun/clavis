# 🌌 Clavis: The AI Synthesis & Knowledge Powerhouse

Clavis is a high-end AI orchestration platform engineered for synthesis and advanced knowledge management. Moving beyond simple chat, Clavis leverages a sophisticated 'Model Council' architecture to synthesize insights from multiple state-of-the-art LLMs, delivering a singular, high-confidence 'Golden Response' within a breathtakingly luxurious interface.

![Clavis Home Mockup](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop)

## 🏛️ The Clavis Intelligence Engine

### The Model Council (Synthesis Engine)
*   **Parallel Orchestration:** Simultaneously queries a curated ensemble of top-tier models (OpenAI, NVIDIA, and others).
*   **Kimi Synthesis:** Utilizes Moonshot Kimi to aggregate and synthesize parallel outputs, resolving contradictions and extracting the most accurate insights.
*   **The Golden Response:** Produces a definitive, synthesized answer that represents the consensus of the council.
*   **Confidence & Analysis:** Provides transparent consensus/disagreement analysis and confidence scoring for every complex query.

### ⚡ Intelligent Auto-Mode
*   **Dynamic Selection:** An intelligent routing layer that automatically selects the optimal model based on the prompt's complexity and intent.
*   **Zero-Config Power:** Experience peak performance without manually switching models.

### 📄 Document Cognition
*   **Deep PDF Parsing:** High-fidelity PDF extraction and processing.
*   **Contextual Dialogue:** The ability to upload complex documents and engage in deep, context-aware conversations with your data.

### 📂 Knowledge Ecosystem
*   **Project-Based Organization:** Organize conversations into structured projects for long-term knowledge retention.
*   **Knowledge Pinning:** Quickly surface critical insights by pinning essential conversations.
*   **Live Global Search:** Instant, live search across your entire conversation history and project library.

### 💎 Visual & UX Excellence
*   **Dark Luxury Aesthetic:** A bespoke interface featuring Cormorant Garamond typography and signature gold accents (`#c9a84c`).
*   **Fluid Streaming:** Custom-engineered smooth streaming for natural, continuous AI responses.
*   **Glassmorphic Interface:** A sophisticated, high-transparency UI that blends form and function.

## 🛠️ Technical Architecture

**The Power Stack:**
*   **Core Framework:** `Next.js 14` (App Router) & `TypeScript`
*   **State Management:** `Zustand`
*   **Animation Engine:** `Framer Motion`
*   **Infrastructure:** `Appwrite` (Authentication, Database, Storage)
*   **AI Integration:** `OpenAI API` & `NVIDIA API`
*   **Intelligence Utilities:** `pdf-parse`, `react-markdown`, `react-syntax-highlighter`

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Ha-Lun/clavis.git
cd clavis
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory and add your credentials:
```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id

# AI Orchestration Keys
OPENAI_API_KEY=your_openai_api_key
NVIDIA_API_KEY=your_nvidia_api_key
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎨 Design Philosophy

Clavis follows the principles of **Modern Glassmorphism**:
*   High background blur (`backdrop-blur-md`)
*   Subtle borders (`border-white/10`)
*   Deep, desaturated backgrounds (`#0a0a0f`)
*   High-contrast gold accents for interactive elements

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
