// Utility function to get current logged-in user information
export const getCurrentUser = () => {
  try {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      return null;
    }
    return JSON.parse(userInfo);
  } catch (error) {
    console.error('Error parsing user info:', error);
    return null;
  }
};

// Utility function to get current user ID
export const getCurrentUserId = () => {
  const user = getCurrentUser();
  if (!user) {
    console.warn('No user logged in. Please log in to continue.');
    return null;
  }
  return user._id;
};

// Utility function to check if user is logged in
export const isLoggedIn = () => {
  const user = getCurrentUser();
  return user && user.token;
};

// Utility function to get user role
export const getCurrentUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};
