import express from 'express';
import { 
  createVillage, 
  bulkCreateVillages,  // Added for bulk creation
  getAllVillages, 
  getVillageById, 
  updateVillageById, 
  deleteVillageById 
} from '../webController/villageListController.js'; // Adjust path if necessary
import requireAuth from "../../middleware/auth.js"

const router = express.Router();

// Route for creating a single village
router.post('/add-village', createVillage);

// Route for bulk creating villages
router.post('/add-villages', bulkCreateVillages);  // Added route for bulk creation

// Route for retrieving all villages
router.get('/villages', getAllVillages);

// Route for retrieving a single village by ID
router.get('/villages/:id', getVillageById);

// Route for updating a single village by ID
router.put('/villages/:id', updateVillageById);

// Route for deleting a single village by ID
router.delete('/villages/:id', deleteVillageById);

export default router;
