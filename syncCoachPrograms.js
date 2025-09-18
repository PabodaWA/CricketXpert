const mongoose = require('mongoose');
const Coach = require('./models/Coach');
const CoachingProgram = require('./models/CoachingProgram');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const syncCoachPrograms = async () => {
  try {
    console.log('🔄 Starting sync of coach programs...');
    
    // Get all coaches
    const coaches = await Coach.find({});
    console.log(`Found ${coaches.length} coaches`);
    
    // Get all programs
    const programs = await CoachingProgram.find({}).populate('coach');
    console.log(`Found ${programs.length} programs`);
    
    let updatedCoaches = 0;
    
    for (const coach of coaches) {
      // Find all programs that have this coach as their coach
      const coachPrograms = programs.filter(program => 
        program.coach && program.coach._id.toString() === coach._id.toString()
      );
      
      console.log(`\n👨‍🏫 Coach: ${coach._id}`);
      console.log(`   Programs found in CoachingProgram collection: ${coachPrograms.length}`);
      console.log(`   Programs in coach.assignedPrograms: ${coach.assignedPrograms.length}`);
      
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
          console.log(`   🔧 Adding ${missingPrograms.length} missing programs to assignedPrograms`);
          
          // Add missing programs to assignedPrograms
          coach.assignedPrograms.push(...missingPrograms);
          await coach.save();
          updatedCoaches++;
          
          console.log(`   ✅ Updated coach ${coach._id}`);
        } else {
          console.log(`   ✅ Coach already has all programs assigned`);
        }
        
        // List the programs for this coach
        coachPrograms.forEach(program => {
          console.log(`     - ${program.title} (${program._id})`);
        });
      } else {
        console.log(`   ℹ️  No programs found for this coach`);
      }
    }
    
    console.log(`\n🎉 Sync completed!`);
    console.log(`📊 Updated ${updatedCoaches} coaches`);
    
    // Verify the sync worked
    console.log('\n🔍 Verification:');
    const updatedCoachesData = await Coach.find({}).populate('assignedPrograms', 'title');
    
    for (const coach of updatedCoachesData) {
      if (coach.assignedPrograms.length > 0) {
        console.log(`👨‍🏫 Coach ${coach._id} now has ${coach.assignedPrograms.length} assigned programs:`);
        coach.assignedPrograms.forEach(program => {
          console.log(`   - ${program.title}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the sync
syncCoachPrograms();
