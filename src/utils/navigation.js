/**
 * Helper function to handle back navigation with fallback
 * Uses React Router's history to go back, which should work correctly
 * @param {Function} navigate - React Router's navigate function
 * @param {Object} currentUser - Current user object (optional, for fallback)
 * @param {string} fallbackPath - Optional fallback path (defaults to appropriate dashboard)
 */
export const handleBackNavigation = (navigate, currentUser = null, fallbackPath = null) => {
  if (window.history.state?.idx > 0) {
    navigate(-1);
    return;
  }

  // A directly opened page has no in-app history. Stay in the application.
  const role = currentUser?.role?.toLowerCase();
  const section = window.location.pathname.split('/')[1];
  const dashboardRole = role || section;
  const dashboard = ['admin', 'teacher', 'parent'].includes(dashboardRole)
    ? `/${dashboardRole}/dashboard`
    : '/';
  navigate(fallbackPath || dashboard, { replace: true });
};
