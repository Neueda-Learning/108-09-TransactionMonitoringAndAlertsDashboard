export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

export const ALERT_STATUS = {
  OPEN: 'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  INVESTIGATING: 'INVESTIGATING',
  CLOSED: 'CLOSED',
  DISMISSED: 'DISMISSED'
};

export const RULE_TYPES = [
  'AMOUNT_THRESHOLD',
  'VELOCITY',
  'NEW_PAYEE',
  'DAILY_LIMIT'
];

export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH'];

