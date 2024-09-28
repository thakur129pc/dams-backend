import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

export const dbConnection = () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('MongoDB URI is not defined in environment variables');
    process.exit(1); 
  }

  return mongoose.connect(mongoURI, { dbName: 'DAMS_Project_Innobles' }) 
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch(err => {
      console.error('MongoDB connection error:', err.message);
      console.error(err.stack);
      throw err;  
    });
};


