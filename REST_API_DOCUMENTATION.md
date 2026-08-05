# REST API Documentation

## Overview

This document inventories the REST API endpoints that are actually implemented in this repository.

### Scope and method

- Source of truth: backend controller annotations in `src/main/java/com/neueda/controller/`.
- Verified against the corresponding service and repository implementations.
- Cross-checked with frontend API client code in `frontend/src/api/` and usage in `frontend/src/App.js`.
- Only endpoints that exist in code are documented here.
- Endpoints requested in product/UI copy but not implemented in code are listed explicitly as missing.

### Base path

The frontend uses `http://localhost:8080/api` as its default API base URL from `frontend/src/constants.js`, so backend controller mappings under `/api/...` are the effective REST base paths.

### Resource groups

- Transactions
- Rules
- Alerts
- Other / Admin / Health / Data Generator routes
- Frontend API coverage
- Swagger / OpenAPI status

---

## Transactions

**Implemented backend controller:** `src/main/java/com/neueda/controller/TransactionController.java`

**Frontend client coverage:** `frontend/src/api/transactionsApi.js`

**What exists:** CRUD-style transaction endpoints only.

**What does not exist:** no dedicated filter/search/list-by-query endpoints. There is no `@RequestParam` usage for transactions anywhere in backend code.

| Method | Path | Handler file + function name | Request body/params (with types) | Response shape (with types) | Status codes returned |
|---|---|---|---|---|---|
| GET | `/api/transactions` | `src/main/java/com/neueda/controller/TransactionController.java` → `getAllTransactions()` | No body. No path params. No query params. | `Transaction[]`, where `Transaction = { id: Long, transactionId: String, accountId: String, payeeId: String, amount: Double, currency: String, transactionType: String, transactionTime: LocalDateTime, description: String, status: String }` | `200 OK` |
| GET | `/api/transactions/{transactionId}` | `src/main/java/com/neueda/controller/TransactionController.java` → `getTransaction(String transactionId)` | Path: `transactionId: String` | `Transaction { id: Long, transactionId: String, accountId: String, payeeId: String, amount: Double, currency: String, transactionType: String, transactionTime: LocalDateTime, description: String, status: String }` | `200 OK`; `500 Internal Server Error` if not found (`RuntimeException("Transaction not found")`) |
| POST | `/api/transactions/add` | `src/main/java/com/neueda/controller/TransactionController.java` → `addTransaction(Transaction transaction)` | Body: `Transaction { id?: Long, transactionId: String, accountId: String, payeeId: String, amount: Double, currency: String, transactionType: String, transactionTime: LocalDateTime, description?: String, status: String }` | `Transaction { id: Long, transactionId: String, accountId: String, payeeId: String, amount: Double, currency: String, transactionType: String, transactionTime: LocalDateTime, description: String, status: String }` | `200 OK` |
| PUT | `/api/transactions/{transactionId}` | `src/main/java/com/neueda/controller/TransactionController.java` → `updateTransaction(String transactionId, Transaction transaction)` | Path: `transactionId: String`; Body: `Transaction { id?: Long, transactionId?: String, accountId: String, payeeId: String, amount: Double, currency: String, transactionType: String, transactionTime: LocalDateTime, description?: String, status: String }` | Updated `Transaction { id: Long, transactionId: String, accountId: String, payeeId: String, amount: Double, currency: String, transactionType: String, transactionTime: LocalDateTime, description: String, status: String }` | `200 OK`; `500 Internal Server Error` if not found |
| DELETE | `/api/transactions/{transactionId}` | `src/main/java/com/neueda/controller/TransactionController.java` → `deleteTransaction(String transactionId)` | Path: `transactionId: String` | `String` literal: `"Transaction deleted successfully"` | `200 OK`; `500 Internal Server Error` if not found |

### Call chains

- `GET /api/transactions` → `TransactionController.getAllTransactions()` → `TransactionService.getAllTransactions()` → `TransactionRepository.findAll()`
- `GET /api/transactions/{transactionId}` → `TransactionController.getTransaction()` → `TransactionService.getTransactionById()` → `TransactionRepository.findByTransactionId(String)`
- `POST /api/transactions/add` → `TransactionController.addTransaction()` → `TransactionService.addTransaction()` → `TransactionRepository.save(Transaction)` → `RuleRepository.findByActiveTrue()` → `RuleEngine.evaluateTriggered(...)` → `TransactionRepository.findByAccountId(String)` → `AlertService.createAlert()` → `AlertRepository.save(Alert)` when one or more rules trigger
- `PUT /api/transactions/{transactionId}` → `TransactionController.updateTransaction()` → `TransactionService.updateTransaction()` → `TransactionRepository.findByTransactionId(String)` → `TransactionRepository.save(Transaction)`
- `DELETE /api/transactions/{transactionId}` → `TransactionController.deleteTransaction()` → `TransactionService.deleteTransaction()` → `TransactionRepository.findByTransactionId(String)` → `TransactionRepository.delete(Transaction)`

### Frontend mappings

- `transactionsApi.getAll()` → `GET /api/transactions`
- `transactionsApi.getByTransactionId(transactionId)` → `GET /api/transactions/{transactionId}`
- `transactionsApi.create(payload)` → `POST /api/transactions/add`
- `transactionsApi.update(transactionId, payload)` → `PUT /api/transactions/{transactionId}`
- `transactionsApi.remove(transactionId)` → `DELETE /api/transactions/{transactionId}`

---

## Rules

**Implemented backend controller:** `src/main/java/com/neueda/controller/RuleController.java`

**Frontend client coverage:** `frontend/src/api/rulesApi.js`

**What exists:** create, list, get by id, update, and delete.

**What does not exist:** no separate enable/disable endpoint. Rule activation is only changed through `PUT /api/rules/{id}` by sending the `active: Boolean` field in the request body.

| Method | Path | Handler file + function name | Request body/params (with types) | Response shape (with types) | Status codes returned |
|---|---|---|---|---|---|
| POST | `/api/rules` | `src/main/java/com/neueda/controller/RuleController.java` → `createRule(RuleRequest request)` | Body: `RuleRequest { ruleName: String, ruleType: String, threshold: Double, timeWindowMinutes: Integer, severity: String, active: Boolean }` | `RuleResponse { id: Long, ruleName: String, ruleType: String, threshold: Double, timeWindowMinutes: Integer, severity: String, active: Boolean }` | `201 Created`; `500 Internal Server Error` if a rule with the same name already exists (`RuntimeException("Rule already exists.")`) |
| GET | `/api/rules` | `src/main/java/com/neueda/controller/RuleController.java` → `getAllRules()` | No body. No path params. No query params. | `RuleResponse[]`, where `RuleResponse = { id: Long, ruleName: String, ruleType: String, threshold: Double, timeWindowMinutes: Integer, severity: String, active: Boolean }` | `200 OK` |
| GET | `/api/rules/{id}` | `src/main/java/com/neueda/controller/RuleController.java` → `getRuleById(Long id)` | Path: `id: Long` | `RuleResponse { id: Long, ruleName: String, ruleType: String, threshold: Double, timeWindowMinutes: Integer, severity: String, active: Boolean }` | `200 OK`; `500 Internal Server Error` if not found (`RuntimeException("Rule not found")`) |
| PUT | `/api/rules/{id}` | `src/main/java/com/neueda/controller/RuleController.java` → `updateRule(Long id, RuleRequest request)` | Path: `id: Long`; Body: `RuleRequest { ruleName: String, ruleType: String, threshold: Double, timeWindowMinutes: Integer, severity: String, active: Boolean }` | Updated `RuleResponse { id: Long, ruleName: String, ruleType: String, threshold: Double, timeWindowMinutes: Integer, severity: String, active: Boolean }` | `200 OK`; `500 Internal Server Error` if not found |
| DELETE | `/api/rules/{id}` | `src/main/java/com/neueda/controller/RuleController.java` → `deleteRule(Long id)` | Path: `id: Long` | `String` literal: `"Rule deleted successfully."` | `200 OK`; `500 Internal Server Error` if not found |

### Call chains

- `POST /api/rules` → `RuleController.createRule()` → `RuleService.createRule()` → `RuleRepository.existsByRuleName(String)` → `RuleRepository.save(Rule)`
- `GET /api/rules` → `RuleController.getAllRules()` → `RuleService.getAllRules()` → `RuleRepository.findAll()`
- `GET /api/rules/{id}` → `RuleController.getRuleById()` → `RuleService.getRuleById()` → `RuleRepository.findById(Long)`
- `PUT /api/rules/{id}` → `RuleController.updateRule()` → `RuleService.updateRule()` → `RuleRepository.findById(Long)` → `RuleRepository.save(Rule)`
- `DELETE /api/rules/{id}` → `RuleController.deleteRule()` → `RuleService.deleteRule()` → `RuleRepository.findById(Long)` → `RuleRepository.delete(Rule)`

### Frontend mappings

- `rulesApi.getAll()` → `GET /api/rules`
- `rulesApi.getById(id)` → `GET /api/rules/{id}`
- `rulesApi.create(payload)` → `POST /api/rules`
- `rulesApi.update(id, payload)` → `PUT /api/rules/{id}`
- `rulesApi.remove(id)` → `DELETE /api/rules/{id}`

---

## Alerts

**Implemented backend controller:** `src/main/java/com/neueda/controller/AlertController.java`

**Frontend client coverage:** none. There is no `frontend/src/api/alertsApi.js`.

**What exists:** create, list, get by id, update status, and delete.

**What does not exist:** no separate endpoints for acknowledge, investigate, close, dismiss, alert history, or get triggering transactions. Status transitions are all funneled through `PUT /api/alerts/{id}/status`.

| Method | Path | Handler file + function name | Request body/params (with types) | Response shape (with types) | Status codes returned |
|---|---|---|---|---|---|
| POST | `/api/alerts` | `src/main/java/com/neueda/controller/AlertController.java` → `createAlert(AlertRequest request)` | Body: `AlertRequest { alertId?: String, transactionId: Long, ruleId: Long, severity: String, status?: String }`; validation: `transactionId` = `@NotNull`, `ruleId` = `@NotNull`, `severity` = `@NotBlank` | `AlertResponse { id: Long, alertId: String, transactionId: Long, ruleId: Long, severity: String, status: String, createdAt: LocalDateTime, updatedAt: LocalDateTime }` | `201 Created`; `400 Bad Request` for bean-validation failure, invalid severity, or invalid initial status |
| GET | `/api/alerts` | `src/main/java/com/neueda/controller/AlertController.java` → `getAllAlerts()` | No body. No path params. No query params. | `AlertResponse[]`, where `AlertResponse = { id: Long, alertId: String, transactionId: Long, ruleId: Long, severity: String, status: String, createdAt: LocalDateTime, updatedAt: LocalDateTime }` | `200 OK` |
| GET | `/api/alerts/{id}` | `src/main/java/com/neueda/controller/AlertController.java` → `getAlertById(Long id)` | Path: `id: Long` | `AlertResponse { id: Long, alertId: String, transactionId: Long, ruleId: Long, severity: String, status: String, createdAt: LocalDateTime, updatedAt: LocalDateTime }` | `200 OK`; `404 Not Found` if alert does not exist |
| PUT | `/api/alerts/{id}/status` | `src/main/java/com/neueda/controller/AlertController.java` → `updateAlertStatus(Long id, AlertStatusRequest request)` | Path: `id: Long`; Body: `AlertStatusRequest { status: String }`; validation: `status` = `@NotBlank` | Updated `AlertResponse { id: Long, alertId: String, transactionId: Long, ruleId: Long, severity: String, status: String, createdAt: LocalDateTime, updatedAt: LocalDateTime }` | `200 OK`; `400 Bad Request` for blank status, invalid status, same-status update, or invalid status transition; `404 Not Found` if alert does not exist |
| DELETE | `/api/alerts/{id}` | `src/main/java/com/neueda/controller/AlertController.java` → `deleteAlert(Long id)` | Path: `id: Long` | No response body | `204 No Content`; `404 Not Found` if alert does not exist |

### Call chains

- `POST /api/alerts` → `AlertController.createAlert()` → `AlertService.createAlert()` → `AlertRepository.save(Alert)`
- `GET /api/alerts` → `AlertController.getAllAlerts()` → `AlertService.getAllAlerts()` → `AlertRepository.findAll()`
- `GET /api/alerts/{id}` → `AlertController.getAlertById()` → `AlertService.getAlertById()` → `AlertService.findAlertById()` → `AlertRepository.findById(Long)`
- `PUT /api/alerts/{id}/status` → `AlertController.updateAlertStatus()` → `AlertService.updateAlertStatus()` → `AlertService.findAlertById()` → `AlertRepository.findById(Long)` → `AlertRepository.save(Alert)`
- `DELETE /api/alerts/{id}` → `AlertController.deleteAlert()` → `AlertService.deleteAlert()` → `AlertService.findAlertById()` → `AlertRepository.findById(Long)` → `AlertRepository.delete(Alert)`

### Status transition rules implemented in service code

- `OPEN` → `ACKNOWLEDGED` or `DISMISSED`
- `ACKNOWLEDGED` → `INVESTIGATING`
- `INVESTIGATING` → `CLOSED`
- `CLOSED` → no further transitions
- `DISMISSED` → no further transitions

These rules are enforced in `src/main/java/com/neueda/service/AlertService.java` by `validateStatusTransition(...)`.

---

## Other / Admin / Health / Data Generator Routes

No additional implemented REST endpoints were found for:

- health checks
- admin routes
- data generator or seed routes
- search/filter-only endpoints
- dedicated alert workflow routes beyond `PUT /api/alerts/{id}/status`

### Evidence

- Only three backend REST controllers exist in `src/main/java/com/neueda/controller/`: `TransactionController`, `RuleController`, and `AlertController`.
- No other controller classes with `@RestController` or `@Controller` were found.
- No additional `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping`, or `@RequestMapping` annotations were found outside those three controllers.
- No `@RequestParam` usage exists in backend code, so query-based filter/search endpoints are not implemented.

---

## Frontend API Coverage

### Shared API client

- `frontend/src/api/apiClient.js` exports `apiRequest(path, options)`.
- `apiRequest(...)` calls `fetch(`${API_BASE_URL}${path}`, ...)`.
- `API_BASE_URL` is defined in `frontend/src/constants.js` as `process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'`.

### Transactions coverage

- `frontend/src/api/transactionsApi.js` covers all implemented transaction endpoints:
  - `getAll()` → `GET /api/transactions`
  - `getByTransactionId(transactionId)` → `GET /api/transactions/{transactionId}`
  - `create(payload)` → `POST /api/transactions/add`
  - `update(transactionId, payload)` → `PUT /api/transactions/{transactionId}`
  - `remove(transactionId)` → `DELETE /api/transactions/{transactionId}`
- These methods are used from `frontend/src/App.js`.

### Rules coverage

- `frontend/src/api/rulesApi.js` covers all implemented rule endpoints:
  - `getAll()` → `GET /api/rules`
  - `getById(id)` → `GET /api/rules/{id}`
  - `create(payload)` → `POST /api/rules`
  - `update(id, payload)` → `PUT /api/rules/{id}`
  - `remove(id)` → `DELETE /api/rules/{id}`
- These methods are used from `frontend/src/App.js`.

### Alerts coverage gap

- There is no `frontend/src/api/alertsApi.js`.
- `frontend/src/pages/AlertsPage.jsx` does not call backend alert endpoints.
- The page derives alerts locally from transaction/rule data using `deriveAlertsFromData(...)` from `frontend/src/utils/alerts.js`.
- The page subtitle explicitly states: `Live backend alert endpoints are not available yet; this page uses derived alerts for now`.

### Coverage summary

| Resource | Backend endpoints implemented | Frontend API wrapper present | Frontend actively uses backend endpoints |
|---|---:|---|---|
| Transactions | 5 | Yes | Yes |
| Rules | 5 | Yes | Yes |
| Alerts | 5 | No | No |

---

## Swagger / OpenAPI

There is no usable Swagger/OpenAPI specification file in this repository.

### What was checked

- `src/main/java/com/neueda/config/SwaggerConfig.java` exists but is empty.
- No `openapi.yaml`, `openapi.yml`, `openapi.json`, or Swagger spec files were found in the workspace.
- `pom.xml` does not include `springdoc`, `springfox`, or other Swagger/OpenAPI dependencies.

### Conclusion

This document is derived directly from implemented controller, service, repository, and frontend client code rather than from a checked-in or generated OpenAPI/Swagger specification.





