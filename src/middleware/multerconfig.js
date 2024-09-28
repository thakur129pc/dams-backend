import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name from the module URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the upload directory
const uploadDir = path.join(__dirname, '../../public/uploads');

// Check if the directory exists, if not, create it
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Define storage strategy for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // console.log(`Setting destination for file: ${file.originalname}`);
        cb(null, uploadDir); // Set the destination directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const finalFileName = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        // console.log(`Generated filename for ${file.originalname}: ${finalFileName}`);
        cb(null, finalFileName);
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
        // console.log(`File type not allowed: ${file.originalname}`);
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
        fields.push(
            { name: `beneficiaries[${i}][landIndemnityBond]`, maxCount: 5 },
        );
        fields.push(
            { name: `beneficiaries[${i}][structureIndemnityBond]`, maxCount: 5 },
        );
        fields.push(
            { name: `beneficiaries[${i}][uploadAffidavit]`, maxCount: 5 },
        );
        fields.push(
            { name: `beneficiaries[${i}][aadhaarCard]`, maxCount: 5 },
        );
        fields.push(
            { name: `beneficiaries[${i}][panCard]`, maxCount: 5 },
        );
        fields.push(
            { name: `beneficiaries[${i}][chequeOrPassbook]`, maxCount: 5 },
        );
        fields.push(
            { name: `beneficiaries[${i}][photo]`, maxCount: 5 },
        );
    }
    return fields;
};

// console.log(generateFieldsForBeneficiaries(2));


// Multer middleware for uploading documents
const uploadDocsMiddleware = (numberOfBeneficiaries) => {
    return upload.fields(generateFieldsForBeneficiaries(numberOfBeneficiaries));
};

export default uploadDocsMiddleware;
