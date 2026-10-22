import readline from 'readline';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const ask = (question) => new Promise((resolve) => {
  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  input.question(question, (answer) => {
    input.close();
    resolve(answer.trim());
  });
});

const askHidden = (question) => new Promise((resolve) => {
  const stdin = process.stdin;
  const stdout = process.stdout;
  let answer = '';

  stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  const onData = (key) => {
    if (key === '\r' || key === '\n') {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
      stdout.write('\n');
      resolve(answer);
    } else if (key === '\u0003') {
      process.exit(1);
    } else if (key === '\u0008' || key === '\u007f') {
      answer = answer.slice(0, -1);
    } else {
      answer += key;
    }
  };

  stdin.on('data', onData);
});

const createAdmin = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured in .env');
  }

  const email = await ask('Admin email: ');
  const username = await ask('Admin username: ');
  const password = await askHidden('Admin password: ');

  if (!email || !username || password.length < 8) {
    throw new Error('Email and username are required; password must contain at least 8 characters.');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    throw new Error('A user with this email or username already exists. Use the admin promotion flow instead.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    email,
    username,
    passwordHash,
    role: 'admin',
    firstName: 'System',
    lastName: 'Administrator'
  });

  console.log(`Admin account created for ${email}.`);
};

createAdmin()
  .catch((error) => {
    console.error('Admin account creation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
