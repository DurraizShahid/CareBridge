/**
 * Shared API fetch wrapper and session expiry handler.
 * When any API endpoint returns 401 Unauthorized (session expired),
 * redirects to /sign-in preserving the current URL as redirect_url.
 */

export function handle401() {
  if (typeof window === "undefined") return;
  try {
    const currentPath = window.location.pathname + window.location.search;
    if (window.location.pathname.startsWith("/sign-in")) return;
    const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(currentPath)}`;
    if (typeof window.location.assign === "function") {
      window.location.assign(signInUrl);
    } else {
      window.location.href = signInUrl;
    }
  } catch {
    // In test environments where jsdom blocks navigation
  }
}

/**
 * Fetch wrapper that intercepts 401 responses and triggers sign-in redirection.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401) {
    handle401();
  }
  return response;
}

/**
 * Installs a global interceptor on window.fetch in the browser so that
 * any API call on mounted screens returning 401 automatically redirects.
 */
export function installGlobal401Handler() {
  if (typeof window === "undefined") return;
  const win = window as unknown as { __cb_401_handler_installed?: boolean };
  if (win.__cb_401_handler_installed) return;
  win.__cb_401_handler_installed = true;

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await originalFetch.apply(this, args);
    if (res.status === 401) {
      handle401();
    }
    return res;
  };
}
