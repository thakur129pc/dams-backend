import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'; // Get the directory name from the module URL

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Define the upload directory
const uploadDir = path.join(__dirname, '../../public/uploads'); // Check if the directory exists, if not, create it

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
} // Define storage strategy for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Set the destination directory
    },
    filename: function (req, file, cb) {
        // Extracting field name from the file object
        const fieldNameParts = file.fieldname.match(/beneficiaries\[(\d+)\]\[(\w+)\]/);
        if (fieldNameParts) {
            const index = fieldNameParts[1]; // Extracting index of beneficiary
            const field = fieldNameParts[2]; // Extracting field name (like aadhaarCard, photo, etc.)

            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const finalFileName = `beneficiaries[${index}][${field}]-${uniqueSuffix}${path.extname(file.originalname)}`;
            cb(null, finalFileName);
        } else {
            cb(new Error('Invalid file field name'));
        }
    }
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and PDF files are allowed.'));
    }
};

// Create the multer instance with storage, file size limits, and filters
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
    fileFilter: fileFilter
});

// Generate fields dynamically based on the number of beneficiaries
const generateFieldsForBeneficiaries = (numberOfBeneficiaries) => {
    let fields = [];
    for (let i = 0; i < numberOfBeneficiaries; i++) {
        fields.push({ name: `beneficiaries[${i}][landIndemnityBond]`, maxCount: 5 });
        fields.push({ name: `beneficiaries[${i}][structureIndemnityBond]`, maxCount: 5 });
        fields.push({ name: `beneficiaries[${i}][uploadAffidavit]`, maxCount: 5 });
        fields.push({ name: `beneficiaries[${i}][aadhaarCard]`, maxCount: 5 });
        fields.push({ name: `beneficiaries[${i}][panCard]`, maxCount: 5 });
        fields.push({ name: `beneficiaries[${i}][chequeOrPassbook]`, maxCount: 5 });
        fields.push({ name: `beneficiaries[${i}][photo]`, maxCount: 5 });
    }
    return fields;
};

// Multer middleware for uploading documents
const uploadDocsMiddleware = (numberOfBeneficiaries) => {
    return upload.fields(generateFieldsForBeneficiaries(numberOfBeneficiaries));
};

export default uploadDocsMiddleware;
