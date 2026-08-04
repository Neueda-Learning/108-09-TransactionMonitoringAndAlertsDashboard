# Transaction Monitoring Frontend

Frontend dashboard for the training project `108-09-TransactionMonitoringAndAlertsDashboard`.

## What this UI supports now

- Dashboard summary cards and recent transactions
- Transactions CRUD with search/filter
- Rules CRUD with active/inactive and severity
- Alerts screen with **derived alerts** from amount-threshold rules until backend alert APIs are added
- Alert lifecycle actions in UI state: `OPEN -> ACKNOWLEDGED -> INVESTIGATING -> CLOSED`, plus dismiss from acknowledged/investigating

## Backend API assumptions

This frontend is aligned to your current Spring Boot endpoints:

- `GET /api/transactions`
- `GET /api/transactions/{transactionId}`
- `POST /api/transactions/add`
- `PUT /api/transactions/{transactionId}`
- `DELETE /api/transactions/{transactionId}`
- `GET /api/rules`
- `GET /api/rules/{id}`
- `POST /api/rules`
- `PUT /api/rules/{id}`
- `DELETE /api/rules/{id}`

## Configuration

Set API base URL with environment variable (optional):

- `REACT_APP_API_BASE_URL` (default: `http://localhost:8080/api`)

Create `.env` in `frontend` if needed:

```env
REACT_APP_API_BASE_URL=http://localhost:8080/api
```

## Run

```powershell
Set-Location "C:\Users\Administrator\108-09-TransactionMonitoringAndAlertsDashboard\frontend"
npm install
npm start
```

## Test

```powershell
Set-Location "C:\Users\Administrator\108-09-TransactionMonitoringAndAlertsDashboard\frontend"
npm test -- --watchAll=false
```

## Next backend enhancements to unlock full UI

1. Add persistent `Alert` entity/repository/service/controller.
2. Add endpoints for alert list/details/lifecycle transitions/history.
3. Return triggered-alert links from transaction processing.
4. Optionally add websocket/SSE for real-time dashboard updates.
