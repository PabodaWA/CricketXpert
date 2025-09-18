const express = require('express');
const router = express.Router();
const Coach = require('../models/Coach');
const CoachingProgram = require('../models/CoachingProgram');

// @desc    Sync coach programs - fix the relationship between coaches and programs
// @route   POST /api/sync/coach-programs
// @access  Public (for development)
const syncCoachPrograms = async (req, res) => {
  try {
    console.log('🔄 Starting sync of coach programs...');
    
    // Get all coaches
    const coaches = await Coach.find({});
    console.log(`Found ${coaches.length} coaches`);
    
    // Get all programs
    const programs = await CoachingProgram.find({}).populate('coach');
    console.log(`Found ${programs.length} programs`);
    
    let updatedCoaches = 0;
    const syncResults = [];
    
    for (const coach of coaches) {
      // Find all programs that have this coach as their coach
      const coachPrograms = programs.filter(program => 
        program.coach && program.coach._id.toString() === coach._id.toString()
      );
      
      const coachResult = {
        coachId: coach._id,
        programsFound: coachPrograms.length,
        existingAssigned: coach.assignedPrograms.length,
        programsAdded: 0
      };
      
      if (coachPrograms.length > 0) {
        // Get the program IDs that should be in assignedPrograms
        const programIds = coachPrograms.map(p => p._id);
        
        // Check if there are any missing programs in assignedPrograms
        const missingPrograms = programIds.filter(programId => 
          !coach.assignedPrograms.some(assignedId => 
            assignedId.toString() === programId.toString()
          )
        );
        
        if (missingPrograms.length > 0) {
          console.log(`🔧 Adding ${missingPrograms.length} missing programs to coach ${coach._id}`);
          
          // Add missing programs to assignedPrograms
          coach.assignedPrograms.push(...missingPrograms);
          await coach.save();
          updatedCoaches++;
          coachResult.programsAdded = missingPrograms.length;
        }
      }
      
      syncResults.push(coachResult);
    }
    
    console.log(`🎉 Sync completed! Updated ${updatedCoaches} coaches`);
    
    // Return verification data
    const verificationData = await Coach.find({})
      .populate('assignedPrograms', 'title category specialization')
      .populate('userId', 'firstName lastName');
    
    res.status(200).json({
      success: true,
      message: `Sync completed successfully. Updated ${updatedCoaches} coaches.`,
      data: {
        totalCoaches: coaches.length,
        totalPrograms: programs.length,
        updatedCoaches,
        syncResults,
        verification: verificationData.map(coach => ({
          coachId: coach._id,
          name: `${coach.userId?.firstName || ''} ${coach.userId?.lastName || ''}`.trim(),
          assignedPrograms: coach.assignedPrograms.map(program => ({
            id: program._id,
            title: program.title,
            category: program.category,
            specialization: program.specialization
          }))
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
    res.status(500).json({
      success: false,
      message: 'Error during sync',
      error: error.message
    });
  }
};

router.post('/coach-programs', syncCoachPrograms);

module.exports = router;


