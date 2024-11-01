import { catchAsyncError } from '../../middleware/catchAsyncError.js';
import beneficiaryDocs from '../../schema/beneficiaryDocDetailSchema.js';
import ErrorHandler from '../../middleware/error.js';
import khatauniDetailsWeb from '../../webApi/webModel/khatauniDetailsSchema.js';
import villageList from '../../webApi/webModel/villageListSchema.js';
import mongoose from 'mongoose';
import beneficiaryDocDetailSchema from '../../schema/beneficiaryDocDetailSchema.js';

import beneficiarDetails from '../../webApi/webModel/benificiaryDetail.js'


// DONT TOUCH MY CODE*//
export const getVillageDetails = catchAsyncError(async (req, res, next) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return next(new ErrorHandler('User ID is required.', 400));
        }

        const villagesDetails = await beneficiarDetails.find()
            .populate({
                path: 'khatauniId',
                select: 'khatauniSankhya khasraNumber acquiredKhasraNumber areaVariety acquiredRakbha isAllDocumentSubmitted'
            });

        if (!villagesDetails || villagesDetails.length === 0) {
            return next(new ErrorHandler('No village details found.', 404));
        }

        const villageIds = villagesDetails.map(village => village.villageId);
        const villages = await villageList.find({ _id: { $in: villageIds } })
            .select('villageName villageNameHindi');

        const docDetails = await beneficiaryDocDetailSchema.find();

        const groupedVillages = {};

        for (const village of villagesDetails) {
            const khatauni = village.khatauniId || {};
            const khatauniSankhya = khatauni.khatauniSankhya || 'N/A';
            const villageData = villages.find(v => v._id.toString() === village.villageId.toString());
            const villageName = villageData ? villageData.villageName : 'Unknown Village';

            if (!groupedVillages[khatauniSankhya]) {
                groupedVillages[khatauniSankhya] = {
                    id: village._id,
                    khatauniId: khatauni._id || 'N/A',
                    khatauniSankhya,
                    khasraNumber: khatauni.khasraNumber || 'N/A',
                    acquiredKhasraNumber: khatauni.acquiredKhasraNumber || 'N/A',
                    areaVariety: khatauni.areaVariety || 'N/A',
                    acquiredRakbha: khatauni.acquiredRakbha || 'N/A',
                    isAllDocumentSubmitted: khatauni.isAllDocumentSubmitted || 'N/A',
                    villageId: village.villageId || 'N/A',
                    villageName,
                    concatBeneficiaries: '',
                    submissionStatus: 'Yet to be filled',
                    submissionColor: '#808080',
                    beneficiaries: []
                };
            }

            const beneficiariesForKhatauni = await beneficiarDetails.find({ khatauniId: khatauni._id });
            const concatBeneficiaries = beneficiariesForKhatauni.map(b => b.beneficiaryName || 'N/A').join(', ');
            groupedVillages[khatauniSankhya].concatBeneficiaries = concatBeneficiaries;

            let allComplete = true;
            let allNotStarted = true;

            for (const beneficiary of beneficiariesForKhatauni) {
                const beneficiaryName = beneficiary.beneficiaryName;

                // Fetch documentUploadedEach value directly
                const docDetail = docDetails.find(doc =>
                    doc.khatauniSankhya === khatauniSankhya && doc.beneficiaryName === beneficiaryName
                );

                let documentStatus = 'Not Started';
                let documentColor = '#808080';

                // Debugging logs to check values
                console.log(`Checking documents for beneficiary: ${beneficiaryName}`);
                console.log(`Found document detail: `, docDetail);

                if (docDetail) {
                    const documentUploadedEach = docDetail.documentUploadedEach; // Fetching the specific key value

                    // Set document status based on the key value
                    if (documentUploadedEach === "completed") {
                        documentStatus = 'Complete';
                        documentColor = '#008000';
                    } else if (documentUploadedEach === "incomplete") {
                        documentStatus = 'Incomplete';
                        documentColor = '#C76E00';
                    }
                }

                if (documentStatus !== 'Complete') {
                    allComplete = false;
                }
                if (documentStatus !== 'Not Started') {
                    allNotStarted = false;
                }

                if (!groupedVillages[khatauniSankhya].beneficiaries.some(b => b.name === beneficiaryName)) {
                    groupedVillages[khatauniSankhya].beneficiaries.push({
                        name: beneficiaryName,
                        documentStatus,
                        documentColor
                    });
                }
            }

            // Finalize submissionStatus based on all beneficiaries' document statuses
            if (allComplete) {
                groupedVillages[khatauniSankhya].submissionStatus = 'Completed';
                groupedVillages[khatauniSankhya].submissionColor = '#008000';
            } else if (allNotStarted) {
                groupedVillages[khatauniSankhya].submissionStatus = 'Yet to be filled';
                groupedVillages[khatauniSankhya].submissionColor = '#808080';
            } else {
                groupedVillages[khatauniSankhya].submissionStatus = 'Partial';
                groupedVillages[khatauniSankhya].submissionColor = '#C76E00';
            }
        }

        res.status(200).json({
            status: true,
            message: 'Village details fetched successfully',
            data: Object.values(groupedVillages),
        });
    } catch (error) {
        next(new ErrorHandler('Error fetching village details', 500));
    }
});









// DONT TOUCH MY CODE*// fully updated 
export const getBeneficiariesByKhatauniSankhya = catchAsyncError(async (req, res, next) => {
    try {
        const { khatauniSankhya } = req.query;
        console.log('Query Parameters:', { khatauniSankhya });

        // Validate query parameters
        if (!khatauniSankhya) {
            return next(new ErrorHandler('Khatauni Sankhya is required.', 200));
        }

        // Fetch villages based on khatauniSankhya
        const villages = await khatauniDetailsWeb.find({
            khatauniSankhya: khatauniSankhya
        }).exec();

        // Check if villages were found
        if (!villages || villages.length === 0) {
            return next(new ErrorHandler('No beneficiaries found for the provided Khatauni Sankhya.', 200));
        }

        // Extract khatauniId for querying beneficiaries
        const khatauniIds = villages.map(village => village._id);

        // Fetch beneficiaries from beneficiaryDetails collection
        const beneficiaries = await beneficiarDetails.find({
            khatauniId: { $in: khatauniIds }
        }).exec();

        // Check if beneficiaries were found
        if (!beneficiaries || beneficiaries.length === 0) {
            return next(new ErrorHandler('No beneficiaries found in beneficiary details.', 200));
        }

        // Helper function to format dates
        const formatDate = (date) => {
            if (!date) return ""; // Return empty string if date is falsy

            const options = { day: '2-digit', month: 'long', year: 'numeric' };
            return new Date(date).toLocaleDateString('en-US', options);
        };

        // Create a response with beneficiaries and their document details
        const beneficiariesResponse = await Promise.all(beneficiaries.map(async (beneficiary) => {
            // Fetch documents for the beneficiary
            const docs = await beneficiaryDocs.find({ beneficiaryId: beneficiary._id }).exec();
            const documentsDetails = {
                accountNumber: docs[0]?.accountNumber ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
                ifscCode: docs[0]?.ifscCode ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
                aadhaarNumber: docs[0]?.aadhaarNumber ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
                panCardNumber: docs[0]?.panCardNumber ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
                remarks: docs[0]?.remarks ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
                photo: docs[0]?.photo ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
                landIndemnityBond: docs[0]?.landIndemnityBond ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
                structureIndemnityBond: docs[0]?.structureIndemnityBond ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
                uploadAffidavit: docs[0]?.uploadAffidavit ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
                aadhaarCard: docs[0]?.aadhaarCard ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
                panCard: docs[0]?.panCard ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
                chequeOrPassbook: docs[0]?.chequeOrPassbook ? `uploaded on ${formatDate(docs[0].createdAt)}` : '',
            };

            // Check if all document values are empty
            const shouldRemoveDocumentsKey = Object.values(documentsDetails).every(value => value === "");

            return {
                beneficiaryId: beneficiary._id,
                name: beneficiary.beneficiaryName,
                ...(shouldRemoveDocumentsKey ? {} : { documents: documentsDetails }) // Include documents only if not empty
            };
        }));

        // Extract khasraNumber, areaVariety from the first record
        const { khasraNumber, areaVariety } = villages[0];

        // Calculate the total beneficiary count
        const totalBeneficiaryCount = beneficiariesResponse.length;

        // Send the response with all beneficiaries and additional information
        res.status(200).json({
            status: true,
            message: 'Beneficiary details fetched successfully.',
            beneficiaries: beneficiariesResponse,  // List of beneficiaries with IDs, names, and their documents
            beneficiaryCount: totalBeneficiaryCount,  // Total count of beneficiaries
            khasraNumber,  // Khasra Number
            areaVariety,   // Area Variety
            khatauniSankhya // Khatauni Sankhya
        });
    } catch (error) {
        console.error('Error:', error);
        next(error);
    }
});




// DONT TOUCH MY CODE*//
// export const uploadDocs = async (req, res) => {
//     try {
//         let { beneficiaries, khatauniSankhya } = req.body;
//         const files = req.files;

//         // Parse beneficiaries if it's a string
//         if (typeof beneficiaries === 'string') {
//             beneficiaries = JSON.parse(beneficiaries);
//         }

//         // Check if beneficiaries is an array
//         if (!Array.isArray(beneficiaries)) {
//             return res.json({
//                 status: false,
//                 message: 'Beneficiaries should be an array.',
//             });
//         }

//         // Validate required fields
//         if (!beneficiaries.length || !khatauniSankhya) {
//             return res.json({
//                 status: false,
//                 message: 'Required fields are missing.',
//             });
//         }

//         const requiredFields = [
//             'accountNumber', 'ifscCode', 'aadhaarNumber', 'panCardNumber', 'photo',
//             'landIndemnityBond', 'structureIndemnityBond', 'uploadAffidavit',
//             'aadhaarCard', 'panCard', 'chequeOrPassbook',
//         ];

//         // Extract file name based on the field and index of beneficiary
//         const extractFileName = (field, index) => {
//             const key = `beneficiaries[${index}][${field}]`;
//             const file = files[key];
//             return file && file[0]?.filename
//                 ? `${field}-${file[0].filename.split('-').pop()}`
//                 : '';
//         };

//         // Process beneficiaries and handle document upload
//         const processedBeneficiaries = beneficiaries.map((beneficiary, index) => {
//             // Ensure beneficiaryName is a string
//             const beneficiaryName = Array.isArray(beneficiary.beneficiaryName)
//                 ? beneficiary.beneficiaryName.join(', ') // Join if it's an array
//                 : beneficiary.beneficiaryName || ''; // Default to empty string if undefined

//             const hasDocumentSubmitted = requiredFields.some(field => files[`beneficiaries[${index}][${field}]`] && files[`beneficiaries[${index}][${field}]`][0]?.filename);

//             // Validate consents before proceeding
//             if (hasDocumentSubmitted && (beneficiary.isConsent1 !== 'true' || beneficiary.isConsent2 !== 'true')) {
//                 throw new Error(`Both consents must be "true" for beneficiary: ${beneficiaryName}`);
//             }

//             // Construct the beneficiary object with extracted file names
//             return {
//                 beneficiaryId: beneficiary.beneficiaryId ? new mongoose.Types.ObjectId(beneficiary.beneficiaryId) : null,
//                 beneficiaryName,
//                 accountNumber: beneficiary.accountNumber || '',
//                 ifscCode: beneficiary.ifscCode || '',
//                 aadhaarNumber: beneficiary.aadhaarNumber || '',
//                 panCardNumber: beneficiary.panCardNumber || '',
//                 remarks: beneficiary.remarks || '',
//                 isConsent1: beneficiary.isConsent1 === 'true',
//                 isConsent2: beneficiary.isConsent2 === 'true',
//                 photo: extractFileName('photo', index),
//                 landIndemnityBond: extractFileName('landIndemnityBond', index),
//                 structureIndemnityBond: extractFileName('structureIndemnityBond', index),
//                 uploadAffidavit: extractFileName('uploadAffidavit', index),
//                 aadhaarCard: extractFileName('aadhaarCard', index),
//                 panCard: extractFileName('panCard', index),
//                 chequeOrPassbook: extractFileName('chequeOrPassbook', index),
//                 khatauniSankhya: khatauniSankhya || '', // Ensure khatauniSankhya is included
//                 documentUploadedEach: '', // Will be updated later based on conditions
//             };
//         });

//         // Check if at least one document or detail is filled for any beneficiary
//         const hasAtLeastOneField = processedBeneficiaries.some(beneficiary =>
//             requiredFields.some(field => beneficiary[field] && beneficiary[field].trim() !== '') ||
//             beneficiary.accountNumber || beneficiary.ifscCode ||
//             beneficiary.aadhaarNumber || beneficiary.panCardNumber
//         );

//         if (!hasAtLeastOneField) {
//             return res.json({
//                 status: false,
//                 message: 'Please fill at least one document or detail for any beneficiary.',
//             });
//         }

//         // Determine if all documents are filled for all beneficiaries
//         const allDocsFilledForAllBeneficiaries = processedBeneficiaries.every(beneficiary =>
//             requiredFields.every(field => beneficiary[field] && beneficiary[field].trim() !== '')
//         );

//         // Initialize submissionStatus
//         const submissionStatus = allDocsFilledForAllBeneficiaries ? 'Completed' : 'Partial';

//         for (const beneficiary of processedBeneficiaries) {
//             // Check if all required documents are filled for each beneficiary
//             const allDocsUploadedForBeneficiary = requiredFields.every(field =>
//                 beneficiary[field] && typeof beneficiary[field] === 'string' && beneficiary[field].trim() !== ''
//             );

//             beneficiary.documentUploadedEach = allDocsUploadedForBeneficiary ? 'completed' : 'incomplete';

//             // Find or create the beneficiary document in the collection
//             let beneficiaryDoc = await beneficiaryDocs.findOne({
//                 beneficiaryId: beneficiary.beneficiaryId,
//                 beneficiaryName: beneficiary.beneficiaryName,
//                 khatauniSankhya: beneficiary.khatauniSankhya,
//             });

//             if (beneficiaryDoc) {
//                 // Update existing document only with non-empty fields
//                 Object.keys(beneficiary).forEach(key => {
//                     const value = beneficiary[key];
//                     if ((typeof value === 'string' && value.trim() !== '') || typeof value !== 'string') {
//                         beneficiaryDoc[key] = value;  // Only update if new value is not empty and different
//                     }
//                 });
//                 beneficiaryDoc.submissionStatus = submissionStatus; // Add submissionStatus to each beneficiary doc

//                 // Update isDocumentUploaded in beneficiaryDetails if all documents are uploaded for this beneficiary
//                 if (beneficiary.documentUploadedEach === 'completed') {
//                     console.log("Updating isDocumentUploaded for beneficiary:", beneficiary.beneficiaryId);
//                     await beneficiarDetails.findOneAndUpdate(
//                         { _id: beneficiary.beneficiaryId },
//                         { $set: { isDocumentUploaded: "1" } },
//                         { new: true, upsert: true } // Upsert in case the document doesn't exist
//                     );
//                 }
//             } else {
//                 // Create new document
//                 beneficiaryDoc = new beneficiaryDocs({ ...beneficiary, submissionStatus });

//                 // Set isDocumentUploaded to "1" if documents are uploaded
//                 if (beneficiary.documentUploadedEach === 'completed') {
//                     console.log("Creating and updating isDocumentUploaded for beneficiary:", beneficiary.beneficiaryId);
//                     await beneficiarDetails.findOneAndUpdate(
//                         { beneficiaryId: beneficiary.beneficiaryId },
//                         { $set: { isDocumentUploaded: "1" } },
//                         { new: true, upsert: true } // Upsert in case the document doesn't exist
//                     );
//                 }
//             }
//             // Save the updated/new beneficiary document
//             await beneficiaryDoc.save();
//         }


//         // Update the overall submission status for all documents under this khatauniSankhya
//         await beneficiaryDocs.updateMany(
//             { khatauniSankhya },
//             { $set: { submissionStatus } }
//         );

//         // Return success response
//         res.status(200).json({
//             status: true,
//             message: 'Documents and beneficiary details uploaded successfully',
//             processedBeneficiaries
//         });
//     } catch (error) {
//         console.error('Error uploading documents:', error);
//         res.json({
//             status: false,
//             message: error.message || 'Error uploading documents',
//         });
//     }
// };




export const uploadDocs = async (req, res) => {
    try {
        let { beneficiaries, khatauniSankhya } = req.body;
        const files = req.files;
        if (typeof beneficiaries === 'string') {
            beneficiaries = JSON.parse(beneficiaries);
        }
        if (!Array.isArray(beneficiaries)) {
            return res.status(400).json({ status: false, message: 'Beneficiaries should be an array.' });
        }
        if (!beneficiaries.length || !khatauniSankhya) {
            return res.status(400).json({ status: false, message: 'Required fields are missing.' });
        }
        const requiredFields = [
            'accountNumber', 'ifscCode', 'aadhaarNumber', 'panCardNumber', 'photo',
            'landIndemnityBond', 'structureIndemnityBond', 'uploadAffidavit',
            'aadhaarCard', 'panCard', 'chequeOrPassbook'
        ];
        const extractFileName = (field, index) => {
            const key = `beneficiaries[${index}][${field}]`;
            const file = files[key];
            return file && file[0] ? file[0].filename : '';
        };
        const processedBeneficiaries = beneficiaries.map((beneficiary, index) => {
            const beneficiaryName = Array.isArray(beneficiary.beneficiaryName)
                ? beneficiary.beneficiaryName.join(', ')
                : beneficiary.beneficiaryName || '';
            const hasDocumentSubmitted = requiredFields.some(field =>
                files[`beneficiaries[${index}]`] && files[`beneficiaries[${index}]`][0]?.filename
            );
            if (hasDocumentSubmitted && (beneficiary.isConsent1 !== 'true' || beneficiary.isConsent2 !== 'true')) {
                throw new Error(`Both consents must be "true" for beneficiary: ${beneficiaryName}`);
            }
            return {
                beneficiaryId: beneficiary.beneficiaryId ? new mongoose.Types.ObjectId(beneficiary.beneficiaryId) : null,
                beneficiaryName,
                accountNumber: beneficiary.accountNumber || '',
                ifscCode: beneficiary.ifscCode || '',
                aadhaarNumber: beneficiary.aadhaarNumber || '',
                panCardNumber: beneficiary.panCardNumber || '',
                remarks: beneficiary.remarks || '',
                isConsent1: beneficiary.isConsent1 === 'true',
                isConsent2: beneficiary.isConsent2 === 'true',
                photo: extractFileName('photo', index),
                landIndemnityBond: extractFileName('landIndemnityBond', index),
                structureIndemnityBond: extractFileName('structureIndemnityBond', index),
                uploadAffidavit: extractFileName('uploadAffidavit', index),
                aadhaarCard: extractFileName('aadhaarCard', index),
                panCard: extractFileName('panCard', index),
                chequeOrPassbook: extractFileName('chequeOrPassbook', index),
                khatauniSankhya: khatauniSankhya || '',
                documentUploadedEach: ''
            };
        });
        const hasAtLeastOneField = processedBeneficiaries.some(beneficiary =>
            requiredFields.some(field => beneficiary[field] && beneficiary[field].trim() !== '') ||
            beneficiary.accountNumber || beneficiary.ifscCode ||
            beneficiary.aadhaarNumber || beneficiary.panCardNumber
        );
        if (!hasAtLeastOneField) {
            return res.status(400).json({
                status: false,
                message: 'Please fill at least one document or detail for any beneficiary.'
            });
        }
        const allDocsFilledForAllBeneficiaries = processedBeneficiaries.every(beneficiary =>
            requiredFields.every(field => beneficiary[field] && beneficiary[field].trim() !== '')
        );
        const submissionStatus = allDocsFilledForAllBeneficiaries ? 'Completed' : 'Partial';
        for (const beneficiary of processedBeneficiaries) {
            const allDocsUploadedForBeneficiary = requiredFields.every(field =>
                beneficiary[field] && typeof beneficiary[field] === 'string' && beneficiary[field].trim() !== ''
            );
            beneficiary.documentUploadedEach = allDocsUploadedForBeneficiary ? 'completed' : 'incomplete';
            let beneficiaryDoc = await beneficiaryDocs.findOne({
                beneficiaryId: beneficiary.beneficiaryId,
                beneficiaryName: beneficiary.beneficiaryName,
                khatauniSankhya: beneficiary.khatauniSankhya,
            });
            if (beneficiaryDoc) {
                Object.keys(beneficiary).forEach(key => {
                    const value = beneficiary[key];
                    if ((typeof value === 'string' && value.trim() !== '') || typeof value !== 'string') {
                        beneficiaryDoc[key] = value;
                    }
                });
                beneficiaryDoc.submissionStatus = submissionStatus;
                if (beneficiary.documentUploadedEach === 'completed') {
                    await beneficiarDetails.findOneAndUpdate(
                        { _id: beneficiary.beneficiaryId },
                        { $set: { isDocumentUploaded: "1" } },
                        { new: true, upsert: true }
                    );
                }
            } else {
                beneficiaryDoc = new beneficiaryDocs({ ...beneficiary, submissionStatus });
                if (beneficiary.documentUploadedEach === 'completed') {
                    await beneficiarDetails.findOneAndUpdate(
                        { _id: beneficiary.beneficiaryId },
                        { $set: { isDocumentUploaded: "1" } },
                        { new: true, upsert: true }
                    );
                }
            }
            await beneficiaryDoc.save();
        }
        await beneficiaryDocs.updateMany(
            { khatauniSankhya },
            { $set: { submissionStatus } }
        );
        res.status(200).json({
            status: true,
            message: 'Documents and beneficiary details uploaded successfully',
            processedBeneficiaries
        });
    } catch (error) {
        console.error('Error uploading documents:', error);
        res.status(500).json({
            status: false,
            message: error.message || 'Error uploading documents',
        });
    }
};
