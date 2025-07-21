// Placeholder for inventory service
import { apiRequest } from './api';

export async function fetchInventory(token) {
  const res = await apiRequest('/pharmacy/medications', 'GET', undefined, token);
  // Map backend data to include a 'name' property for frontend compatibility
  return (res.medications || []).map(med => ({
    ...med,
    name: med.brandName || med.genericName || '',
  }));
} 