# 🌌 Flux: AI Dark Luxury

Flux is a premium, high-performance AI chat interface designed with a **Dark Luxury** aesthetic. It combines the power of state-of-the-art AI models with a sleek, glassmorphic UI, providing a frictionless and visually stunning experience for power users.

![Flux Home Mockup](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop)

## ✨ Key Features

- **🏆 Dark Luxury Aesthetic**: A bespoke interface built with Cormorant Garamond typography, gold accents (`#c9a84c`), and deep purple glassmorphism.
- **🚀 Perplexity-Style Home**: A centralized, distraction-free prompt interface that lets you jump straight into a conversation.
- **🌊 Fluid Generation**: Custom-built smooth streaming that makes AI responses feel natural and continuous.
- **🛑 Instant Control**: Real-time "Stop Generation" capability using AbortController.
- **🧠 Multi-Model Support**: Support for a variety of top-tier models including:
  - **DeepSeek V4** (Flash & Pro)
  - **NVIDIA Nemotron**
  - **Zhipu GLM 5.1**
  - **MiniMax M2.7**
  - **Moonshot Kimi**
- **📂 Organization**: Full sidebar management for recent chats and categorized projects.
- **📝 Markdown & Syntax Highlighting**: Full support for rich text generation and syntax-highlighted code blocks.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS
- **Database/Auth**: [Appwrite](https://appwrite.io/)
- **Icons**: Lucide React + Custom SVG Brand Logos
- **Fonts**: Cormorant Garamond (Google Fonts)

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Ha-Lun/flux.git
cd flux
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory and add your Appwrite and NVIDIA credentials:
```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NVIDIA_API_KEY=your_nvidia_api_key
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎨 Design Philosophy

Flux follows the principles of **Modern Glassmorphism**:
- High background blur (`backdrop-blur-md`)
- Subtle borders (`border-white/10`)
- Deep, desaturated backgrounds (`#0a0a0f`)
- High-contrast gold accents for interactive elements

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
