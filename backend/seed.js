import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Book } from './models/index.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data (be careful with this in production!)
    if (process.env.NODE_ENV !== 'production') {
      await User.deleteMany({});
      await Book.deleteMany({});
      console.log('Cleared existing data');
    }

    // Create sample users
    const sampleUsers = [
      {
        username: 'bookworm',
        email: 'bookworm@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Reader',
        favoriteGenres: ['fiction', 'mystery', 'sci-fi']
      },
      {
        username: 'literaturelover',
        email: 'lit@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Scholar',
        favoriteGenres: ['classic', 'philosophy', 'history']
      }
    ];

    const createdUsers = await User.create(sampleUsers);
    console.log(`Created ${createdUsers.length} sample users`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();