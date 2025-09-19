import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/technicians';

// Get all technicians
export const getAllTechnicians = () => {
  return axios.get(BASE_URL);
};

// Create a new technician
export const createTechnician = (data) => {
  return axios.post(BASE_URL, data);
};

// Get technician by ID
export const getTechnicianById = (id) => {
  return axios.get(`${BASE_URL}/${id}`);
};

// Update technician info
export const updateTechnician = (id, data) => {
  return axios.put(`${BASE_URL}/${id}`, data);
};

// Delete technician
export const deleteTechnician = (id) => {
  return axios.delete(`${BASE_URL}/${id}`);
};
