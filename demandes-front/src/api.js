import keycloak from './keycloak.js';

const API = 'http://localhost:8081';

export async function appelerApi(path, options = {}) {
  await keycloak.updateToken(30);
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${keycloak.token}`,
    },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${response.status} ${response.statusText}${message ? ` : ${message}` : ''}`);
  }
  return response.status === 204 ? null : response.json();
}
