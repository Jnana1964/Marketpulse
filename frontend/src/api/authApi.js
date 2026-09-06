import apiClient from './apiClient';

export async function signup({ name, email, password }) {
  const { data } = await apiClient.post('/auth/signup', { name, email, password });
  return data.data;
}

export async function login({ email, password }) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data.data;
}

export async function fetchMe() {
  const { data } = await apiClient.get('/auth/me');
  return data.data.user;
}
