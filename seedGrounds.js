import mongoose from 'mongoose';
import Ground from './models/Ground.js';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cricket-coaching', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleGrounds = [
 
  {
    name: 'Practice Ground A',
    location: 'Sports Complex, East Wing',
    pricePerSlot: 30,
    description: 'Smaller practice ground for training sessions',
    totalSlots: 8,
    facilities: ['parking', 'changing_room'],
    equipment: ['nets', 'balls'],
    isActive: true
  },
  
];

async function seedGrounds() {
  try {
    // Clear existing grounds
    await Ground.deleteMany({});
    console.log('Cleared existing grounds');

    // Insert sample grounds
    const createdGrounds = await Ground.insertMany(sampleGrounds);
    console.log(`Created ${createdGrounds.length} grounds`);

    // Display created grounds
    createdGrounds.forEach(ground => {
      console.log(`- ${ground.name}: $${ground.pricePerSlot}/slot (${ground.totalSlots} slots)`);
    });

    console.log('Ground seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding grounds:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedGrounds();

