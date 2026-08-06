# Transaction Monitoring and Alerts Dashboard

A full-stack suspicious transaction monitoring platform with rule-based alert generation, built with **Java Spring Boot** (backend) and **React** (frontend).


## Project References

| Document | Purpose |
|---|---|
| [`REST_API_DOCUMENTATION.md`](./REST_API_DOCUMENTATION.md) | All API endpoints, request/response formats |
| [`Transaction_Monitoring_Project_Task_Tracking.ods`](./Transaction_Monitoring_Project_Task_Tracking.ods) | Task completion status and progress tracking |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Java 25, Spring Boot, Spring Data JPA |
| Database | MySQL |
| Build | Maven (Maven Wrapper included) |
| Frontend | React |

---

## Project Structure

```
src/main/java/com/neueda/
├── controller/         → REST API controllers
├── service/            → Business logic
├── repository/         → JPA repositories
├── entity/             → JPA entities (DB-mapped classes)
├── dto/                → Request and Response objects
├── ruleengine/         → Rule engine and rule implementations
├── exception/          → Global exception handling
├── config/             → App configuration (Swagger)
└── util/               → Constants and utilities

frontend/src/
├── pages/              → Dashboard, Transactions, Rules, Alerts pages
├── components/         → NavBar, PageHeader, StatusBadge
├── api/                → API client helpers
└── utils/              → Formatters, alert utilities
```

---

## Implemented Modules

### 1. Transaction Module

- Stores financial transactions in the `transactions` table.
- Supports creation, retrieval, update, and deletion of transactions.
- Business identifier `transactionId` is used in API paths.
- Key fields: `accountId`, `payeeId`, `amount`, `currency`, `transactionType`, `transactionTime`, `status`.

### 2. Rule Module

- Stores monitoring rules in the `rules` table.
- Supports full CRUD for rules.
- Rules can be activated or deactivated via the `active` flag.
- Key fields: `ruleName`, `ruleType`, `threshold`, `timeWindowMinutes`, `severity`, `active`.

### 3. Rule Engine

Automatically triggered every time a new transaction is created.

**Flow:**
1. Fetch all active rules from the database.
2. Instantiate the `RuleEngine` with those rules.
3. Evaluate the new transaction against the account's full transaction history.
4. Collect all triggered rule results.

**Supported Rule Types:**

| Rule Type | Aliases Accepted | Behavior |
|---|---|---|
| `AMOUNT_THRESHOLD` | `AMOUNT_THRESHOLD_RULE`, `AMOUNT` | Flags transactions above a set amount |
| `DAILY_LIMIT` | `DAILY_LIMIT_RULE`, `DAILY` | Flags if daily spending exceeds threshold |
| `VELOCITY` | `VELOCITY_RULE` | Flags too many transactions in a time window |
| `NEW_PAYEE` | `NEW_PAYEE_RULE` | Flags transactions to a payee never seen before |

### 4. Alert Module

- An alert is automatically created for every rule triggered by a transaction.
- Alerts are stored in the `alerts` table.
- `alertId` is auto-generated when not provided.
- Severity is validated and must be `LOW`, `MEDIUM`, or `HIGH`.
- Supports manual creation, retrieval, status update, and deletion.

**Alert Lifecycle:**

```
OPEN
 ├──> ACKNOWLEDGED ──> INVESTIGATING ──> CLOSED
 └──> DISMISSED
```

| Transition | Allowed |
|---|---|
| OPEN → ACKNOWLEDGED | ✅ |
| OPEN → DISMISSED | ✅ |
| ACKNOWLEDGED → INVESTIGATING | ✅ |
| INVESTIGATING → CLOSED | ✅ |
| Any other transition | ❌ Rejected |

---

## End-to-End Flow

```
POST /api/transactions/add
        │
        ▼
   Save Transaction
        │
        ▼
   Load Active Rules
        │
        ▼
   RuleEngine.evaluateTriggered()
        │
        ▼
   For each triggered rule → Create Alert (status: OPEN)
        │
        ▼
   Alerts visible at GET /api/alerts
```

---

## Validation and Error Handling

- Required fields are validated on Alert and Rule requests.
- Invalid alert status transitions return a `400 Bad Request` with a clear message.
- Not-found scenarios return `404 Not Found`.
- Alert and transaction timestamps are managed automatically via JPA lifecycle hooks (`@PrePersist`, `@PreUpdate`).

---

## Running the Project

### Backend

```powershell
cd C:\Users\Administrator\108-09-TransactionMonitoringAndAlertsDashboard
.\mvnw.cmd spring-boot:run
```

### Frontend

```powershell
cd C:\Users\Administrator\108-09-TransactionMonitoringAndAlertsDashboard\frontend
npm install
npm start
```

Backend runs on: `http://localhost:8080`  
Frontend runs on: `http://localhost:3000`

---

## Docker and CI/CD

### Build backend image

```powershell
cd C:\Users\Administrator\108-09-TransactionMonitoringAndAlertsDashboard
docker build -t transaction-monitoring-system:local .
```

### Run backend image

```powershell
docker run --rm -p 8080:8080 `
  -e SPRING_DATASOURCE_URL="jdbc:mysql://host.docker.internal:3306/transaction_monitoring?useSSL=false&serverTimezone=UTC" `
  -e SPRING_DATASOURCE_USERNAME="root" `
  -e SPRING_DATASOURCE_PASSWORD="your-password" `
  transaction-monitoring-system:local
```

### Run full local stack (MySQL + backend)

```powershell
docker compose up --build
```

### GitHub Actions workflow

- Workflow file: `.github/workflows/backend-ci-cd.yml`
- CI job runs: Maven tests + Docker image build
- CD job (on `main`) builds and pushes image to Docker Hub

Required repository secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

---

## API Reference

All endpoint details, request bodies, and response formats are documented in:

📄 [`REST_API_DOCUMENTATION.md`](./REST_API_DOCUMENTATION.md)

---

## Task Tracking

Current task completion status and sprint progress are tracked in:

📊 [`Transaction_Monitoring_Project_Task_Tracking.ods`](./Transaction_Monitoring_Project_Task_Tracking.ods)
