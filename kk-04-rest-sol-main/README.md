# KK-04 REST Solution - Stock Manager

A full-stack sample project for managing stocks and historical prices.

- **Backend:** Spring Boot 3.3 (Java 21), Spring Web, Spring Data JDBC, MySQL
- **Frontend:** React 18 + Vite
- **API Docs:** springdoc OpenAPI / Swagger UI
- **Containerization:** Docker + Docker Compose

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker Compose)](#quick-start-docker-compose)
- [Deployment Access (Linux VM)](#deployment-access-linux-vm)
- [Local Development (Without Docker)](#local-development-without-docker)
- [Configuration](#configuration)
- [Database Schema and Seed Data](#database-schema-and-seed-data)
- [API Reference](#api-reference)
- [Frontend Notes](#frontend-notes)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

## Overview

This project exposes REST endpoints to:

1. Create and list stocks
2. View stock details
3. Add and list historical price entries per stock

The UI lets you add stocks, drill into a stock, and manage its price history.

## Architecture

```text
+--------------+--------------------+------+------------------------------------------+
| Layer        | Component          | Port | Responsibility                           |
+--------------+--------------------+------+------------------------------------------+
| Frontend     | kk-04-frontend     | 8081 | Serves React UI through Nginx            |
| Proxy        | Nginx (frontend)   | 80   | Proxies /api/* to backend container      |
| Backend API  | kk-04-rest         | 8082 | Exposes REST endpoints for stocks/prices |
| Database     | bankdb (MySQL 8)   | 3306 | Persists stock and historical price data |
+--------------+--------------------+------+------------------------------------------+
```

Request flow:

```text
[ Browser :8081 ]
        |
        | GET /api/stocks
        v
[ Nginx (kk-04-frontend) ]
        |
        | proxy_pass /api/*
        v
[ Spring Boot API :8082 ]
        |
        | JDBC queries
        v
[ MySQL (bankdb) :3306 ]
```

## Tech Stack

```text
+-----------+--------------------------------------+---------+--------------------------------------+
| Layer     | Technology                           | Version | Notes                                |
+-----------+--------------------------------------+---------+--------------------------------------+
| Backend   | Java                                 | 21      | Runtime language                     |
| Backend   | Spring Boot                          | 3.3.5   | Application framework                |
| Backend   | Spring Web                           | Managed | REST controllers                     |
| Backend   | Spring Data JDBC                     | Managed | Data access layer                    |
| Backend   | MySQL Connector/J                    | Managed | MySQL JDBC driver                    |
| Backend   | springdoc-openapi-starter-webmvc-ui  | 2.6.0   | OpenAPI + Swagger UI                 |
| Frontend  | React                                | 18.3.1  | UI framework                         |
| Frontend  | Vite                                 | 5.4.0   | Dev server and build tool            |
| Container | Docker / Docker Compose              | N/A     | Multi-service local environment      |
+-----------+--------------------------------------+---------+--------------------------------------+
```

## Prerequisites

Install these tools:

- Java 21
- Maven 3.9+
- Node.js 20+
- Docker Desktop (for containerized run)
- MySQL 8 (only for non-Docker local DB)

## Quick Start (Docker Compose)

This is the easiest way to run everything.

```powershell
docker compose up --build
```

Services started:

- `bankdb` (MySQL): `localhost:3306`
- `kk-04-rest` (API): `localhost:8082`
- `kk-04-frontend` (UI via Nginx): `localhost:8081`

Open:

- Frontend: `http://localhost:8081`
- API base: `http://localhost:8082/api/stocks`
- Swagger UI: `http://localhost:8082/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8082/v3/api-docs`

Stop services:

```powershell
docker compose down
```

Stop and remove volumes (fresh DB):

```powershell
docker compose down -v
```

## Deployment Access (Linux VM)

After deployment, access services through the VM IP:

```powershell
$env:VM_IP="10.9.71.48"
```

Deployment rule: only port `8080` is externally accessible.

- Frontend: `http://${VM_IP}:8080`
- Swagger UI: `http://${VM_IP}:8080/swagger-ui/index.html`
- Jenkins: `http://${VM_IP}:8080`

No other external ports are accessible after deployment.

## Local Development (Without Docker)

### 1) Start MySQL and create database

Create database `stocksdb` (or update `application.properties` to match your DB name).

### 2) Run backend

From project root:

```powershell
mvn spring-boot:run
```

Backend default properties are in `src/main/resources/application.properties`.

### 3) Run frontend (Vite dev server)

From `frontend` folder:

```powershell
npm install
npm run dev
```

In development, `localhost` access is expected and all mapped ports are available.

Vite defaults to `http://localhost:5173`.

## Configuration

Main config files:

- `src/main/resources/application.properties`
- `src/main/resources/application-docker.properties`
- `src/main/resources/application-test.properties`
- `frontend/vite.config.js`
- `frontend/nginx.conf`

### Important settings

- `spring.sql.init.mode=always` auto-runs `schema.sql` on startup.
- `spring.profiles.active=docker` is currently set in `application.properties`.
- Docker backend profile expects MySQL host `bankdb` and DB `bankdb`.

### Recommended property formatting

Keep datasource URL values on a single line, for example:

```ini
spring.datasource.url=jdbc:mysql://bankdb:3306/bankdb?useSSL=false&allowPublicKeyRetrieval=true
```

## Database Schema and Seed Data

- Schema file: `src/main/resources/schema.sql`
- Tables:
  - `stock`
  - `historical_price`
- Constraints:
  - unique stock symbol
  - unique (`stock_id`, `price_date`) in historical prices

On startup, `StockApplication` seeds sample data when the `stock` table is empty.

## API Reference

Base URL: `/api/stocks`

Endpoint matrix:

```text
+--------+------------------------------+-----------------------------+----------------+
| Method | Route                        | Purpose                     | Typical Status |
+--------+------------------------------+-----------------------------+----------------+
| GET    | /api/stocks                  | List all stocks             | 200            |
| GET    | /api/stocks/{id}             | Get stock by ID             | 200, 404       |
| POST   | /api/stocks                  | Create new stock            | 201, 400       |
| GET    | /api/stocks/{stockId}/prices | List stock price history    | 200            |
| POST   | /api/stocks/{stockId}/prices | Add stock price entry       | 200, 400       |
+--------+------------------------------+-----------------------------+----------------+
```

### `GET /api/stocks`

Returns all stocks.

### `GET /api/stocks/{id}`

Returns one stock by ID (`404` if not found).

### `POST /api/stocks`

Creates a stock.

Sample request body:

```json
{
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "sector": "Technology",
  "exchange": "NASDAQ"
}
```

### `GET /api/stocks/{stockId}/prices`

Returns historical prices for a stock.

### `POST /api/stocks/{stockId}/prices`

Creates a historical price entry for a stock.

Sample request body:

```json
{
  "priceDate": "2026-08-05",
  "openPrice": 190.12,
  "closePrice": 193.44,
  "highPrice": 194.1,
  "lowPrice": 189.8,
  "volume": 21234000
}
```

### Error format

`IllegalArgumentException` is mapped to HTTP `400` by `GlobalExceptionHandler`:

```json
{
  "error": "Bad Request",
  "message": "Duplicate symbol: AAPL",
  "timestamp": "2026-08-05T12:34:56Z"
}
```

## Frontend Notes

- API helper is in `frontend/src/api.js`.
- Main pages:
  - `StocksPage.jsx` - add/list stocks
  - `StockDetailPage.jsx` - add/list historical prices
- In Docker, Nginx proxies `/api` to `kk-04-rest:8082`.

For local Vite development, verify proxy target in `frontend/vite.config.js` matches your backend port.

## Testing

Run backend tests (if/when tests are added):

```powershell
mvn test
```

Build backend artifact:

```powershell
mvn clean package
```

Build frontend artifact:

```powershell
Push-Location frontend
npm run build
Pop-Location
```

## Troubleshooting

- **Cannot connect to DB in Docker profile:** ensure backend uses host `bankdb` (container DNS), not `localhost`.
- **Datasource URL parsing issues:** keep `spring.datasource.url` on one line.
- **Duplicate symbol errors on create:** `symbol` is unique by design.
- **Frontend API calls fail in local Vite mode:** update `frontend/vite.config.js` proxy target to the backend port you are using.
- **Port conflicts during development:** free ports `3306`, `8081`, `8082` or change mappings in `docker-compose.yml`.
- **Cannot reach deployed services except 8080:** this is expected in deployed mode; use `http://10.9.71.48:8080`.

## Project Structure

```text
+--------------------------------------------------+------------------------------------------+
| Path                                             | Purpose                                  |
+--------------------------------------------------+------------------------------------------+
| src/main/java/com/stocks/controller/             | REST endpoints + exception handling      |
| src/main/java/com/stocks/service/                | Business logic interfaces/impl           |
| src/main/java/com/stocks/repository/             | JDBC repositories                        |
| src/main/java/com/stocks/model/                  | Domain models                            |
| src/main/java/com/stocks/config/                 | OpenAPI config                           |
| src/main/resources/application.properties         | Default Spring Boot settings             |
| src/main/resources/application-docker.properties  | Docker profile settings                  |
| src/main/resources/application-test.properties    | Test profile settings                    |
| src/main/resources/schema.sql                     | DB schema init                           |
| frontend/src/                                     | React source                             |
| frontend/package.json                             | Frontend scripts/dependencies            |
| frontend/vite.config.js                           | Vite config + proxy                      |
| frontend/nginx.conf                               | Nginx SPA/API proxy                      |
| Dockerfile                                        | Backend image build/runtime              |
| Dockerfile.frontend                               | Frontend build + Nginx image             |
| docker-compose.yml                                | Orchestrates DB, API, frontend           |
| pom.xml                                           | Maven build + backend dependencies       |
+--------------------------------------------------+------------------------------------------+
```

