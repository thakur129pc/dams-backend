import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the uploads directory from environment variables
const uploadsDir = process.env.UPLOADS_DIR || 'public/uploads';

// Set storage configuration for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Resolve the uploads directory path dynamically
        cb(null, path.resolve(uploadsDir)); 
    },
    filename: (req, file, cb) => {
        // Create a unique filename with timestamp
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Initialize multer with the defined storage configuration
const upload = multer({ storage });

export default upload;
