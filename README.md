# Voodo Finance Coach AI

> **A premium‑grade, AI‑powered personal finance coaching web application** built with a modern glass‑morphism UI, dark‑mode support, and real‑time LLM insights.

---

## 📖 Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture Diagram](#architecture-diagram)
4. [Tech Stack](#tech-stack)
5. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
   - [Running the Application](#running-the-application)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [Frontend Navigation & Screens](#frontend-navigation--screens)
9. [Testing](#testing)
10. [Deployment Options](#deployment-options)
11. [Contributing](#contributing)
12. [License](#license)

---

## 🎯 Project Overview

Voodo Finance Coach AI helps Indian college students and first‑time earners (interns, gig workers, fresh graduates) gain financial literacy through a conversational AI coach. The app lets users:

- **Enter monthly income and detailed expense categories** (Housing, Food, Transport, etc.).
- **Receive AI‑generated budgeting advice** that explains why a spending pattern is risky and offers actionable tips.
- **Track savings goals** with an automatically generated week‑by‑week roadmap.
- **Take a 5‑question personality quiz** that tailors the coach’s tone and recommendations.
- **Compare their savings rate with anonymised peers** (mock data based on income brackets).
- **Detect recurring bad‑spending habits** and get nudges to curb them.
- **Export a beautifully styled PDF report** summarising their financial health.

All interactions are persisted in a SQLite database, and the UI follows a sleek dark‑mode glass‑morphism design with smooth micro‑animations.

---

## ✨ Key Features (Detailed)

| Category | Feature | Detailed Description |
|----------|---------|----------------------|
| **Core** | **Transaction Management** | Add, edit, and delete income/expense transactions. Expenses automatically update the corresponding budget’s `spent` value. |
| | **Dynamic AI Budget Advice** | A "Refresh" button calls the `/budget-advice/{session_id}` endpoint. The backend builds a prompt with the user’s budget data and queries Mistral‑7B‑Instruct via the OpenAI‑compatible client. Returns exactly **4 short, actionable tips**. |
| | **PDF Export** | Generates a multi‑page PDF using `jsPDF` + `jspdf‑autotable`. Includes a title page, financial summary table, 6‑month spending history, budget breakdown with colour‑coded status, and a branded footer. |
| **Onboarding** | **5‑Question Personality Quiz** | Simple yes/no questionnaire that determines a `personality` label (e.g., *Spender*, *Saver*). The quiz also captures preferred language (English, Hindi, Tamil, Telugu). Results are stored in `UserSession.personality`. |
| **Analytics** | **Peer Comparison** | Mock endpoint `/peer-compare/{session_id}` calculates the user’s savings‑rate and compares it to an average rate for the user’s income bracket. Returns JSON with `user_savings_rate`, `peer_average_rate`, and a boolean `above_peer`. |
| | **Bad‑Habit Detection** | Endpoint `/habits/{session_id}` analyses the last 6 months of mock spending data. If a category’s spend exceeds its budget limit for **3 consecutive months**, a nudge is generated: `{category, message}`. |
| **Goals** | **Savings Goal Planner** | Users create a goal (name, target amount, horizon). Backend converts horizon (e.g., "3 months") to weeks, then builds a weekly plan (`weekly_plan` JSON) with `amount` and cumulative savings. Displayed as a grid of week cards. |
| **UI/UX** | **Glass‑Morphism Design** | All cards use a semi‑transparent background, subtle blur, and soft shadows. Colors are derived from a curated palette (purple, teal, amber). |
| | **Dark‑Mode Toggle** | Persists user preference in `localStorage` (`voodo_theme`). The `<html>` element receives a `data-theme` attribute that drives CSS variables. |
| | **Framer‑Motion Animations** | Page transitions, card hover lifts, button scaling, and loading spinners (`spinning` keyframe). |
| | **Responsive Layout** | Sidebar collapses on narrow viewports; main content adapts using CSS grid/flexbox. |

---

## 🏗️ Architecture Diagram

```mermaid
flowchart TD
    subgraph Frontend[React Frontend]
        A[App.jsx] --> B[Sidebar]
        A --> C[Header]
        A --> D[Page Router]
        D -->|dashboard| DashboardPage
        D -->|transactions| TransactionsPage
        D -->|budgets| BudgetsPage
        D -->|goals| GoalsPage
        D -->|quiz| QuizPage
        D -->|peer| PeerComparePage
        D -->|habits| BadHabitsPage
    end
    subgraph Backend[FastAPI Backend]
        E[main.py] --> F[finance_routes.py]
        E --> G[chat_routes.py]
        F --> H[LLMCoach (Mistral‑7B)]
        F --> I[FinancialHealthEngine]
        F --> J[SQLAlchemy models]
    end
    Browser --> Frontend
    Frontend -->|/api/*| Backend
    Backend -->|SQLite DB| DB[(SQLite)]
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python 3.11, FastAPI, Uvicorn, SQLAlchemy, SQLite, `openai` client (for Mistral‑7B) |
| **Frontend** | React (JSX), Vite, Framer Motion, Lucide‑React icons, Recharts, jsPDF, jspdf‑autotable |
| **AI** | Mistral‑7B‑Instruct (via HuggingFace Router API) |
| **Styling** | Custom CSS with CSS variables, glass‑morphism, dark‑mode support |
| **Version Control** | Git (GitHub) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (>= 18) and **npm**
- **Python** (>= 3.11) with `venv`
- **Git**
- **HuggingFace API key** – sign up at https://huggingface.co and generate a token.

### Clone the Repository

```bash
git clone https://github.com/theopintheo/Voodo_fintech.git
cd Voodo_fintech/finance-coach-ai
```

### Backend Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows (use `source venv/bin/activate` on macOS/Linux)

# Install Python dependencies
pip install -r backend/requirements.txt

# Copy environment template and add your HuggingFace key
cp backend/.env.example backend/.env
# Edit .env and set HUGGINGFACE_API_KEY=your_token_here

# Run the API (default port 8001)
venv\Scripts\python.exe backend/main.py
```
The API will be available at `http://127.0.0.1:8001`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev   # Vite dev server on http://localhost:3000
```
The Vite config proxies `/api` and `/session` to the FastAPI backend (see `vite.config.js`).

### Running the Full Application
1. Start the backend (`venv\Scripts\python.exe backend/main.py`).
2. In another terminal, start the frontend (`npm run dev`).
3. Open your browser at `http://localhost:3000`.
4. The app will automatically create a session (stored in `localStorage`). If `onboarded` is `false`, you’ll be taken to the **Quiz** page first.

---
## 🛠️ How to Use the Website

Below is a quick guide on how to interact with the Finance Coach AI web app and a summary of its core features.

### 1️⃣ Start the Application
- **Backend**: `venv\\Scripts\\python.exe backend/main.py` (runs on `http://127.0.0.1:8001`).
- **Frontend**: `npm run dev` inside the `frontend` folder (runs on `http://localhost:3000`).

### 2️⃣ Onboarding Quiz
- The first page you see is the **Quiz**. Answer the 5 yes/no questions, provide your monthly income and expense breakdown, then click **Finish Quiz**. This creates your session, calculates a health score, and generates mock accounts, budgets, and an initial transaction.

### 3️⃣ Dashboard
- View summary cards (balance, income, spending, health score, grade, personality).
- Interact with the AI chat to ask finance‑related questions.
- Export a PDF report of your financial snapshot.

### 4️⃣ Transactions
- Add new income or expense entries; budgets update automatically.

### 5️⃣ Budgets
- See each budget’s limit, spent amount, and usage %.
- Click **Refresh** for AI‑generated budgeting tips.

### 6️⃣ Savings Goals
- Create a goal and get a week‑by‑week savings plan.

### 7️⃣ Peer Comparison
- Compare your savings‑rate with anonymised peers.

### 8️⃣ Bad‑Habit Detection
- Receive nudges for categories you’ve overspent on for three consecutive months.

### 9️⃣ Theme & UI
- Toggle dark/light mode via the header button. All pages use glass‑morphism cards, smooth animations, and are fully responsive.

Enjoy managing your finances with Voodo Finance Coach AI!

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `HUGGINGFACE_API_KEY` | Token for accessing the Mistral‑7B model via HuggingFace Router. |
| `DATABASE_URL` (optional) | If you want to use a different DB URL; defaults to SQLite file `finance_coach.db`. |
| `PORT` (optional) | Override the FastAPI port (default `8001`). |

All variables are read from `backend/.env`.

---

## 📡 API Reference (Backend)

> Base URL: `http://127.0.0.1:8001`

### Session Management
- `POST /session/create` – Returns `{ "session_id": "<uuid>" }`.
- `GET /session/{session_id}` – Returns `{ "session_id": "...", "onboarded": true/false }`.

### Onboarding / Quiz
- `GET /api/finance/onboard/{session_id}` – Retrieve saved onboarding data (income, expenses, language, personality).
- `POST /api/finance/onboard/{session_id}` – Body `{ income, expenses, quiz_answers, language }`. Calculates health score, grade, personality, creates mock accounts/budgets/transactions, and sets `onboarded=true`.

### Dashboard
- `GET /api/finance/dashboard/{session_id}` – Returns a comprehensive payload:
  ```json
  {
    "balance": 12345,
    "income": 50000,
    "spending": 21000,
    "health_score": 78,
    "grade": "B",
    "personality": "Saver",
    "spending_data": [...],
    "weekly_data": [...],
    "category_colors": {"Food": "#8b5cf6", ...}
  }
  ```

### Transactions
- `GET /api/finance/transactions/{session_id}` – List all transactions.
- `POST /api/finance/transactions/{session_id}/add` – Body `{ name, category, amount, date?, type }`. Updates budget `spent` if `type="expense"`.
- `PUT /api/finance/transactions/{session_id}/{tx_id}` – Update amount.

### Budgets
- `GET /api/finance/budgets/{session_id}` – List budgets.
- `PUT /api/finance/budgets/{session_id}/{budget_id}` – Update `limit`/`spent`.
- `GET /api/finance/budget-advice/{session_id}` – Returns `{ "recommendations": ["Tip 1", "Tip 2", ...] }`.

### Goals
- `POST /api/finance/goals/{session_id}` – Body `{ name, target_amount, target_date }`. Returns created goal ID.
- `GET /api/finance/goals/{session_id}` – List goals with weekly plan.
- `DELETE /api/finance/goals/{session_id}/{goal_id}` – Remove a goal.

### New Features
- `GET /api/finance/peer-compare/{session_id}` – Returns `{ "comparison": { "user_savings_rate": 12.5, "peer_average_rate": 15.0, "above_peer": false } }`.
- `GET /api/finance/habits/{session_id}` – Returns `{ "nudges": [{ "category": "Food", "message": "You have overspent on Food for 3 months. Consider cutting back." }, ...] }`.

### Chat (LLM Coach)
- `POST /api/chat/{session_id}/message` – Body `{ message }`. Returns `{ response: "..." }`.
- `GET /api/chat/{session_id}/history` – Returns an array of chat messages.

---

## 🎨 Frontend Navigation & Screens

| Page | Route (sidebar id) | Description |
|------|-------------------|-------------|
| **Dashboard** | `dashboard` | Overview cards, spending chart, AI chat, PDF export. |
| **Accounts** | `accounts` | List of accounts with balances; edit balances inline. |
| **Transactions** | `transactions` | Table of transactions + collapsible **Add Transaction** form. |
| **Budgets** | `budgets` | Budget cards, limit editing, live AI advice with **Refresh** button. |
| **Savings Goals** | `goals` | Goal creator + weekly roadmap cards. |
| **Quiz** | `quiz` | 5‑question personality quiz + income/expense entry. |
| **Peer Compare** | `peer` | Shows your savings‑rate vs. mock peer average. |
| **Bad Habits** | `habits` | List of nudges for categories overspent for 3+ months. |

### Screenshots (replace with real images)

```
public/screenshots/dashboard.png
public/screenshots/transactions.png
public/screenshots/budgets.png
public/screenshots/goals.png
public/screenshots/quiz.png
public/screenshots/peer_compare.png
public/screenshots/bad_habits.png
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest   # (add tests in `tests/` as needed)
```

### Frontend Tests
```bash
cd frontend
npm run test   # Uses Jest + React Testing Library
```

---

## 📦 Deployment Options

1. **Docker** – Build separate images for backend and frontend and orchestrate with `docker‑compose`.
2. **Static Hosting** – Run `npm run build` and serve the `dist/` folder on Netlify, Vercel, or any CDN.
3. **Backend Hosting** – Deploy FastAPI on Render, Fly.io, Azure App Service, or Heroku. Remember to set `HUGGINGFACE_API_KEY` in the environment.
4. **Full‑stack on Railway** – Use Railway’s multi‑service setup to run both containers together.

---

## 🙋‍♀️ Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b feature/awesome-feature
   ```
3. Make your changes and ensure the app still builds.
4. Commit with a clear message and push:
   ```bash
   git push origin feature/awesome-feature
   ```
5. Open a Pull Request describing the changes.

Please keep the code style consistent (Prettier for JS, Black for Python) and write tests for new functionality.

---

## 📄 License

This project is licensed under the **MIT License** – you are free to use, modify, and distribute it.

---

**Happy budgeting!** 🎉
