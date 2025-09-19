import React, { useEffect, useState } from 'react';
import { createFeedback, getCustomerFeedbacks } from '../api/feedbackApi';

const FeedbackPage = ({ customer }) => {
  const [description, setDescription] = useState('');
  const [feedbacks, setFeedbacks] = useState([]);

  const fetchFeedbacks = async () => {
    const res = await getCustomerFeedbacks(customer._id);
    setFeedbacks(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createFeedback({ customerId: customer._id, description, requestType: 'RepairRequest' });
      setDescription('');
      fetchFeedbacks();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-[#000000]">Submit Feedback</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write your feedback"
          className="p-2 border border-gray-300 rounded"
          required
        />
        <button type="submit" className="bg-[#42ADF5] hover:bg-[#2C8ED1] text-white px-4 py-2 rounded">Submit</button>
      </form>
      <h3 className="text-lg font-semibold mb-2 text-[#000000]">My Feedbacks</h3>
      {feedbacks.map(f => (
        <div key={f._id} className="bg-white p-3 rounded shadow mb-2">
          <p>{f.description}</p>
          <p>Status: {f.status}</p>
          <p>Response: {f.response || 'N/A'}</p>
        </div>
      ))}
    </div>
  );
};

export default FeedbackPage;
