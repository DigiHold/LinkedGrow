// Maintenance mode configuration
// Set to true to enable maintenance mode for non-admin users
export const MAINTENANCE_MODE = true;

// Routes that should always be accessible (even in maintenance mode)
export const MAINTENANCE_ALLOWED_ROUTES = [
  "/sign-in",
  "/api/auth",
  "/maintenance",
  "/_next",
  "/favicon.ico",
];

// Check if a route should be blocked during maintenance
export function isBlockedInMaintenance(pathname: string): boolean {
  if (!MAINTENANCE_MODE) return false;

  return !MAINTENANCE_ALLOWED_ROUTES.some(route =>
    pathname.startsWith(route) || pathname === route
  );
}
