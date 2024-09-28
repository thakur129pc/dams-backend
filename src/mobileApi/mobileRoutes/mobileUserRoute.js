import express from 'express';
import { register, login, logout } from '../mobileController/userController.js';
import { getVillageDetails, getBeneficiariesByKhatauniSankhya, uploadDocs } from '../mobileController/dashboardController.js';
import uploadDocsMiddleware from '../../middleware/multerconfig.js'; // Import the middleware
const router = express.Router();
// User routes
router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
// Village details routes
router.get('/village/', getVillageDetails);
router.get('/villages/details-with-count', getBeneficiariesByKhatauniSankhya);


const numberOfBeneficiaries = 50; // Adjust as needed

router.post('/upload-docs', uploadDocsMiddleware(numberOfBeneficiaries), uploadDocs);

export default router;
