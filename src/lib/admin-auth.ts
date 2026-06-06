import { ADMIN_AUTH_KEY, ADMIN_PASSWORD } from "./constants";

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_AUTH_KEY) === "1";
}

export function loginAdmin(password: string): boolean {
  if (password !== ADMIN_PASSWORD) return false;
  localStorage.setItem(ADMIN_AUTH_KEY, "1");
  return true;
}

export function logoutAdmin(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_AUTH_KEY);
}
