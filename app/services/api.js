// Placeholder for API service
export async function apiRequest(endpoint, method = 'GET', body, token) {
  // Use your computer's local IP and port 5000 for Expo/physical device testing
  const BASE_URL = 'http://192.168.36.67:5000/api'; 
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'API Error');
  return data;
} 