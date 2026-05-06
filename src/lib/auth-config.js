export const AUTH_COOKIE_NAME = 'meddocs_session';

export function getAuthSecret() {
  return process.env.MEDDOCS_AUTH_SECRET || 'meddocs-dev-only-change-MEDDOCS_AUTH_SECRET-in-prod';
}

export function getExpectedCredentials() {
  const email = (process.env.MEDDOCS_LOGIN_EMAIL || 'demo@meddocs.app').trim().toLowerCase();
  const password = process.env.MEDDOCS_LOGIN_PASSWORD || 'demo1234';
  return { email, password };
}
