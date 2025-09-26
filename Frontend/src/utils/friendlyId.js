/**
 * Utility function to generate friendly IDs from MongoDB ObjectIds
 * Converts a MongoDB ObjectId to a shorter, more user-friendly format
 */

/**
 * Generates a friendly ID from a MongoDB ObjectId
 * @param {string} mongoId - The MongoDB ObjectId string
 * @returns {string} - A friendly ID (e.g., "USR-ABC123" or "TECH-XYZ789")
 */
export const generateFriendlyId = (mongoId, prefix = 'USR') => {
  if (!mongoId || typeof mongoId !== 'string') {
    return 'N/A';
  }

  // Remove any non-alphanumeric characters and take the last 6 characters
  const cleanId = mongoId.replace(/[^a-zA-Z0-9]/g, '');
  const shortId = cleanId.slice(-6).toUpperCase();
  
  // Create a friendly format: PREFIX-XXXXXX
  return `${prefix}-${shortId}`;
};

/**
 * Generates a friendly ID specifically for users
 * @param {string} mongoId - The MongoDB ObjectId string
 * @returns {string} - A user-friendly ID (e.g., "USR-ABC123")
 */
export const generateUserFriendlyId = (mongoId) => {
  return generateFriendlyId(mongoId, 'USR');
};

/**
 * Generates a friendly ID specifically for technicians
 * @param {string} mongoId - The MongoDB ObjectId string
 * @returns {string} - A technician-friendly ID (e.g., "TECH-XYZ789")
 */
export const generateTechnicianFriendlyId = (mongoId) => {
  return generateFriendlyId(mongoId, 'TECH');
};

/**
 * Generates a friendly ID specifically for customers
 * @param {string} mongoId - The MongoDB ObjectId string
 * @returns {string} - A customer-friendly ID (e.g., "CUST-ABC123")
 */
export const generateCustomerFriendlyId = (mongoId) => {
  return generateFriendlyId(mongoId, 'CUST');
};
