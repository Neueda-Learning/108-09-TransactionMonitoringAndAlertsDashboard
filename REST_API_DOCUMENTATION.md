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

_To be documented in the next commit._

---

## Other / Admin / Health / Data Generator Routes

_To be documented in the next commit._

---

## Frontend API Coverage

_To be documented in the next commit._

---

## Swagger / OpenAPI

_To be documented in the next commit._



