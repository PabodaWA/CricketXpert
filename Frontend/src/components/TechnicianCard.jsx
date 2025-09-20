import React from 'react';

const TechnicianCard = ({ tech }) => (
  <div className="bg-brand.light p-3 rounded shadow mb-2">
    <h4 className="text-brand.heading font-bold">{tech.name}</h4>
    <p className="text-brand.body">Specialty: {tech.specialty}</p>
    <p className="text-brand.body">Assigned Tasks: {tech.assignedTasks}</p>
  </div>
);

export default TechnicianCard;
