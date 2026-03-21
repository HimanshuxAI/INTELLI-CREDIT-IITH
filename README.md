# 🏦 IntelliCredit — AI Credit Decisioning Engine

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter_AI-Multi--Model-blueviolet?style=for-the-badge)

**IntelliCredit** is a next-generation, AI-driven credit underwriting platform built to automate the complex financial appraisal process. It ingests dense financial documentation (Bank Statements, Annual Reports, GST Returns) and instantly outputs structured, data-driven credit decisions based on the industry-standard **5C Framework** (Character, Capacity, Capital, Collateral, Conditions).

Built for speed, accuracy, and resilience, IntelliCredit features real-time Server-Sent Events (SSE) streaming, local Regex-driven financial text extraction, and an intelligent multi-model AI router.

---

## ✨ Key Features

- 📄 **Insta-Parse Engine:** Upload massive PDFs or XLSX files. Our local execution parses thousands of pages into raw text instantly.
- 🧠 **Multi-Model AI Orchestration:** Powered by OpenRouter, the system routes your documents to state-of-the-art open-weight models (Llama 3.3 70B, Mistral, Qwen) to generate the appraisal.
- 🌊 **Resilient Fallback System:** If the primary AI is rate-limited, the system seamlessly falls back to the next available model. If *all* internet connectivity drops, the system uses an offline Regex-miner to extract Turnover, Net Worth, CIN, and DSCR directly from the text to generate plausible scores.
- 📊 **Dynamic 5C Dashboards:** Interactive UI with Recharts-powered Radar and Bar charts visualizing borrower health. 
- 🏆 **Peer Comparison Engine:** Automatically rank and compare multiple borrowers. The engine mathematically calculates the best candidate based on composite scores and highlights the winner.
- 📜 **Audit & Compliance:** Export instant Credit Appraisal Memos (CAM) to CSV and internal compliance logs.

---

## 🏗️ Architecture & Deep Dive

We built IntelliCredit to be highly modular and production-ready. 

👉 **[Read the full Architecture & Code Deep Dive (ARCHITECTURE.md)](./ARCHITECTURE.md)** for detailed block diagrams, data flow sequence charts, and an explanation of the multi-model AI logic.

---

## 🛠️ Technology Stack

*   **Frontend:** Next.js 15 (App Router), React, Tailwind CSS 3.4
*   **Data Visualization:** Recharts, Lucide React
*   **Backend / API:** Next.js Serverless Edge Routes
*   **Document Processing:** `pdf-parse@1.1.1` (raw text extraction), `xlsx`
*   **AI Integration:** OpenRouter API (Streaming Server-Sent Events)

---

## 🚀 Quick Start (Run Locally)

**1. Clone the repository**
```bash
git clone https://github.com/HimanshuxAI/INTELLI-CREDIT-IITH.git
cd INTELLI-CREDIT-IITH
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure Environment Variables**
Create a `.env.local` file in the root directory and add your OpenRouter API key:
```env
OPENROUTER_API_KEY="your-openrouter-api-key"
```

**4. Start the Development Server**
```bash
npm run dev
```

**5. Open the App**
Navigate to `http://localhost:3000` in your browser.

---

## 📂 Demo Documents
For testing the extraction and AI, use standard financial documents like Bank Statements or Annual Reports. The engine looks for standard financial reporting structures to extract Net Worth, DSCR, and Turnover.

---
*Built with ❤️ for the Hackathon*
