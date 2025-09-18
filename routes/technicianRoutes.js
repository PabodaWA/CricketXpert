const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technicianController');

// Create a new technician
router.post('/', technicianController.createTechnician);

// Get all technicians
router.get('/', technicianController.getAllTechnicians);

// Test route to see all technicians
router.get('/test/all', async (req, res) => {
  try {
    const Technician = require('../models/Technician');
    const User = require('../models/User');
    
    const technicians = await Technician.find().populate('technicianId', 'username firstName lastName email');
    const totalTechnicians = await Technician.countDocuments();
    
    res.json({
      message: "Technician routes working",
      totalTechnicians: totalTechnicians,
      allTechnicians: technicians
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to delete first 4 technicians (for cleanup)
router.delete('/cleanup/first-four', async (req, res) => {
  try {
    const Technician = require('../models/Technician');
    
    // Get the first 4 technicians
    const firstFourTechnicians = await Technician.find().limit(4);
    
    if (firstFourTechnicians.length === 0) {
      return res.status(404).json({ message: "No technicians found to delete" });
    }
    
    // Delete them
    const deletedIds = firstFourTechnicians.map(t => t._id);
    await Technician.deleteMany({ _id: { $in: deletedIds } });
    
    res.json({
      message: `Successfully deleted ${firstFourTechnicians.length} technicians`,
      deletedTechnicians: firstFourTechnicians.map(t => ({
        id: t._id,
        technicianId: t.technicianId
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get technician by ID
router.get('/:id', technicianController.getTechnicianById);

// Update technician info
router.put('/:id', technicianController.updateTechnician);

// Delete technician
router.delete('/:id', technicianController.deleteTechnician);

module.exports = router;
