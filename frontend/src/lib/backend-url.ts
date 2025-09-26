/**
 * Get the correct backend URL for server-side API calls
 * In Docker containers, this should use the internal service name
 * In development, this can use localhost
 */
export function getBackendUrl(): string {
  return process.env.BACKEND_URL || 'http://localhost:3001';
}

/**
 * Get the full backend API URL for server-side calls
 */
export function getBackendApiUrl(endpoint: string = ''): string {
  const baseUrl = getBackendUrl();
  return `${baseUrl}/api${endpoint}`;
}
