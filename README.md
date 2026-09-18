# Full-Stack Application (Hono + PostgreSQL + Docker)

This repository contains a full-stack application built with **Hono** (Node.js API), **PostgreSQL** (Database), and a frontend client.

---

## Prerequisites

Ensure you have the following installed on your development machine:

* **Node.js** (v22 or higher)
* **pnpm** (Enable via Corepack: `corepack enable`)
* **Docker & Docker Compose**

---

## Environment Configuration

1. Create a `.env` file in the root directory:

```env
POSTGRES_DB_NAME=myappdb_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=devpassword123
POSTGRES_PORT=5432

```

2. Enable corepack if not already enabled:

```bash
corepack enable

```

---

## Running for Development

1. **Start the Database container:**
```bash
docker compose up -d db

```


2. **Install dependencies and start the Server:**
```bash
cd server
pnpm install
pnpm dev

```


3. **Install dependencies and start the Client:**
```bash
cd client
pnpm install
pnpm dev

```



---

## Running for Production

```bash
# Build and start all services in detached mode
docker compose up -d --build

# View real-time logs across all services
docker compose logs -f

# View logs for server only
docker compose logs -f server

```

---

## Database Management

Open an interactive `psql` prompt:

```bash
docker exec -it ci-cd-test-db-1 psql -U postgres -d myappdb_dev

```

---

## Running API Tests with Newman

Run Postman collection tests via Newman:

```bash
pnpm dlx newman run server/tests/postman/<test_file>.json

```

---

## Stopping and Cleaning up

```bash
# Stop containers
docker compose down

# Stop containers AND remove persistent database volumes
docker compose down -v

```

---

## HTTPS and Domain

Production traffic is terminated by **Caddy**, which automatically obtains and renews Let's Encrypt certificates for `jucsef.me` and `www.jucsef.me`.

* `https://jucsef.me` serves the client.
* `https://jucsef.me/api/*` proxies to the Hono server (prefix is stripped).

### Requirements on the VM side:

* **DNS:** A record `@` pointing to `<VM public IP>` and CNAME `www` pointing to `jucsef.me`.
* **Azure NSG:** Inbound ports `80` and `443` open (`80` is required for the ACME HTTP challenge).
* **Persistence:** Certificates persist in the `caddy_data` volume and survive redeploys.

> **Note:** When running locally, Caddy logs ACME errors because `jucsef.me` does not resolve to your machine. It still serves plain HTTP on port 80, which is fine for development.

---

## Service Ports and Addresses

| Service | Local URL / Address | Container Port |
| --- | --- | --- |
| **Caddy (entrypoint)** | `http://localhost` | `80, 443` |
| **Client** | Via Caddy only | `80` |
| **Hono API Server** | `http://localhost:5000`, `/api/*` | `5000` |
| **PostgreSQL Database** | `postgres://localhost:5432` | `5432` |

```

```markdown
# TWAHA Auth API Documentation

**Base URL:** `http://localhost:5000/api/twaha/auth`

---

## 🔐 Authentication

All protected endpoints require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <jwt_token>

```

*Tokens are obtained via `/login` or `/register` endpoints.*

---

## 📋 Error Format

All errors across the API follow this uniform structure:

```json
{
  "errCode": 400210,
  "errMsg": "Invalid JSON body"
}

```

---

## 🚀 Endpoints

### 1. Register User

* **Method:** `POST`
* **Path:** `/register`
* **Purpose:** Register a new user account.

#### Request Body

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `username` | string | Yes | 3–100 characters, trimmed |
| `email` | string | Yes | Valid email format, trimmed |
| `password` | string | Yes | 6–255 characters |

#### Success Response (`201 Created`)

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "twaha",
    "email": "twaha@gmail.com",
    "createdAt": "2026-09-05T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

```

#### Error Responses

| Status Code | Error Code | Message |
| --- | --- | --- |
| `400` | `400210` | Invalid JSON body |
| `400` | `400211` | Username is required |
| `400` | `400212` | Username must be at least 3 characters |
| `400` | `400213` | Username must be at most 100 characters |
| `400` | `400214` | Email is required |
| `400` | `400215` | Invalid email format |
| `400` | `400216` | Password is required |
| `400` | `400217` | Password must be at least 6 characters |
| `400` | `400218` | Password must be at most 255 characters |
| `409` | `409219` | Email already registered |
| `409` | `409220` | Username already taken |
| `409` | `409221` | User already exists |
| `500` | `500222` | Failed to register user due to internal server error |

---

### 2. Login User

* **Method:** `POST`
* **Path:** `/login`
* **Purpose:** Authenticate a user with email/username and password.

#### Request Body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` (or `email`/`username`) | string | Yes | Email or username (trimmed) |
| `password` | string | Yes | User password |

#### Success Response (`200 OK`)

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "twaha"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

```

#### Error Responses

| Status Code | Error Code | Message |
| --- | --- | --- |
| `400` | `400230` | Invalid JSON body |
| `400` | `400231` | Email or username is required |
| `400` | `400232` | Password is required |
| `401` | `401234` | Invalid credentials |
| `500` | `500234` | Failed to login due to internal server error |

---

### 3. Get Account Info

* **Method:** `GET`
* **Path:** `/account-info`
* **Purpose:** Retrieve authenticated user's account information. *(Requires authentication)*

#### Headers

```http
Authorization: Bearer <jwt_token>

```

#### Success Response (`200 OK`)

```json
{
  "user": {
    "id": 1,
    "username": "twaha",
    "email": "twaha@gmail.com",
    "role": "USER",
    "createdAt": "2026-09-05T12:00:00.000Z"
  }
}

```

#### Error Responses

| Status Code | Error Code | Message |
| --- | --- | --- |
| `401` | `401300` | Unauthorized |
| `404` | `404235` | User not found |
| `500` | `500236` | Failed to fetch user |

---

### 4. Update Account Role

* **Method:** `PUT`
* **Path:** `/update-account-role`
* **Purpose:** Update a user's role. *(Requires authentication and `ADMIN` role)*

#### Headers

```http
Authorization: Bearer <jwt_token>

```

#### Request Body

| Field | Type | Required | Constraints |
| --- | --- | --- | --- |
| `username` | string | Yes | Target username |
| `role` | string | Yes | Must be `"USER"` or `"ADMIN"` |

#### Success Response (`200 OK`)

```json
{
  "username": "twaha",
  "role": "ADMIN"
}

```

#### Error Responses

| Status Code | Error Code | Message |
| --- | --- | --- |
| `400` | `400230` | Invalid JSON body |
| `400` | `400250` | Invalid request JSON: role can only be 'USER' or 'ADMIN' |
| `401` | `401300` | Unauthorized |
| `401` | `401302` | Unauthorized: Action requires 'ADMIN' role |
| `404` | `404301` | User not found |
| `500` | `500236` | Failed to fetch user |

---

## 📦 Data Models

### `PublicUserInfo`

```typescript
{
  id: number;
  username: string;
  email: string;
  role: string;          // "USER" | "ADMIN"
  createdAt: Date;       // ISO 8601 format
}

```

### `JwtPayload`

```typescript
{
  id: number;
  username: string;
  email: string;
}

```

```

```