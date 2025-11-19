import multer from 'multer';

// memory storage – files discarded after processing
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') return cb(null, true);
  cb(new Error('Only PDF files allowed'));
};

export const upload = multer({ storage, fileFilter });

export default upload;