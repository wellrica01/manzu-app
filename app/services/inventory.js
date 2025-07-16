// Placeholder for inventory service
import { apiRequest } from './api';

export async function fetchInventory(token) {
  const res = await apiRequest('/pharmacy/medications', 'GET', undefined, token);
  return res.medications || [];
} 