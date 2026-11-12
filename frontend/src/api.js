import axios from 'axios';
export const ipPublica = import.meta.env.VITE_PUBLIC_URL || 'https://adventurers-hub.duckdns.org'
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${ipPublica}/api`
});
export const ipFoundry = import.meta.env.VITE_FOUNDRY_URL || '201.188.22.11:30000'
