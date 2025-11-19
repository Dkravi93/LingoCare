import express from 'express';
import { upload } from '../middleware/upload.js';
import { uploadResumes } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/', upload.array('resumes'), uploadResumes);

export default router;