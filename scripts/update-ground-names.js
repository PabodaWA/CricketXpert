import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Import models
import Ground from '../models/Ground.js';
import Session from '../models/Session.js';

async function updateGroundNames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all grounds
    const grounds = await Ground.find({});
    console.log('Found grounds:', grounds.map(g => ({ id: g._id, name: g.name })));

    // Find the "Main Cricket Ground" or similar
    const mainGround = await Ground.findOne({ 
      $or: [
        { name: 'Main Cricket Ground' },
        { name: 'Default Cricket Ground' },
        { name: /main/i },
        { name: /default/i }
      ]
    });

    if (mainGround) {
      console.log('Found ground to update:', mainGround.name);
      
      // Update the ground name
      mainGround.name = 'Practice Ground A';
      mainGround.description = 'Practice ground for cricket coaching sessions';
      mainGround.facilities = ['parking', 'changing_room', 'coaching_area'];
      mainGround.equipment = ['nets', 'balls', 'bats', 'coaching_equipment'];
      mainGround.totalSlots = 12;
      
      await mainGround.save();
      console.log('✅ Updated ground to Practice Ground A');
    } else {
      console.log('No ground found to update');
    }

    // Check if Practice Ground A already exists
    let practiceGround = await Ground.findOne({ name: 'Practice Ground A' });
    if (!practiceGround) {
      console.log('Creating Practice Ground A...');
      practiceGround = new Ground({
        name: 'Practice Ground A',
        location: 'Main Sports Complex',
        pricePerSlot: 50,
        description: 'Practice ground for cricket coaching sessions',
        totalSlots: 12,
        facilities: ['parking', 'changing_room', 'coaching_area'],
        equipment: ['nets', 'balls', 'bats', 'coaching_equipment'],
        isActive: true
      });
      await practiceGround.save();
      console.log('✅ Created Practice Ground A');
    } else {
      console.log('✅ Practice Ground A already exists');
    }

    // Find all sessions
    const sessions = await Session.find({}).populate('ground');
    console.log(`Found ${sessions.length} sessions`);

    // Update sessions that are using the wrong ground
    let updatedCount = 0;
    for (const session of sessions) {
      if (session.ground && (
        session.ground.name === 'Main Cricket Ground' ||
        session.ground.name === 'Default Cricket Ground' ||
        session.ground.name.includes('Main') ||
        session.ground.name.includes('Default')
      )) {
        session.ground = practiceGround._id;
        await session.save();
        updatedCount++;
        console.log(`Updated session ${session._id} to use Practice Ground A`);
      }
    }

    console.log(`✅ Updated ${updatedCount} sessions to use Practice Ground A`);

    // Final check
    const finalSessions = await Session.find({}).populate('ground');
    console.log('Final session grounds:');
    finalSessions.forEach(session => {
      console.log(`Session ${session._id}: ${session.ground?.name || 'No ground'}`);
    });

  } catch (error) {
    console.error('Error updating ground names:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the migration
updateGroundNames();
