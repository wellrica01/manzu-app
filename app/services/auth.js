import { apiRequest } from './api';

export async function login(email, password) {
  // Adjust endpoint as needed for your backend
  return apiRequest('/auth/login', 'POST', { email, password });
}

export async function register(pharmacy, user) {
  // Calls /auth/register with { pharmacy, user }
  return apiRequest('/auth/register', 'POST', { pharmacy, user });
} 