import { catchAsyncError } from '../../middleware/catchAsyncError.js';
import  beneficiaryDocsModel  from '../../schema/beneficiaryDocDetailSchema.js';
import ErrorHandler from '../../middleware/error.js';
import khatauniDetailsWeb from '../../webApi/webModel/khatauniDetailsSchema.js';
import beneficiardetailsschemas from '../../webApi/webModel/benificiaryDetail.js';
import villageList from '../../webApi/webModel/villageListSchema.js';
import mongoose from 'mongoose';

// DONT TOUCH THIS CODE //

// export const getVillageDetails = catchAsyncError(async (req, res, next) => {
//     try {
//         const { userId, villageId } = req.query;
//         // Ensure userId and villageId are provided
//         if (!userId) {
//             return next(new ErrorHandler('User ID is required.', 400));
//         }
//         // Fetch village details based on villageId if provided, else fetch all villages
//         const query = villageId ? { villageId } : {};
//         const villagesDetails = await khatauniDetailsWeb.find(query)
//             .populate({
//                 path: 'beneficiaryId',  // Ensure beneficiaryId is referenced correctly
//                 select: 'beneficiaryName',  // Select the beneficiaryName from the Beneficiary schema
//             })
//             .exec();

//         // Log the villages details for debugging
//         console.log('Villages Details Before Grouping:', villagesDetails);

//         if (!villagesDetails || villagesDetails.length === 0) {
//             return next(new ErrorHandler('No village details found.', 404));
//         }

//         // Group village details by khatauniSankhya
//         const groupedVillages = villagesDetails.reduce((acc, village) => {
//             const khatauniSankhya = village.khatauniSankhya || 'N/A';

//             // If khatauniSankhya is not already in the accumulator, create an entry for it
//             if (!acc[khatauniSankhya]) {
//                 acc[khatauniSankhya] = {
//                     id: village._id,
//                     khatauniId: village._id,
//                     khatauniSankhya,
//                     serialNumber: village.serialNumber || 'N/A',
//                     khasraNumber: village.khasraNumber || 'N/A',
//                     acquiredKhasraNumber: village.acquiredKhasraNumber || 'N/A',
//                     areaVariety: village.areaVariety || 'N/A',
//                     acquiredRakbha: village.acquiredRakbha || 'N/A',
//                     isAllDocumentSubmitted: village.isAllDocumentSubmitted || 'N/A',
//                     villageId: village.villageId || 'N/A',
//                     beneficiaries: ''  // String to hold comma-separated beneficiary names
//                 };
//             }

//             // Concatenate the beneficiary names into a comma-separated string
//             const beneficiaryName = village.beneficiaryId?.beneficiaryName || 'N/A';
//             acc[khatauniSankhya].beneficiaries = acc[khatauniSankhya].beneficiaries 
//                 ? `${acc[khatauniSankhya].beneficiaries}, ${beneficiaryName}` 
//                 : beneficiaryName;

//             return acc;
//         }, {});

//         // Convert the groupedVillages object to an array
//         const formattedVillagesDetails = Object.values(groupedVillages);

//         console.log('Formatted Grouped Villages Details:', formattedVillagesDetails);

//         // Send the formatted details as a response
//         res.status(200).json({
//             status: true,
//             message: 'Success',
//             villagesDetails: formattedVillagesDetails
//         });
//     } catch (error) {
//         console.error('Error:', error);
//         next(error);
//     }
// });

export const getVillageDetails = catchAsyncError(async (req, res, next) => {
    try {
        const { userId } = req.query;

        // Validate User ID
        if (!userId) {
            return next(new ErrorHandler('User ID is required.', 400));
        }

        // Fetch village details with populated beneficiary info
        const villagesDetails = await khatauniDetailsWeb.find()
            .populate({
                path: 'beneficiaryId',
                select: 'beneficiaryName'
            })
            .exec();

        // Handle no village details found
        if (!villagesDetails || villagesDetails.length === 0) {
            return next(new ErrorHandler('No village details found.', 404));
        }

        // Fetch village names from village list
        const villageIds = villagesDetails.map(village => village.villageId);
        const villages = await villageList.find({ _id: { $in: villageIds } })
            .select('villageName villageNameHindi');

        // Fetch beneficiary documents from beneficiaryDocs collection
        const beneficiaryIds = villagesDetails.map(village => village.beneficiaryId);
        const beneficiaryDocs = await beneficiaryDocsModel.find({ beneficiaryId: { $in: beneficiaryIds } })
            .select('beneficiaryId documentUploadedEach submissionStatus');

        console.log("Beneficiary Docs:", beneficiaryDocs); // Debug the beneficiaryDocs result

        // Group village details by khatauniSankhya
        const groupedVillages = villagesDetails.reduce((acc, village) => {
            const khatauniSankhya = village.khatauniSankhya || 'N/A';
            const villageData = villages.find(v => v._id.toString() === village.villageId.toString());
            const villageName = villageData ? villageData.villageName : 'Unknown Village';

            // Initialize village entry if it doesn't exist
            if (!acc[khatauniSankhya]) {
                acc[khatauniSankhya] = {
                    id: village._id,
                    khatauniId: village._id,
                    khatauniSankhya,
                    serialNumber: village.serialNumber || 'N/A',
                    khasraNumber: village.khasraNumber || 'N/A',
                    acquiredKhasraNumber: village.acquiredKhasraNumber || 'N/A',
                    areaVolume: village.areaVolume || 'N/A',
                    acquiredRakbha: village.acquiredRakbha || 'N/A',
                    isAllDocumentSubmitted: village.isAllDocumentSubmitted || 'N/A',
                    villageId: village.villageId || 'N/A',
                    villageName,
                    submissionStatus: village.submissionStatus || 'Yet to be filled.', // Track khatauni-wise submission status
                    beneficiaries: []  // Array to hold each beneficiary and their document status
                };
            }

            // Populate beneficiaries and their statuses
            const beneficiary = village.beneficiaryId;
            if (beneficiary) {
                // Find matching document data for the current beneficiary
                const beneficiaryDoc = beneficiaryDocs.find(doc => doc.beneficiaryId.toString() === beneficiary._id.toString());
                
                // Debug beneficiaryDoc mapping
                console.log("Beneficiary Doc for:", beneficiary.beneficiaryName, beneficiaryDoc);

                acc[khatauniSankhya].beneficiaries.push({
                    name: beneficiary.beneficiaryName || 'N/A',
                    documentStatus: beneficiaryDoc ? beneficiaryDoc.documentUploadedEach : 'Not Started',  // Track each beneficiary's document status
                    submissionStatus: beneficiaryDoc ? beneficiaryDoc.submissionStatus : 'Yet to be filled.'
                });
            }
            return acc;
        }, {});

        // Respond with success message and formatted data
        res.status(200).json({
            status: true,
            message: 'Village details fetched successfully',
            data: Object.values(groupedVillages),
        });
    } catch (error) {
        console.log("Error fetching village details:", error);  // Debug any errors
        next(new ErrorHandler('Error fetching village details', 500));
    }
});




// DONT TOUCH THIS CODE //

export const getBeneficiariesByKhatauniSankhya = catchAsyncError(async (req, res, next) => {
    try {
        const { khatauniSankhya } = req.query;
        console.log('Query Parameters:', { khatauniSankhya });

        // Validate query parameters
        if (!khatauniSankhya) {
            return next(new ErrorHandler('Khatauni Sankhya is required.', 200));
        }

        // Fetch all khatauni details matching the provided khatauniSankhya
        const villages = await khatauniDetailsWeb.find({
            khatauniSankhya: khatauniSankhya
        })
        .populate('beneficiaryId', 'beneficiaryId beneficiaryName')  // Populating beneficiary details
        .exec();

        if (!villages || villages.length === 0) {
            return next(new ErrorHandler('No beneficiaries found for the provided Khatauni Sankhya.', 200));
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
            status: true,
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


export const uploadDocs = async (req, res) => {
    try {
        let { beneficiaries, khatauniSankhya } = req.body;
        const files = req.files;
        // Parse beneficiaries if it's a string
        if (typeof beneficiaries === 'string') {
            beneficiaries = JSON.parse(beneficiaries);
        }
        // Check if beneficiaries is an array
        if (!Array.isArray(beneficiaries)) {
            return res.status(200).json({
                status: false,
                message: '`beneficiaries` should be an array.',
            });
        }
        // Validate required fields
        if (!beneficiaries.length || !khatauniSankhya) {
            return res.status(200).json({
                status: false,
                message: 'Required fields are missing.',
            });
        }
        const requiredFields = [
            'accountNumber', 'ifscCode', 'aadhaarNumber', 'panCardNumber', 'photo',
            'landIndemnityBond', 'structureIndemnityBond', 'uploadAffidavit',
            'aadhaarCard', 'panCard', 'chequeOrPassbook',
        ];
        // Process beneficiaries and handle document upload
        const processedBeneficiaries = beneficiaries.map((beneficiary, index) => {
            const extractFileName = (field) => {
                return (
                    files[`beneficiaries[${index}][${field}]`] &&
                    files[`beneficiaries[${index}][${field}]`][0]?.filename
                )
                    ? `${field}-${files[`beneficiaries[${index}][${field}]`][0]?.filename.split('-').pop()}`
                    : '';
            };
            // Check if at least one document is uploaded
            const hasDocumentSubmitted = requiredFields.some((field) => {
                return (
                    files[`beneficiaries[${index}][${field}]`] &&
                    files[`beneficiaries[${index}][${field}]`][0]?.filename
                );
            });
            // Validate consent fields before proceeding
            if (
                hasDocumentSubmitted &&
                (beneficiary.isConsent1 !== 'true' || beneficiary.isConsent2 !== 'true')
            ) {
                throw new Error(
                    `Both consents must be "true" for beneficiary: ${
                        beneficiary.beneficiaryName || 'unknown'
                    }`
                );
            }
            // Construct the beneficiary object with extracted file names
            return {
                beneficiaryId: beneficiary.beneficiaryId
                    ? new mongoose.Types.ObjectId(beneficiary.beneficiaryId)
                    : null,
                beneficiaryName: beneficiary.beneficiaryName || '',
                accountNumber: beneficiary.accountNumber || '',
                ifscCode: beneficiary.ifscCode || '',
                aadhaarNumber: beneficiary.aadhaarNumber || '',
                panCardNumber: beneficiary.panCardNumber || '',
                remarks: beneficiary.remarks || '',
                isConsent1: beneficiary.isConsent1 === 'true',
                isConsent2: beneficiary.isConsent2 === 'true',
                photo: extractFileName('photo'),
                landIndemnityBond: extractFileName('landIndemnityBond'),
                structureIndemnityBond: extractFileName('structureIndemnityBond'),
                uploadAffidavit: extractFileName('uploadAffidavit'),
                aadhaarCard: extractFileName('aadhaarCard'),
                panCard: extractFileName('panCard'),
                chequeOrPassbook: extractFileName('chequeOrPassbook'),
                khatauniSankhya: khatauniSankhya || '',
                documentUploadedEach: '', // Will be updated later based on conditions
            };
        });
        // Check if at least one document or detail is filled for any beneficiary
        const hasAtLeastOneField = processedBeneficiaries.some((beneficiary) => {
            return requiredFields.some((field) => beneficiary[field] && beneficiary[field].trim() !== '');
        });
        if (!hasAtLeastOneField) {
            return res.status(200).json({
                status: false,
                message: 'Please fill at least one document or detail for any beneficiary.',
            });
        }
        // Determine if all documents are filled for all beneficiaries
        const allDocsFilledForAllBeneficiaries = processedBeneficiaries.every((beneficiary) => {
            return requiredFields.every((field) => beneficiary[field] && beneficiary[field].trim() !== '');
        });
        // Initialize submissionStatus here
        const submissionStatus = allDocsFilledForAllBeneficiaries ? 'Completed' : 'Partial';
        for (const beneficiary of processedBeneficiaries) {
            // Check if all required documents are filled for each beneficiary
            const allDocsUploadedForBeneficiary = requiredFields.every(
                (field) => beneficiary[field] && beneficiary[field].trim() !== ''
            );
            beneficiary.documentUploadedEach = allDocsUploadedForBeneficiary ? 'completed' : 'incomplete';
            // Find or create the beneficiary document in the collection
            let beneficiaryDoc = await beneficiaryDocs.findOne({
                beneficiaryId: beneficiary.beneficiaryId,
                beneficiaryName: beneficiary.beneficiaryName,
                khatauniSankhya: beneficiary.khatauniSankhya,
            });
            if (beneficiaryDoc) {
                // Update existing document
                Object.assign(beneficiaryDoc, beneficiary);
                beneficiaryDoc.submissionStatus = submissionStatus; // Add submissionStatus to each beneficiary doc
            } else {
                // Create new document
                beneficiaryDoc = new beneficiaryDocs({ ...beneficiary, submissionStatus });
            }
            // Save the updated/new beneficiary document
            await beneficiaryDoc.save();
        }
        // Update the overall submission status for all documents under this khatauniSankhya
        await beneficiaryDocs.updateMany(
            { khatauniSankhya },
            { $set: { submissionStatus } }
        );
        // Return success response
        res.status(200).json({
            status: true,
            message: 'Documents and beneficiary details uploaded successfully',
            submissionStatus,
            data: processedBeneficiaries,
        });
    } catch (error) {
        console.error('Error uploading documents:', error);
        res.status(500).json({
            status: false,
            message: error.message || 'Error uploading documents',
        });
    }
};














