import beneficiarDetails from '../webModel/benificiaryDetail.js'; // Adjust the path based on your project structure
import beneficiarDisbursementDetails from '../webModel/beneficiaryDisbursementDetails.js';
import KhatauniDetailsWeb from '../webModel/khatauniDetailsSchema.js';
import { catchAsyncError } from '../../middleware/catchAsyncError.js';
import ErrorHandler from '../../middleware/error.js';
import beneficiaryDocs from '../../schema/beneficiaryDocDetailSchema.js';
import verifySchema from '../webModel/verification.js'; // Assuming you have a verifySchema
import BeneficiaryQuery from '../webModel/beneficiaryQuerySchema.js'; // Adjust the path as necessary
import villageSchema from '../webModel/villageListSchema.js'
import landPrice from '../webModel/landPrice.js'
import beneficiaryPaymentStatus from '../webModel/beneficiaryPaymentStatus.js'


// Controller to fetch all beneficiaries without any request parameters
export const getAllbeneficiaryDisburmentlist = async (req, res) => {
  try {
    // Extract and log user role
    const { role: userRole } = req.user;
    console.log('User Role:', userRole);

    // Fetch all beneficiaries
    const beneficiaries = await beneficiarDetails.find({})
      .populate('khatauniId', 'khatauniSankhya serialNumber khasraNumber acquiredKhasraNumber areaVariety acquiredRakbha')
      .populate('landPriceId', 'landPricePerSqMtr')
      .populate('villageId', 'villageName')
      .select('beneficiaryName beneficiaryStatus beneficiaryType beneficiaryShare acquiredBeneficiaryShare isDisputed khatauniId landPriceId villageId nokId poaId nokHId poaHId isDocumentUploaded isDisbursementUploaded verificationStatus hasQuery verificationLevel');
    
    console.log('Total Beneficiaries fetched:', beneficiaries.length);

    // Transform beneficiaries
    const transformedBeneficiaries = await Promise.all(beneficiaries.map(async (b) => {
      const verifyData = await verifySchema.findOne({ beneficiaryId: b._id }).select('status verificationLevel');
      const queryData = await BeneficiaryQuery.findOne({ beneficiaryId: b._id }).select('queryLevel');
      const docs = await beneficiaryDocs.findOne({ beneficiaryId: b._id }).select('aadhaarNumber panCardNumber');

      console.log(`Beneficiary ID: ${b._id}, Verification Data:`, verifyData, 'Docs:', docs);

      return {
        beneficiaryName: b.beneficiaryName,
        beneficiaryId: b._id,
        isDisputed: b.isDisputed,
        beneficiaryStatus: b.beneficiaryStatus,
        beneficiaryType:b.beneficiaryType,
        villageId: b.villageId?._id || '',
        villageName: b.villageId?.villageName || '',
        khatauniSankhya: b.khatauniId?.khatauniSankhya || '',
        serialNumber: b.khatauniId?.serialNumber || '',
        khasraNumber: b.khatauniId?.khasraNumber || '',
        acquiredKhasraNumber: b.khatauniId?.acquiredKhasraNumber || '',
        areaVariety: b.khatauniId?.areaVariety || '',
        acquiredRakbha: b.khatauniId?.acquiredRakbha || '',
        beneficiaryShare: b.beneficiaryShare,
        acquiredBeneficiaryShare: b.acquiredBeneficiaryShare,
        landPricePerSqMt: b.landPriceId?.landPricePerSqMtr || '',
        nokId: b.nokId || '',
        poaId: b.poaId || '',
        nokHIds: b.nokHId ? [b.nokHId] : [],
        poaHIds: b.poaHId ? [b.poaHId] : [],
        isDocumentsUploaded: docs ? '1' : '0',
        aadhar:docs?.aadhaarNumber || '',
        pancard:docs?.panCardNumber || '',
        isDisbursementUploaded: b.isDisbursementUploaded || '0',
        hasQuery:queryData ? '1' : '0',
        verificationStatus: verifyData?.status || '',
        verificationLevel: verifyData ? verifyData.verificationLevel : "0",
      };
    }));

    console.log('Transformed Beneficiaries:', JSON.stringify(transformedBeneficiaries, null, 2));

    // Filter based on user role
    const filteredBeneficiaries = transformedBeneficiaries.filter(b => {
      console.log(`Beneficiary: ${b.beneficiaryName}, Verification Level: ${b.verificationLevel}`);

      if (userRole === '0') return b.verificationLevel === "0";
      if (userRole === '1') return b.verificationLevel === "0" || b.verificationLevel === "1";
      if (userRole === '2') return b.verificationLevel === "1" || b.verificationLevel === "2";
      if (userRole === '3') return b.verificationLevel === "2" || b.verificationLevel === "3";

      return false;
    });

    console.log('Filtered Beneficiaries:', filteredBeneficiaries.length);

    // Return filtered beneficiaries
    return res.status(200).json({ success: true, beneficiaries: filteredBeneficiaries });
  } catch (error) {
    console.error('Error fetching beneficiaries:', error);
    return res.status(500).json({ success: false, message: 'Server error occurred while fetching beneficiaries.', error: error.message });
  }
};


// Controller to post disbursement details for multiple beneficiaries
export const createDisbursementDetails = async (req, res) => {
  const { beneficiaries } = req.body;

  if (!beneficiaries || beneficiaries.length === 0) {
    return res.status(400).json({ message: 'No beneficiaries provided' });
  }

  try {
    const userId = req.user.id; // Ensure userId is available
    if (!userId) {
      return res.status(400).json({ message: 'User ID is missing' });
    }

    const disbursementDetailsArray = await Promise.all(
      beneficiaries.map(async (beneficiary) => {
        // Fetch villageId from beneficiarDetailsSchema using beneficiaryId
        const beneficiaryDetails = await beneficiarDetails.findById(beneficiary.beneficiaryId).select('villageId isDisbursementUploaded');
        if (!beneficiaryDetails) {
          throw new Error(`Beneficiary with ID ${beneficiary.beneficiaryId} not found`);
        }

        // Check if disbursement details already exist for the beneficiary
        let disbursementDetails = await beneficiarDisbursementDetails.findOne({ beneficiaryId: beneficiary.beneficiaryId });

        if (disbursementDetails) {
          // Update existing disbursement details
          disbursementDetails.bhumiPrice = beneficiary.bhumiPrice;
          disbursementDetails.faldaarBhumiPrice = beneficiary.faldaarBhumiPrice;
          disbursementDetails.landPricePerSqMt = beneficiary.landPricePerSqMt;
          disbursementDetails.gairFaldaarBhumiPrice = beneficiary.gairFaldaarBhumiPrice;
          disbursementDetails.housePrice = beneficiary.housePrice;
          disbursementDetails.toshan = beneficiary.toshan;
          disbursementDetails.interest = beneficiary.interest;
          disbursementDetails.totalCompensation = beneficiary.totalCompensation;
          disbursementDetails.vivran = beneficiary.vivran || 0;
          disbursementDetails.isDisputed = beneficiary.isDisputed || "0";
          disbursementDetails.isConsent = beneficiary.isConsent || "0";
          disbursementDetails.isAproved = beneficiary.isAproved || "0";
          disbursementDetails.isRejected = beneficiary.isRejected || "0";
          disbursementDetails.rejectedMessage = beneficiary.rejectedMessage || "";
          disbursementDetails.villageId = beneficiaryDetails.villageId;
          disbursementDetails.userId = userId;

          // Save the updated disbursement details
          await disbursementDetails.save();
        } else {
          // Create new disbursement details if none exist
          disbursementDetails = new beneficiarDisbursementDetails({
            bhumiPrice: beneficiary.bhumiPrice,
            landPricePerSqMt: beneficiary.landPricePerSqMt,
            faldaarBhumiPrice: beneficiary.faldaarBhumiPrice,
            gairFaldaarBhumiPrice: beneficiary.gairFaldaarBhumiPrice,
            housePrice: beneficiary.housePrice,
            toshan: beneficiary.toshan,
            interest: beneficiary.interest,
            totalCompensation: beneficiary.totalCompensation,
            vivran: beneficiary.vivran || 0,
            isDisputed: beneficiary.isDisputed || "0",
            isConsent: beneficiary.isConsent || "0",
            isAproved: beneficiary.isAproved || "0",
            isRejected: beneficiary.isRejected || "0",
            rejectedMessage: beneficiary.rejectedMessage || "",
            beneficiaryId: beneficiary.beneficiaryId,
            villageId: beneficiaryDetails.villageId,
            userId: userId,
          });

          // Save the new disbursement details
          await disbursementDetails.save();
        }

        // After saving/updating disbursement details, ensure `isDisbursementUploaded` is updated to 1
        if (beneficiaryDetails.isDisbursementUploaded !== '1') {
          beneficiaryDetails.isDisbursementUploaded = '1';
          await beneficiaryDetails.save(); // Save the beneficiary record with updated isDisbursementUploaded
        }

        return disbursementDetails;
      })
    );

    res.status(201).json({
      userId: userId,
      beneficiaries: disbursementDetailsArray,
      message: 'Disbursement details created/updated and marked as uploaded',
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success:false,
      message: 'Error creating/updating disbursement details',
      error: error.message,
    });
  }
};


// number 07 
export const disbursePage = catchAsyncError(async (req, res, next) => {
  try {
    const { villageId, khatauniSankhya } = req.query;

    // Check if both villageId and khatauniSankhya are provided
    if (!villageId || !khatauniSankhya) {
      return next(new ErrorHandler('villageId or khatauniSankhya is missing.', 400));
    }

    // Fetch the khatauni details and associated beneficiaries
    const khatauniDetailsData = await KhatauniDetailsWeb.find({ villageId, khatauniSankhya });

    if (!khatauniDetailsData.length) {
      return next(new ErrorHandler('villageId or KhatauniSankhya does not exist.', 404));
    }

    // Extract beneficiary IDs from the fetched khatauni details
    const beneficiaryIds = khatauniDetailsData.map(detail => detail.beneficiaryId);

    // Fetch all required details for each beneficiary
    const beneficiariesData = await Promise.all(beneficiaryIds.map(async (beneficiaryId) => {
      // First, fetch beneficiarySelfDetails
      const beneficiarySelfDetails = await beneficiarDetails.findOne({ _id: beneficiaryId });

      if (!beneficiarySelfDetails) {
        console.warn(`No self details found for beneficiaryId: ${beneficiaryId}`); // Warning log
        return null; // Skip if no self details
      }

      // Fetch other details using the beneficiarySelfDetails
      const [
        beneficiaryDisbursement,
        beneficiaryDocsUploadedList,
        verificationData,
        villageData,
        khatauniDetails,
        queryData,
        landPriceDetails,
      ] = await Promise.all([
        beneficiarDisbursementDetails.findOne({ beneficiaryId }),
        beneficiaryDocs.findOne({ beneficiaryId }),
        verifySchema.findOne({ beneficiaryId }),
        villageSchema.findOne({ _id: beneficiarySelfDetails?.villageId }),
        KhatauniDetailsWeb.findOne({ beneficiaryId }),
        BeneficiaryQuery.findOne({ beneficiaryId }),
        beneficiarySelfDetails?.landPriceId ? landPrice.findOne({ _id: beneficiarySelfDetails.landPriceId }) : null,
      ]);

      const landPricePerSqMt = landPriceDetails?.landPricePerSqMtr || '';

      return {
        beneficiaryId: beneficiarySelfDetails._id,
        beneficiaryName: beneficiarySelfDetails.beneficiaryName || '',
        villageName: villageData?.villageName || '',
        khatauniSankhya: khatauniSankhya,
        beneficiaryType:beneficiarySelfDetails.beneficiaryType || '',
        nokId:beneficiarySelfDetails.nokId || '',
        poaId:beneficiarySelfDetails.poaId || '',
        nokHIds:beneficiarySelfDetails.nokHIds || [''],
        poaHIds:beneficiarySelfDetails.poaHIds || [''],
        serialNumber: khatauniDetails?.serialNumber || '',
        khasraNumber: khatauniDetails?.khasraNumber || '',
        acquiredKhasraNumber: khatauniDetails?.acquiredKhasraNumber || '',
        areaVariety: khatauniDetails?.areaVariety || '',
        acquiredRakbha: khatauniDetails?.acquiredRakbha || '',
        beneficiaryShare: beneficiarySelfDetails.beneficiaryShare || '',
        acquiredBeneficiaryShare: beneficiarySelfDetails.acquiredBeneficiaryShare || '',
        landPricePerSqMt: landPricePerSqMt,
        isDocumentsUploaded: beneficiaryDocsUploadedList ? 1 : 0,
        isDisbursementUploaded: beneficiarySelfDetails.isDisbursementUploaded || '0',
        verificationDetails: {
          level: verificationData ? verificationData.verificationLevel : '0', // Default to 0 if verificationData is not present
          status: verificationData?.status || '',
          updatedBy: verificationData?.updatedBy || '',
          updatedAt: verificationData?.updatedAt || '',
          userRole: verificationData?.userRole || '',
          userId: verificationData?.userId || '',
          rejectionMessage:verificationData || '',
        },
        queryMessages: queryData?.queryMessages.map(msg => ({
          _id: msg._id || '',
          message: msg.message || '',
          updatedBy: msg.updatedBy || '',
          updatedAt: msg.updatedAt || '',
          userRole: msg.userRole || '',
          name: msg.name || '',
          attachment:msg.attachment
        })) || [],
        disbursementDetails: {
          bhumiPrice: beneficiaryDisbursement?.bhumiPrice || '',
          faldaarBhumiPrice: beneficiaryDisbursement?.faldaarBhumiPrice || '',
          gairFaldaarBhumiPrice: beneficiaryDisbursement?.gairFaldaarBhumiPrice || '',
          housePrice: beneficiaryDisbursement?.housePrice || '',
          toshan: beneficiaryDisbursement?.toshan || '',
          interest: beneficiaryDisbursement?.interest || '',
          totalCompensation: beneficiaryDisbursement?.totalCompensation || '',
          vivran: beneficiaryDisbursement?.vivran || '',
        },
        bankDetails: {
          accountNumber: beneficiaryDocsUploadedList?.accountNumber || '',
          pancardNumber:beneficiaryDocsUploadedList?.panCardNumber || '',
          ifscCode: beneficiaryDocsUploadedList?.ifscCode || '',
          // bankName: beneficiaryDocsUploadedList?.bankName || '',
          // bankBranch: beneficiaryDocsUploadedList?.bankBranch || '',
          aadhaarNumber: beneficiaryDocsUploadedList?.aadhaarNumber || '',
          paymentInvoice: beneficiaryDocsUploadedList?.paymentInvoice || '',
        },
        documents: {
          landIndemnityBond: beneficiaryDocsUploadedList?.landIndemnityBond || '',
          structureIndemnityBond: beneficiaryDocsUploadedList?.structureIndemnityBond || '',
          affidavit: beneficiaryDocsUploadedList?.uploadAffidavit || '',
          aadharCard: beneficiaryDocsUploadedList?.aadhaarCard || '',
          pancard: beneficiaryDocsUploadedList?.panCard || '',
          checkORpassbook: beneficiaryDocsUploadedList?.chequeOrPassbook || '',
          photo: beneficiaryDocsUploadedList?.photo || '',
        },
      };
    }));

    // Filter out any null values from beneficiariesData
    const filteredBeneficiariesData = beneficiariesData.filter(b => b !== null);
    // Fetch the user role
    const { role: userRole } = req.user;
    // Filter beneficiaries based on user role
    const finalBeneficiariesData = filteredBeneficiariesData.filter(b => {
      const level = b.verificationDetails.level;
      const roleLevels = {
        '0': ['0'],
        '1': ['0', '1'],
        '2': ['1', '2'],
        '3': ['2', '3'],
      };
      const isAllowed = roleLevels[userRole]?.includes(level);
      return isAllowed;
    });
    // Return the response with filtered beneficiary data
    res.status(200).json({
      success: true,
      message: 'Successfull',
      beneficiaries: finalBeneficiariesData,
    });
  } catch (error) {
    console.error("Error in disbursePage:", error); // Error log
    next(error);
  }
});


// get all bnefeciary
export const getAllBeneficiaries = async (req, res) => {
  try {
    const { villageId } = req.query;
    const { role: userRole } = req.user; // Get user role from the authentication middleware    

    if (!villageId) {
      return res.status(400).json({ status: false, message: 'villageId is required' });
    }

    // Fetch beneficiaries based on villageId
    const beneficiaries = await beneficiarDetails.find({ villageId })
      .populate('khatauniId', 'khatauniSankhya serialNumber khasraNumber acquiredKhasraNumber areaVariety acquiredRakbha')
      .populate('landPriceId', 'landPricePerSqMtr')
      .populate('villageId', 'villageName')
      .select('beneficiaryName beneficiaryStatus beneficiaryShare acquiredBeneficiaryShare isDisputed khatauniId landPriceId villageId nokId poaId nokHId poaHId isDocumentUploaded isDisbursementUploaded');

    const transformedBeneficiaries = await Promise.all(beneficiaries.map(async b => {
      // Fetch verification details for the current beneficiary
      const verificationData = await verifySchema.findOne({ beneficiaryId: b._id });
      
      // If verificationData doesn't exist, default the verification level to 0
      const verificationLevel = verificationData ? verificationData.verificationLevel : '0';
    
      // Apply user role-based filtering
      const isAllowed = (userRole === '0' && verificationLevel === '0') ||
                        (userRole === '1' && (verificationLevel === '0' || verificationLevel === '1')) ||
                        (userRole === '2' && (verificationLevel === '1' || verificationLevel === '2')) ||
                        (userRole === '3' && (verificationLevel === '2' || verificationLevel === '3'));
    
      // If not allowed, return null (which will be filtered out later)
      if (!isAllowed) return null;
    
      // Fetch disbursement details for each beneficiary
      const disbursementDetails = await beneficiarDisbursementDetails.findOne({ beneficiaryId: b._id });
    
      return {
        beneficiaryName: b.beneficiaryName,
        beneficiaryId: b._id,
        isDisputed: b.isDisputed,
        beneficiaryStatus: b.beneficiaryStatus,
        villageId: b.villageId?._id || '',
        villageName: b.villageId?.villageName || '',
        khatauniSankhya: b.khatauniId?.khatauniSankhya || '',
        serialNumber: b.khatauniId?.serialNumber || '',
        khasraNumber: b.khatauniId?.khasraNumber || '',
        acquiredKhasraNumber: b.khatauniId?.acquiredKhasraNumber || '',
        areaVariety: b.khatauniId?.areaVariety || '',
        acquiredRakbha: b.khatauniId?.acquiredRakbha || '',
        beneficiaryShare: b.beneficiaryShare,
        acquiredBeneficiaryShare: b.acquiredBeneficiaryShare,
        landPricePerSqMt: b.landPriceId?.landPricePerSqMtr || '',
        isDocumentsUploaded: b.isDocumentUploaded || '0',
        isDisbursementUploaded: b.isDisbursementUploaded, // This should fetch the exact value from the collection
        // If disbursement details exist, use them; otherwise, default to zeros
        bhumiPrice: disbursementDetails?.bhumiPrice || 0,
        faldaarBhumiPrice: disbursementDetails?.faldaarBhumiPrice || 0,
        gairFaldaarBhumiPrice: disbursementDetails?.gairFaldaarBhumiPrice || 0,
        housePrice: disbursementDetails?.housePrice || 0,
        toshan: disbursementDetails?.toshan || 0,
        interest: disbursementDetails?.interest || 0,
        totalCompensation: disbursementDetails?.totalCompensation || 0,
        vivran: disbursementDetails?.vivran || '',
      };
    }));

    // Filter out any null beneficiaries (i.e., those that didn't match the user role-based filter)
    const filteredBeneficiaries = transformedBeneficiaries.filter(b => b !== null);

    res.status(200).json({
      success: true,
      beneficiaries: filteredBeneficiaries,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error,
    });
  }
};

// Controller to create BeneficiaryQuery and add a queryMessage to the array
export const createBeneficiaryQuery = async (req, res) => {
  try {
    const { beneficiaryId, message, queryLevel } = req.body;

    // Extract user information from the request object as set by the middleware
    const userId = req.user.id;        // userId is attached from authentication
    const updatedBy = req.user.name;   // userName is attached from authentication
    const userRole = req.user.role;    // userRole is attached from authentication

    // Step 1: Check if a BeneficiaryQuery already exists for the beneficiaryId
    let beneficiaryQuery = await BeneficiaryQuery.findOne({ beneficiaryId });

    if (!beneficiaryQuery) {
      // If no BeneficiaryQuery exists, create a new one
      beneficiaryQuery = new BeneficiaryQuery({
        beneficiaryId: beneficiaryId,
        userId: userId,
        queryMessages: [],
        queryLevel:queryLevel 
      });
    }

    // Step 2: Add the new message to the queryMessages array
    const newQueryMessage = {
      updatedBy: updatedBy,
      updatedAt: new Date(),
      message: message,
      queryLevel:queryLevel,
      userRole: userRole,
      name: updatedBy
    };

    // Push the new message to the queryMessages array
    beneficiaryQuery.queryMessages.push(newQueryMessage);

    // Save the BeneficiaryQuery document (with the new message)
    const savedBeneficiaryQuery = await beneficiaryQuery.save();

    // Return success response with the updated BeneficiaryQuery
    res.status(201).json({
      success: true,
      message: 'Beneficiary query and message created successfully',
      beneficiaryQuery: savedBeneficiaryQuery,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Failed to create beneficiary query and message',
      error: error.message,
    });
  }
};


// verify
// Updated controller using requireAuth middleware to fetch user data
export const verifyBeneficiaryDetails = catchAsyncError(async (req, res, next) => {
  try {
    // Log the req.user object to ensure it's attached by the middleware
    console.log('req.user in controller:', req.user);

    const { beneficiaryId, status, rejectionMessage } = req.body;

    // Ensure that req.user is properly populated
    if (!req.user) {
      throw new ErrorHandler('Authentication failed, user not found', 401);
    }

    // Extract user information from the request object as set by the middleware
    const userId = req.user.id;        // userId is attached from authentication
    const updatedBy = req.user.name;   // userName is attached from authentication
    const userRole = req.user.role;    // userRole is attached from authentication

    // Log the extracted user information for debugging
    console.log('Extracted userId:', userId);
    console.log('Extracted updatedBy:', updatedBy);
    console.log('Extracted userRole:', userRole);

    // Check if all required fields are present
    if (!beneficiaryId) {
      throw new ErrorHandler('Missing beneficiaryId', 400);
    }
    if (!userId) {
      throw new ErrorHandler('Missing userId', 400);
    }
    if (status === undefined) {
      throw new ErrorHandler('Missing status', 400);
    }

    // Fetch existing verification record (if exists)
    let verificationDetails = await verifySchema.findOne({ beneficiaryId });

    // Log the verification details fetched from the database
    console.log('Fetched verificationDetails:', verificationDetails);

    // If no verification record exists, create a new one
    if (!verificationDetails) {
      verificationDetails = await verifySchema.create({
        beneficiaryId,
        updatedBy,
        userRole,
        userId,
        status,
        verificationLevel: "1",
        rejectionMessage: status === "0" ? rejectionMessage : undefined,
      });
    } else {
      // Log existing verification record for debugging
      console.log('Updating existing verification record');

      // Update the verificationLevel or status if a record exists
      if (status === "1") {
        // verificationDetails.verificationLevel += 1;
        verificationDetails.verificationLevel = parseInt(verificationDetails.verificationLevel, 10) + 1;
        verificationDetails.status = status;
        verificationDetails.rejectionMessage = undefined;
      } else if (status === "0") {
        verificationDetails.status = status;
        verificationDetails.rejectionMessage = rejectionMessage;
      } else {
        throw new ErrorHandler('Invalid status value', 400);
      }
      await verificationDetails.save();
    }

    // Log verification level before creating a payment record
    console.log('Verification level after update:', verificationDetails.verificationLevel);

    // If verificationLevel is 3, create a payment record
    if (verificationDetails.verificationLevel === "3") {
      const disbursementDetails = await beneficiarDisbursementDetails.findOne({ beneficiaryId });
      if (!disbursementDetails) {
        throw new ErrorHandler('Disbursement details not found', 400);
      }

      const beneficiaryDoc = await beneficiaryDocs.findOne({ beneficiaryId });
      if (!beneficiaryDoc) {
        throw new ErrorHandler('Beneficiary document details not found', 400);
      }

      // Log beneficiary document and disbursement details for debugging
      console.log('Creating payment record with disbursement and beneficiary details');

      const paymentStatus = await beneficiaryPaymentStatus.create({
        accountInfo: {
          email: beneficiaryDoc?.email || 'N/A',
          accountNumber: beneficiaryDoc?.accountNumber || 'N/A',
          ifscCode: beneficiaryDoc?.ifscCode || 'N/A',
          bankName: beneficiaryDoc?.bankName || 'N/A',
          bankBranch: beneficiaryDoc?.bankBranch || 'N/A',
        },
        paymentStatus: '0',
        beneficiaryId,
        disbursementId: disbursementDetails._id,
        userId,
      });

      return res.status(200).json({
        success: true,
        message: 'Beneficiary details approved and payment record created.',
        verificationLevel: verificationDetails.verificationLevel,
        data: {
          verificationDetails,
          paymentStatus,
        },
      });
    }

    // Log the final response based on status
    console.log('Sending final response based on status:', status);

    // Send response based on status
    if (status === "1") {
      return res.status(200).json({
        success: true,
        message: 'Beneficiary details approved successfully.',
        verificationLevel: verificationDetails.verificationLevel,
        data: verificationDetails,
      });
    } else if (status === "0") {
      return res.status(200).json({
        success: true,
        message: 'Beneficiary details rejected.',
        verificationLevel: verificationDetails.verificationLevel,
        rejectionMessage,
        data: verificationDetails,
      });
    }
  } catch (error) {
    console.error('Error in verifyBeneficiaryDetails:', error);
    next(error);
  }
});


// benfeciary paymeent status list
export const getAllBeneficiariesPaymentStatus = async (req, res) => {
  try {
    // Fetch beneficiaries based on villageId
    const beneficiaries = await beneficiarDetails.find()
      .populate('khatauniId', 'khatauniSankhya serialNumber khasraNumber acquiredKhasraNumber areaVariety acquiredRakbha') // Populating khatauni details
      .populate('villageId', 'villageName') // Populating village name from villageListSchema
      .select('beneficiaryName beneficiaryStatus beneficiaryShare acquiredBeneficiaryShare khatauniId landPriceId villageId');

    if (beneficiaries.length === 0) {
      return res.status(404).json({ status: false, message: 'No beneficiaries found for this village' });
    }

    // Filter beneficiaries to keep only those with payment status
    const beneficiariesWithPaymentStatus = await Promise.all(beneficiaries.map(async b => {
      const paymentStatus = await beneficiaryPaymentStatus.findOne({ beneficiaryId: b._id })
        .select('paymentStatus totalCompensation');

      if (paymentStatus) {
        return {
          beneficiaryName: b.beneficiaryName,
          beneficiaryId: b._id,
          beneficiaryStatus: b.beneficiaryStatus,
          villageName: b.villageId?.villageName || '',
          villageId: b.villageId?._id,
          khatauniSankhya: b.khatauniId?.khatauniSankhya || '',
          serialNumber: b.khatauniId?.serialNumber || '',
          khasraNumber: b.khatauniId?.khasraNumber || '',
          acquiredKhasraNumber: b.khatauniId?.acquiredKhasraNumber || '',
          areaVariety: b.khatauniId?.areaVariety || '',
          acquiredRakbha: b.khatauniId?.acquiredRakbha || '',
          beneficiaryShare: b.beneficiaryShare,
          acquiredBeneficiaryShare: b.acquiredBeneficiaryShare,
          totalCompensation: paymentStatus.totalCompensation || '0',
          paymentStatus: paymentStatus.paymentStatus || '0'
        };
      }

      // Return null if no payment status found for this beneficiary
      return null;
    }));

    // Filter out null entries (those without a payment status)
    const filteredBeneficiaries = beneficiariesWithPaymentStatus.filter(b => b !== null);

    if (filteredBeneficiaries.length === 0) {
      return res.status(404).json({ status: false, message: 'No beneficiaries found with payment status' });
    }

    res.status(200).json({ success: true, beneficiaries: filteredBeneficiaries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};

