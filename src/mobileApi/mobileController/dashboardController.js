import { catchAsyncError } from '../../middleware/catchAsyncError.js';
import  beneficiaryDocs  from '../../schema/beneficiaryDocDetailSchema.js';
import ErrorHandler from '../../middleware/error.js';
import khatauniDetailsWeb from '../../webApi/webModel/khatauniDetailsSchema.js';
import beneficiardetailsschemas from '../../webApi/webModel/benificiaryDetail.js';

import mongoose from 'mongoose';

// DONT TOUCH THIS CODE //

export const getVillageDetails = catchAsyncError(async (req, res, next) => {
    try {
        const { userId, villageId } = req.query;
        // Ensure userId and villageId are provided
        if (!userId) {
            return next(new ErrorHandler('User ID is required.', 400));
        }
        // Fetch village details based on villageId if provided, else fetch all villages
        const query = villageId ? { villageId } : {};
        const villagesDetails = await khatauniDetailsWeb.find(query)
            .populate({
                path: 'beneficiaryId',  // Ensure beneficiaryId is referenced correctly
                select: 'beneficiaryName',  // Select the beneficiaryName from the Beneficiary schema
            })
            .exec();
        // Log the villages details for debugging
        console.log('Villages Details Before Formatting:', villagesDetails);
        if (!villagesDetails || villagesDetails.length === 0) {
            return next(new ErrorHandler('No village details found.', 404));
        }
        // Format the village details
        const formattedVillagesDetails = villagesDetails.map(village => ({
            id: village._id,
            khatauniId: village._id,
            khatauniSankhya: village.khatauniSankhya || 'N/A',
            serialNumber: village.serialNumber || 'N/A',
            khasraNumber: village.khasraNumber || 'N/A',
            acquiredKhasraNumber: village.acquiredKhasraNumber || 'N/A',
            areaVariety: village.areaVariety || 'N/A',
            acquiredRakbha: village.acquiredRakbha || 'N/A',
            isAllDocumentSubmitted: village.isAllDocumentSubmitted || 'N/A',
            beneficiaryName: village.beneficiaryId?.beneficiaryName || 'N/A',  // Get beneficiaryName from populated beneficiaryId
            villageId: village.villageId || 'N/A',
        }));
        console.log('Formatted Villages Details:', formattedVillagesDetails);
        // Send the formatted details as a response
        res.status(200).json({
            status: true,
            message: 'Success',
            villagesDetails: formattedVillagesDetails
        });
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});



// DONT TOUCH THIS CODE //

export const getBeneficiariesByKhatauniSankhya = catchAsyncError(async (req, res, next) => {
    try {
        const { khatauniSankhya } = req.query;
        console.log('Query Parameters:', { khatauniSankhya });

        // Validate query parameters
        if (!khatauniSankhya) {
            return next(new ErrorHandler('Khatauni Sankhya is required.', 400));
        }

        // Fetch all khatauni details matching the provided khatauniSankhya
        const villages = await khatauniDetailsWeb.find({
            khatauniSankhya: khatauniSankhya
        })
        .populate('beneficiaryId', 'beneficiaryId beneficiaryName')  // Populating beneficiary details
        .exec();

        if (!villages || villages.length === 0) {
            return next(new ErrorHandler('No beneficiaries found for the provided Khatauni Sankhya.', 404));
        }

        // Extract beneficiaries from all matched records and map them to the desired format
        const beneficiaries = villages.map(village => ({
            beneficiaryId: village.beneficiaryId._id,
            name: village.beneficiaryId.beneficiaryName
        }));

        // Extract khasraNumber, areaVariety, and khatauniSankhya from the first record (since they are the same for all)
        const { khasraNumber, areaVariety, khatauniSankhya: khatauni } = villages[0];

        // Calculate the total beneficiary count
        const totalBeneficiaryCount = beneficiaries.length;

        // Send the response with all beneficiaries and additional information
        res.status(200).json({
            success: true,
            message: 'Beneficiary details fetched successfully.',
            beneficiaries,  // List of beneficiaries with IDs and names
            beneficiaryCount: totalBeneficiaryCount,  // Total count of beneficiaries
            khasraNumber,  // Khasra Number
            areaVariety,   // Area Variety
            khatauniSankhya: khatauni  // Khatauni Sankhya
        });
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});



// DONT TOUCH THIS CODE //

// export const uploadDocs = catchAsyncError(async (req, res, next) => {
//     try {
//         const { beneficiaryId, beneficiaryName } = req.body;

//         // Validate beneficiaryId and beneficiaryName
//         if (!beneficiaryId || !beneficiaryName) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Beneficiary ID and name are required",
//             });
//         }

//         // Find the beneficiary
//         const beneficiary = await beneficiaryDetails.findById(beneficiaryId);

//         if (!beneficiary) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Beneficiary not found",
//             });
//         }

//         // Convert beneficiary names to an array
//         const beneficiaryNames = beneficiaryName.split(',').map(name => name.trim().toLowerCase());

//         // Process document files (save only the names, not paths)
//         const documents = {
//             landIndemnityBond: req.files['landIndemnityBond'] ? req.files['landIndemnityBond'].map(file => file.originalname) : [],
//             structureIndemnityBond: req.files['structureIndemnityBond'] ? req.files['structureIndemnityBond'].map(file => file.originalname) : [],
//             uploadAffidavit: req.files['uploadAffidavit'] ? req.files['uploadAffidavit'].map(file => file.originalname) : [],
//             aadhaarCard: req.files['aadhaarCard'] ? req.files['aadhaarCard'].map(file => file.originalname) : [],
//             panCard: req.files['panCard'] ? req.files['panCard'].map(file => file.originalname) : [],
//             photo: req.files['photo'] ? req.files['photo'].map(file => file.originalname) : [],
//             chequeOrPassbook: req.files['chequeOrPassbook'] ? req.files['chequeOrPassbook'].map(file => file.originalname) : [],
//         };

//         // Parse additional fields if provided
//         const aadhaarNumbers = req.body.aadhaarNumber ? JSON.parse(req.body.aadhaarNumber.replace(/^"|"$/g, '')) : [];
//         const panCardNumbers = req.body.panNumber ? JSON.parse(req.body.panNumber.replace(/^"|"$/g, '')) : [];
//         const confirmAccountNumber = req.body.confirmAccountNumber || '';
//         const isConsent = req.body.isConsent === 'true';
//         const remarks = req.body.remarks ? req.body.remarks.replace(/^'|'$/g, '') : '';
//         const ifscCodes = req.body.ifscCode ? JSON.parse(req.body.ifscCode.replace(/^"|"$/g, '')) : [];
//         const accountNumbers = req.body.accountNumber ? JSON.parse(req.body.accountNumber.replace(/^"|"$/g, '')) : [];

//         // Prepare update data
//         const updateData = {
//             isConsent: isConsent,
//             remarks: remarks,
//             documents: {
//                 landIndemnityBond: documents.landIndemnityBond,
//                 structureIndemnityBond: documents.structureIndemnityBond,
//                 uploadAffidavit: documents.uploadAffidavit,
//                 aadhaarCard: documents.aadhaarCard,
//                 panCard: documents.panCard,
//                 photo: documents.photo,
//                 chequeOrPassbook: documents.chequeOrPassbook,
//                 accountNumber: accountNumbers,
//                 ifscCode: ifscCodes,
//                 confirmAccountNumber: confirmAccountNumber,
//                 aadhaarNumber: aadhaarNumbers,
//                 panNumber: panCardNumbers,
//             }
//         };
//         console.log(updateData);

//         // Update or create the document
//         const existingDoc = await beneficiaryDocs.findOneAndUpdate(
//             { beneficiaryId: beneficiaryId },
//             {
//                 $addToSet: {
//                     beneficiaryName: { $each: beneficiaryNames }
//                 },
//                 $push: {
//                     'documents.landIndemnityBond': { $each: updateData.documents.landIndemnityBond },
//                     'documents.structureIndemnityBond': { $each: updateData.documents.structureIndemnityBond },
//                     'documents.uploadAffidavit': { $each: updateData.documents.uploadAffidavit },
//                     'documents.aadhaarCard': { $each: updateData.documents.aadhaarCard },
//                     'documents.panCard': { $each: updateData.documents.panCard },
//                     'documents.photo': { $each: updateData.documents.photo },
//                     'documents.chequeOrPassbook': { $each: updateData.documents.chequeOrPassbook },
//                     'documents.aadhaarNumber': { $each: updateData.documents.aadhaarNumber },
//                     'documents.panNumber': { $each: updateData.documents.panNumber },
//                     'documents.accountNumber': { $each: updateData.documents.accountNumber },
//                     'documents.ifscCode': { $each: updateData.documents.ifscCode },
//                     //'documents.confirmAccountNumber': { $each: updateData.documents.confirmAccountNumber }
//                 },
//                 $set: {
//                     isConsent: updateData.isConsent,
//                     remarks: updateData.remarks
//                 }
//             },
//             { new: true, upsert: true }
//         );
//         console.log(existingDoc);

//         // Return success response
//         res.status(200).json({
//             success: true,
//             message: 'Documents and details uploaded successfully for the beneficiary.',
//         });
//     } catch (error) {
//         console.error("Error in uploadDocs:", error);
//         res.status(500).json({
//             success: false,
//             message: 'Internal Server Error',
//         });
//     }
// });


// export const uploadDocs = async (req, res) => {
//     try {
//         const { beneficiaryId, beneficiaryName } = req.body; // Extract beneficiaryId and beneficiaryName
//         const files = req.files;

//         console.log('Received beneficiaryId:', beneficiaryId);
//         console.log('Received beneficiaryName:', beneficiaryName);

//         if (!beneficiaryId || !beneficiaryName || !files) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Required fields are missing. Files received: ${JSON.stringify(files)}`
//             });
//         }

//         // Process documents for the beneficiary
//         const processedBeneficiary = {
//             beneficiaryId: beneficiaryId, // Assign uniqueId to the beneficiaryId field
//             beneficiaryName: beneficiaryName,
//             photo: files['photo'] ? files['photo'][0].filename : '',
//             landIndemnityBond: files['landIndemnityBond'] ? files['landIndemnityBond'][0].filename : '',
//             structureIndemnityBond: files['structureIndemnityBond'] ? files['structureIndemnityBond'][0].filename : '',
//             uploadAffidavit: files['uploadAffidavit'] ? files['uploadAffidavit'][0].filename : '',
//             aadhaarCard: files['aadhaarCard'] ? files['aadhaarCard'][0].filename : '',
//             panCard: files['panCard'] ? files['panCard'][0].filename : '',
//             chequeOrPassbook: files['chequeOrPassbook'] ? files['chequeOrPassbook'][0].filename : '',
//             accountNumber: req.body.accountNumber || '',
//             ifscCode: req.body.ifscCode || '',
//             confirmAccountNumber: req.body.confirmAccountNumber || '',
//             aadhaarNumber: req.body.aadhaarNumber || '',
//             panCardNumber: req.body.panCardNumber || '',
//             remarks: req.body.remarks || '',
//             isConsent: req.body.isConsent || false
//         };

//         console.log('Processed beneficiary:', processedBeneficiary);

//         // Handle beneficiaryDocs
//         let beneficiaryDoc = await beneficiaryDocs.findOne({ beneficiaryId: processedBeneficiary.beneficiaryId });

//         if (beneficiaryDoc) {
//             // Update existing document
//             Object.assign(beneficiaryDoc, processedBeneficiary);
//         } else {
//             // Create a new document entry
//             beneficiaryDoc = new beneficiaryDocs(processedBeneficiary);
//         }

//         console.log('Saving beneficiaryDoc:', beneficiaryDoc);

//         // Save the document
//         await beneficiaryDoc.save();

//         // Handle beneficiaryDetails
//         let beneficiaryDetail = await beneficiaryDetails.findOne({ aadhaarNumber: processedBeneficiary.aadhaarNumber });

//         if (beneficiaryDetail) {
//             // Update existing details
//             Object.assign(beneficiaryDetail, processedBeneficiary);
//         } else {
//             // Create a new details entry
//             beneficiaryDetail = new beneficiaryDetails({ ...processedBeneficiary });
//         }

//         console.log('Saving beneficiaryDetail:', beneficiaryDetail);

//         // Save the details
//         await beneficiaryDetail.save();

//         res.status(200).json({
//             success: true,
//             message: 'Documents and beneficiary details uploaded successfully',
//             data: processedBeneficiary
//         });
//     } catch (error) {
//         console.error('Error uploading documents:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error uploading documents',
//             error: error.message
//         });
//     }
// };

export const uploadDocs = async (req, res) => {
    try {
        const { beneficiaries, khatauniSankhya } = req.body; // Removed beneficiaryId as it's no longer needed
        const files = req.files;

        // Convert req.files into a plain object for cleaner logging
        const cleanedFiles = JSON.parse(JSON.stringify(files));

        // Check if required fields are missing
        if (!beneficiaries || !khatauniSankhya || !Object.keys(cleanedFiles).length) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing.',
                filesReceived: cleanedFiles
            });
        }

        // Process beneficiaries and files
        const processedBeneficiaries = beneficiaries.map((beneficiary, index) => {
            const photo = (files[`beneficiaries[${index}][photo]`] && files[`beneficiaries[${index}][photo]`][0]?.filename) || '';
            const landIndemnityBond = (files[`beneficiaries[${index}][landIndemnityBond]`] && files[`beneficiaries[${index}][landIndemnityBond]`][0]?.filename) || '';
            const structureIndemnityBond = (files[`beneficiaries[${index}][structureIndemnityBond]`] && files[`beneficiaries[${index}][structureIndemnityBond]`][0]?.filename) || '';
            const uploadAffidavit = (files[`beneficiaries[${index}][uploadAffidavit]`] && files[`beneficiaries[${index}][uploadAffidavit]`][0]?.filename) || '';
            const aadhaarCard = (files[`beneficiaries[${index}][aadhaarCard]`] && files[`beneficiaries[${index}][aadhaarCard]`][0]?.filename) || '';
            const panCard = (files[`beneficiaries[${index}][panCard]`] && files[`beneficiaries[${index}][panCard]`][0]?.filename) || '';
            const chequeOrPassbook = (files[`beneficiaries[${index}][chequeOrPassbook]`] && files[`beneficiaries[${index}][chequeOrPassbook]`][0]?.filename) || '';

            return {
                beneficiaryId: new mongoose.Types.ObjectId(beneficiary.beneficiaryId), // Use specific beneficiaryId
                beneficiaryName: beneficiary.beneficiaryName || '',
                accountNumber: beneficiary.accountNumber || '',
                ifscCode: beneficiary.ifscCode || '',
                confirmAccountNumber: beneficiary.confirmAccountNumber || '',
                aadhaarNumber: beneficiary.aadhaarNumber || '',
                panCardNumber: beneficiary.panCardNumber || '',
                remarks: beneficiary.remarks || '',
                isConsent: beneficiary.isConsent === 'true', // Convert string to boolean
                photo,
                landIndemnityBond,
                structureIndemnityBond,
                uploadAffidavit,
                aadhaarCard,
                panCard,
                chequeOrPassbook,
                khatauniSankhya // Include khatauniSankhya in each beneficiary object
            };
        });

        // Save or update beneficiary documents
        for (const beneficiary of processedBeneficiaries) {
            let beneficiaryDoc = await beneficiaryDocs.findOne({
                beneficiaryId: beneficiary.beneficiaryId,
                beneficiaryName: beneficiary.beneficiaryName
            });

            if (beneficiaryDoc) {
                // If document exists, update it
                Object.assign(beneficiaryDoc, beneficiary);
            } else {
                // If not, create a new one
                beneficiaryDoc = new beneficiaryDocs(beneficiary);
            }

            await beneficiaryDoc.save();
        }

        // Return success response
        res.status(200).json({
            success: true,
            message: 'Documents and beneficiary details uploaded successfully',
            data: processedBeneficiaries
        });
    } catch (error) {
        console.error('Error uploading documents:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading documents',
            error: error.message
        });
    }
};














