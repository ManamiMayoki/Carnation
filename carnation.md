# GridWise Smart Campus Energy Optimizer & Auth API



---


## Prerequisites
Ensure you have the following installed on your development machine:

---

## Environment Configuration

Follow these steps to spin up the entire application from a clean environment.

### Step 1: Clone or Pull Repository
```bash
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name

```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory and configure the required environment variables:

```env
POSTGRES_DB_NAME=myappdb_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=devpassword123
POSTGRES_PORT=5432
PORT=5000
NODE_ENV=development
# Optional LLM API Key (if using external AI models)
OPENAI_API_KEY=your_api_key_here

```

### Step 3: Install Dependencies or Pull Images

Enable corepack and install dependencies, or build via Docker:

```bash
# Enable package manager corepack
corepack enable

# Build and start services using Docker Compose (Recommended)
docker compose up -d --build

```

### Step 4: Verify Service Health (`/health`)

Confirm that the API service is up and running by querying the health endpoint:

```bash
curl -X GET http://localhost:5000/health

```

**Expected Response:**

```json
{
  "status": "ok"
}

```

### Step 5: Run a Public Sample against `/optimize-energy`

Test the core optimization engine by sending a sample payload:

```bash
curl -X POST http://localhost:5000/optimize-energy \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_id": "GRID-101",
    "operator_notes": [
      "Solar output will drop to about 20% from 1 PM to 3 PM."
    ],
    "hours": [
      {"hour": 0, "demand_kwh": 180, "solar_kwh": 0, "tariff_bdt_per_kwh": 7}
    ],
    "battery": {
      "capacity_kwh": 500,
      "initial_energy_kwh": 200,
      "minimum_energy_kwh": 50,
      "max_charge_kwh_per_hour": 100,
      "max_discharge_kwh_per_hour": 100
    }
  }'

```

---

## 🛠️ Tech Stack & Prerequisites

* **Runtime:** Node.js (v22 or higher)
* **Package Manager:** `pnpm`
* **Framework:** Hono (Fast, lightweight web framework)
* **Database:** PostgreSQL
* **Containerization:** Docker & Docker Compose
* **Reverse Proxy:** Caddy (for automated HTTPS/SSL in production)

---

## 📋 API Documentation

### 1. Energy Optimization API

* **Base Endpoint:** `POST /optimize-energy`
* **Purpose:** Interprets natural language operator notes using an LLM, validates constraints through guardrails, and computes a cost-minimized 24-hour energy schedule.

### 2. Authentication API (`/api/twaha/auth`)

All protected endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <jwt_token>

```

| Method | Path | Purpose | Auth Required |
| --- | --- | --- | --- |
| **POST** | `/register` | Register a new user account | No |
| **POST** | `/login` | Authenticate user & issue JWT | No |
| **GET** | `/account-info` | Retrieve authenticated user details | Yes |
| **PUT** | `/update-account-role` | Update user role (`USER` or `ADMIN`) | Yes (Admin) |

#### Uniform Error Format

All errors across the API follow a standardized structure:

```json
{
  "errCode": 400210,
  "errMsg": "Invalid JSON body"
}

```

---

## 🤖 AI Approach, Models & Safety Logic

* **LLM Integration:** Utilizes an integrated language model to parse unstructured operator directives (e.g., solar reductions, battery reserves) into machine-checkable structured rules.
* **Guardrails & Validation:** LLM outputs are treated as untrusted data. Deterministic validation checks hour ranges (0–23 in ascending order), factor bounds ($0 \le \text{factor} \le 1$), and inventory limits *before* passing constraints to the mathematical optimizer.
* **Safe Failure:** If the LLM returns malformed or unsupported structures, the service falls back safely without crashing or silently inventing illegal directives.

---

## 🐳 Docker & Database Management

### Running for Development

```bash
# Start PostgreSQL database container only
docker compose up -d db

# Run server locally
cd server
pnpm install
pnpm dev

```

### Database Management (`psql`)

Open an interactive PostgreSQL terminal:

```bash
docker exec -it <container_name_or_id> psql -U postgres -d myappdb_dev

```

### Stopping Services

```bash
# Stop containers
docker compose down

# Stop containers and wipe persistent database volumes
docker compose down -v

```

---

## 🌐 Production Deployment & Domain (HTTPS)

Production traffic is managed via **Caddy**, which handles automated SSL certificate generation via Let's Encrypt for domains like `jucsef.me`.

* `https://jucsef.me` -> Frontend client
* `https://jucsef.me/api/*` -> Proxies to the Hono API server

### VM Requirements:

1. **DNS:** `@` record pointing to the VM Public IP; `www` configured as a CNAME.
2. **Azure NSG / Firewall:** Inbound ports `80` and `443` open for ACME HTTP challenges and secure traffic.

```markdown

```