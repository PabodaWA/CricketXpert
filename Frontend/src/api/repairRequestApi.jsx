import axios from 'axios';

const BASE_URL = "http://localhost:5000/api/repairs";
const REPAIRS_BASE_OVERRIDE = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_REPAIRS_BASE ? String(import.meta.env.VITE_REPAIRS_BASE) : '';

// Helper to attempt multiple endpoints until one succeeds
const tryPostEndpoints = async (endpoints, payload) => {
  let lastError;
  for (const url of endpoints) {
    try {
      const res = await axios.post(url, payload);
      if (res && res.status < 400) return res;
    } catch (err) {
      lastError = err;
      if (err?.response?.status && err.response.status >= 500) break;
      continue;
    }
  }
  throw lastError || new Error('All endpoints failed');
};

// Submit a new repair request (robust across backends)
export const submitRepairRequest = (requestData) => {
  const base = REPAIRS_BASE_OVERRIDE || BASE_URL;
  const candidates = [
    `${base}`,  // POST to /api/repairs/ (correct endpoint)
    `${base}/submit`,
    `${base}/create`,
    `${base}/new`,
    // Common alternative bases
    `http://localhost:5000/api/repair-requests`,
    `http://localhost:5000/api/repair-requests/create`,
    `http://localhost:5000/api/requests/repairs`,
    `http://localhost:5000/api/requests`,
    `http://localhost:5000/repairs`,
  ];
  return tryPostEndpoints(candidates, requestData);
};

// Get all repair requests (for service manager)
export const getAllRepairRequests = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return axios.get(`${BASE_URL}${query ? `?${query}` : ''}`);
};

// Get customer-specific requests
export const getCustomerRequests = (customerId) => {
  // Backend route: /api/repairs/dashboard/customer/:customerId
  return axios.get(`${BASE_URL}/dashboard/customer/${customerId}`);
};

// Get technician tasks
export const getTechnicianTasks = (technicianId) => {
  return axios.get(`${BASE_URL}/technician/${technicianId}`);
};

// Update repair status
export const updateRepairStatus = (requestId, statusData) => {
  return axios.put(`${BASE_URL}/status/${requestId}`, statusData);
};

// Update task progress (for technicians)
export const updateTaskProgress = (requestId, progressData) => {
  return axios.put(`${BASE_URL}/progress/${requestId}`, progressData);
};

// Complete a task
export const completeTask = (requestId) => {
  return axios.put(`${BASE_URL}/${requestId}/complete`);
};

// Assign technician to a repair
export const assignTechnician = (requestId, assignmentData) => {
  return axios.put(`${BASE_URL}/assign/${requestId}`, assignmentData);
};

// Send cost estimate to customer
export const sendEstimate = (requestId, estimateData) => {
  return axios.post(`${BASE_URL}/${requestId}/estimate`, estimateData);
};

// Submit customer feedback
export const submitFeedback = (requestId, feedbackData) => {
  return axios.post(`${BASE_URL}/${requestId}/feedback`, feedbackData);
};

// Get all technicians
export const getAllTechnicians = () => {
  return axios.get('http://localhost:5000/api/technicians');
};

// Update a repair request (general fields)
export const updateRepairRequest = (requestId, data) => {
  return axios.put(`${BASE_URL}/${requestId}`, data);
};

// Delete a repair request
export const deleteRepairRequest = (requestId) => {
  return axios.delete(`${BASE_URL}/${requestId}`);
};

// Normalize various backend user shapes into a single object
const normalizeUser = (raw, identifier) => {
  if (!raw) return null;
  const obj = raw.user || raw;
  if (Array.isArray(obj)) {
    const lower = String(identifier).toLowerCase();
    const byExactUsername = obj.find(u => String(u.username || '').toLowerCase() === lower);
    if (byExactUsername) return normalizeUser(byExactUsername, identifier);
    const byExactName = obj.find(u => String((u.name || `${u.firstName || ''} ${u.lastName || ''}`)).trim().toLowerCase() === lower);
    if (byExactName) return normalizeUser(byExactName, identifier);
    const byIncludes = obj.find(u => String(u.username || `${u.firstName || ''} ${u.lastName || ''}` || '').toLowerCase().includes(lower));
    if (byIncludes) return normalizeUser(byIncludes, identifier);
    return null;
  }
  const id = obj.id || obj._id || obj.userId || obj.customerId;
  const name = obj.name || `${obj.firstName || ''} ${obj.lastName || ''}`.trim() || obj.username;
  const email = obj.email || obj.mail;
  const phone = obj.phone || obj.contactNumber || obj.mobile;
  const username = obj.username || obj.userName || obj.login;
  if (!id && !email && !username && !name) return null;
  return { id, name, email, phone, username };
};

// Robust person lookup: tries multiple endpoints using username OR name, GET and POST
export const fetchUserByUsername = async (identifier) => {
  const q = encodeURIComponent(identifier);
  const override = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_USER_LOOKUP_URL ? String(import.meta.env.VITE_USER_LOOKUP_URL) : '';

  const getCandidates = [
    ...(override ? [`${override}?q=${q}`, `${override}?username=${q}`, `${override}?name=${q}`] : []),
    `http://localhost:5000/api/users/check/${q}`,
    `http://localhost:5000/api/users/${q}`,
    `http://localhost:5000/api/users?username=${q}`,
    `http://localhost:5000/api/customers/check/${q}`,
    `http://localhost:5000/api/customers/${q}`,
    `http://localhost:5000/api/customers?username=${q}`,
    `http://localhost:5000/api/users/search?name=${q}`,
    `http://localhost:5000/api/customers/search?name=${q}`,
    `http://localhost:5000/api/users?name=${q}`,
    `http://localhost:5000/api/customers?name=${q}`,
  ];

  const postCandidates = [
    ...(override ? [
      { url: override, body: { q: identifier } },
      { url: override, body: { username: identifier } },
      { url: override, body: { name: identifier } },
    ] : []),
    { url: 'http://localhost:5000/api/users/find', body: { username: identifier } },
    { url: 'http://localhost:5000/api/customers/find', body: { username: identifier } },
    { url: 'http://localhost:5000/api/users/search', body: { name: identifier } },
    { url: 'http://localhost:5000/api/customers/search', body: { name: identifier } },
    { url: 'http://localhost:5000/api/users/find', body: { query: identifier } },
    { url: 'http://localhost:5000/api/customers/find', body: { query: identifier } },
  ];

  let lastError;
  for (const url of getCandidates) {
    try {
      const res = await axios.get(url);
      const user = normalizeUser(res?.data, identifier);
      if (user) return user;
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  for (const { url, body } of postCandidates) {
    try {
      const res = await axios.post(url, body);
      const user = normalizeUser(res?.data, identifier);
      if (user) return user;
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw lastError || new Error('User not found');
};

// Legacy helper
export const checkUsername = (username) => {
  return axios.get(`http://localhost:5000/api/users/check/${username}`);
};

// Download repair report
export const downloadRepairReport = (requestId) => {
  // Backend route: /api/repairs/report/download/:id
  return axios.get(`${BASE_URL}/report/download/${requestId}`, {
    responseType: 'blob'
  });
};

// Customer decision on estimate
export const customerDecision = (requestId, decision) => {
  return axios.put(`${BASE_URL}/customer-decision/${requestId}`, { decision });
};

// Get repair statistics
export const getRepairStats = () => {
  return axios.get(`${BASE_URL}/stats`);
};

// Search repair requests
export const searchRepairRequests = (searchTerm) => {
  return axios.get(`${BASE_URL}/search?q=${searchTerm}`);
};

// Filter repair requests by status
export const filterRepairRequests = (status) => {
  return axios.get(`${BASE_URL}/filter?status=${status}`);
};
