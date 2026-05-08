# Scrooge.ai

An explainable reinforcement learning framework for portfolio optimization. Scrooge.ai trains a PPO agent with a custom Dirichlet policy to allocate investments across four asset classes, and pairs every decision with a perturbation-based XAI explanation — packaged into a full-stack web application for retail investors.

---

## What it does

- Runs a PPO reinforcement learning agent trained on 17 years of market data (2007-2025)
- Uses a custom Dirichlet distribution policy to generate valid portfolio weights that sum to 1
- Explains every allocation decision using perturbation-based feature importance (no SHAP, no LIME)
- Fetches live NIFTY 50 data on every simulation so results are always current
- Persists all simulations per user with full history, metrics, and XAI breakdowns

---

## Tech stack

- **Frontend** - Next.js, deployed on Vercel
- **Backend** - FastAPI, Python
- **ML** - Stable-Baselines3, PyTorch, Gymnasium
- **Database** - SQLite via SQLAlchemy
- **Auth** - JWT (python-jose) + bcrypt
- **Data** - Yahoo Finance via yfinance

---

## Project structure

```
scrooge/
├── api.py              - FastAPI backend, all endpoints
├── auth.py             - JWT and bcrypt helpers
├── database.py         - SQLAlchemy engine and session
├── models.py           - ORM models (User, Simulation)
├── trading_env.py      - Gymnasium RL environment
├── train_ppo.py        - PPO training entry point
│
├── src/
│   ├── dirichlet_policy.py   - Custom Dirichlet action distribution
│   ├── decision_logger.py    - Logs agent decisions per step
│   ├── explainability.py     - Perturbation-based XAI
│   ├── performance_metrics.py
│   ├── ppo_comparison.py
│   └── precompute.py         - Precomputes baseline comparison cache
│
├── scripts/
│   ├── fetch.py              - Fetches raw NIFTY data
│   ├── prepare_data.py       - Generates synthetic multi-asset features
│   ├── live_test.py          - Out-of-sample live data test
│   └── evaluate_agent.py     - Standalone agent evaluation
│
├── frontend/           - Next.js application
├── data/               - Historical market data CSVs
├── models/             - Trained PPO model (ppo_trading_model.zip)
├── results/            - Simulation outputs and charts
└── tests/              - Environment and agent tests
```

---

## Running locally

**Backend**
```bash
pip install -r requirements.txt
uvicorn api:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

---

## Environment variables

Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Training the model

```bash
python scripts/prepare_data.py   # generate features.csv from cleaned.csv
python train_ppo.py               # train PPO agent (saves to models/)
python src/precompute.py          # precompute baseline comparison cache
```

---


---

## SDG alignment

Scrooge.ai is designed to reduce the informational asymmetry between retail and institutional investors, directly supporting **UN Sustainable Development Goal 10** - Reduced Inequalities.
