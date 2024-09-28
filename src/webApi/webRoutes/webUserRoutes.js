import express from 'express';
import { loginUser, signupUser } from '../webController/webUserController.js'; // Ensure the path is correct

const router = express.Router();

// Route for user login
router.post('/login', loginUser);

// Route for user signup
router.post('/register', signupUser);

export default router;

