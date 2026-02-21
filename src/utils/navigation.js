/**
 * Helper function to handle back navigation with fallback
 * Uses React Router's history to go back, which should work correctly
 * @param {Function} navigate - React Router's navigate function
 * @param {Object} currentUser - Current user object (optional, for fallback)
 * @param {string} fallbackPath - Optional fallback path (defaults to appropriate dashboard)
 */
export const handleBackNavigation = (navigate, currentUser = null, fallbackPath = null) => {
  // Use React Router's navigate(-1) which properly handles browser history
  // This will go back to the previous page in the navigation stack
  navigate(-1);
};
