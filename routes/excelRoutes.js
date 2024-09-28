import express from 'express';
import { uploadExcelData } from '../controllers/excelUploadController.js';

const router = express.Router();

router.post('/upload', uploadExcelData);

export default router;
