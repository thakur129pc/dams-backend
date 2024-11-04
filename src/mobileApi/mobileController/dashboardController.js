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



// upload docs
export const uploadDocs = async (req, res) => {
    try {
        let { beneficiaries, khatauniSankhya } = req.body;
        const files = req.files;

        // Parse beneficiaries if it's a string
        if (typeof beneficiaries === 'string') {
            beneficiaries = JSON.parse(beneficiaries);
        }
        // Validate beneficiaries array
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

        // First pass: Process each beneficiary and update document details
        const processedBeneficiaries = await Promise.all(
            beneficiaries.map(async (beneficiary, index) => {
                const beneficiaryName = Array.isArray(beneficiary.beneficiaryName)
                    ? beneficiary.beneficiaryName.join(', ')
                    : beneficiary.beneficiaryName || '';

                // Fetch existing document if available
                let existingDoc = await beneficiaryDocs.findOne({
                    beneficiaryId: beneficiary.beneficiaryId,
                    khatauniSankhya: khatauniSankhya
                });

                // Create or update document data by keeping existing files where no new file is uploaded
                const beneficiaryData = {
                    beneficiaryId: beneficiary.beneficiaryId ? new mongoose.Types.ObjectId(beneficiary.beneficiaryId) : null,
                    beneficiaryName,
                    accountNumber: beneficiary.accountNumber || (existingDoc ? existingDoc.accountNumber : ''),
                    ifscCode: beneficiary.ifscCode || (existingDoc ? existingDoc.ifscCode : ''),
                    aadhaarNumber: beneficiary.aadhaarNumber || (existingDoc ? existingDoc.aadhaarNumber : ''),
                    panCardNumber: beneficiary.panCardNumber || (existingDoc ? existingDoc.panCardNumber : ''),
                    remarks: beneficiary.remarks || (existingDoc ? existingDoc.remarks : ''),
                    isConsent1: beneficiary.isConsent1 === 'true',
                    isConsent2: beneficiary.isConsent2 === 'true',
                    photo: extractFileName('photo', index) || (existingDoc ? existingDoc.photo : ''),
                    landIndemnityBond: extractFileName('landIndemnityBond', index) || (existingDoc ? existingDoc.landIndemnityBond : ''),
                    structureIndemnityBond: extractFileName('structureIndemnityBond', index) || (existingDoc ? existingDoc.structureIndemnityBond : ''),
                    uploadAffidavit: extractFileName('uploadAffidavit', index) || (existingDoc ? existingDoc.uploadAffidavit : ''),
                    aadhaarCard: extractFileName('aadhaarCard', index) || (existingDoc ? existingDoc.aadhaarCard : ''),
                    panCard: extractFileName('panCard', index) || (existingDoc ? existingDoc.panCard : ''),
                    chequeOrPassbook: extractFileName('chequeOrPassbook', index) || (existingDoc ? existingDoc.chequeOrPassbook : ''),
                    khatauniSankhya: khatauniSankhya
                };

                // Upsert document data (insert if doesn't exist, otherwise update)
                const beneficiaryDoc = await beneficiaryDocs.findOneAndUpdate(
                    { beneficiaryId: beneficiaryData.beneficiaryId, beneficiaryName, khatauniSankhya },
                    beneficiaryData,
                    { new: true, upsert: true }
                );

                return beneficiaryDoc;
            })
        );

        // Second pass: Update documentUploadedEach and isDocumentUploaded based on uploaded documents
        const updatedBeneficiaries = await Promise.all(
            processedBeneficiaries.map(async (beneficiaryDoc) => {
                // Check if all required docs are uploaded
                const allDocsUploaded = requiredFields.every(
                    field => beneficiaryDoc[field] && beneficiaryDoc[field].trim() !== ''
                );
                beneficiaryDoc.documentUploadedEach = allDocsUploaded ? 'completed' : 'incomplete';

                // Save document with updated status
                await beneficiaryDoc.save();

                // Update isDocumentUploaded in beneficiarDetails if all documents are uploaded and consents are true
                if (beneficiaryDoc.documentUploadedEach === 'completed' &&
                    beneficiaryDoc.isConsent1 && beneficiaryDoc.isConsent2) {
                    await beneficiarDetails.findOneAndUpdate(
                        { _id: beneficiaryDoc.beneficiaryId },
                        { $set: { isDocumentUploaded: "1" } },
                        { new: true }
                    );
                }

                return beneficiaryDoc;
            })
        );

        // Update submissionStatus for all beneficiaries with the same khatauniSankhya
        const allDocsFilledForAllBeneficiaries = updatedBeneficiaries.every(
            beneficiary => beneficiary.documentUploadedEach === 'completed'
        );
        const submissionStatus = allDocsFilledForAllBeneficiaries ? 'Completed' : 'Partial';
        await beneficiaryDocs.updateMany(
            { khatauniSankhya },
            { $set: { submissionStatus } }
        );

        res.status(200).json({
            status: true,
            message: 'Documents and beneficiary details uploaded successfully',
            processedBeneficiaries: updatedBeneficiaries
        });
    } catch (error) {
        console.error('Error uploading documents:', error);
        res.status(500).json({
            status: false,
            message: error.message || 'Error uploading documents',
        });
    }
};
