import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/feedback';

export const getAllFeedbacks = () => axios.get(BASE_URL);
export const getCustomerFeedbacks = (customerId) => axios.get(`${BASE_URL}/customer/${customerId}`);
export const createFeedback = (data) => axios.post(BASE_URL, data);
export const updateFeedback = (id, data) => axios.put(`${BASE_URL}/${id}`, data);
export const deleteFeedback = (id) => axios.delete(`${BASE_URL}/${id}`);
