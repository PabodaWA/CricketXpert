import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/certificates';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Check certificate eligibility for an enrollment
export const checkCertificateEligibility = async (enrollmentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/eligibility/${enrollmentId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking certificate eligibility:', error);
    throw error;
  }
};

// Generate certificate for an enrollment
export const generateCertificate = async (enrollmentId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate/${enrollmentId}`, {}, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
};

// Download certificate PDF
export const downloadCertificate = async (certificateId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/download/${certificateId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading certificate:', error);
    throw error;
  }
};

// Get user's certificates
export const getUserCertificates = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user certificates:', error);
    throw error;
  }
};

// Verify certificate (public endpoint)
export const verifyCertificate = async (certificateNumber) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/verify/${certificateNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error verifying certificate:', error);
    throw error;
  }
};
