// pos.js - Service for PoS operations

import { apiRequest } from './api';

// Record a new sale via backend
export async function recordSale(sale, token) {
  // POST to /pharmacy/sales
  return apiRequest('/pharmacy/sales', 'POST', sale, token);
}

// Fetch today's sales via backend
export async function fetchSalesHistory(token, date) {
  // Default to today if no date provided
  const today = date || new Date().toISOString().slice(0, 10);
  const res = await apiRequest(`/pharmacy/sales?date=${today}`, 'GET', undefined, token);
  return res.sales || [];
} 