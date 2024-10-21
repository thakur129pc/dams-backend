import beneficiarDetails from "../webModel/benificiaryDetail.js"; // Adjust the path based on your project structure
import beneficiarDisbursementDetails from "../webModel/beneficiaryDisbursementDetails.js";
import KhatauniDetailsWeb from "../webModel/khatauniDetailsSchema.js";
import { catchAsyncError } from "../../middleware/catchAsyncError.js";
import ErrorHandler from "../../middleware/errorWeb.js";
import beneficiaryDocs from "../../schema/beneficiaryDocDetailSchema.js";
import verifySchema from "../webModel/verification.js"; // Assuming you have a verifySchema
import BeneficiaryQuery from "../webModel/beneficiaryQuerySchema.js"; // Adjust the path as necessary
import villageSchema from "../webModel/villageListSchema.js";
import landPrice from "../webModel/landPrice.js";
import beneficiaryPaymentStatus from "../webModel/beneficiaryPaymentStatus.js";
import path from "path";
import mongoose from "mongoose";

// Controller to fetch all beneficiaries without any request parameters
export const getAllbeneficiaryDisburmentlist = async (req, res) => {
  try {
    // Extract and log user role
    const { role: userRole } = req.user;

    // Fetch all beneficiaries
    const beneficiaries = await beneficiarDetails
      .find({})
      .populate(
        "khatauniId",
        "khatauniSankhya serialNumber khasraNumber acquiredKhasraNumber areaVariety acquiredRakbha"
      )
      .populate("landPriceId", "landPricePerSqMtr")
      .populate("villageId", "villageName")
      .select(
        "beneficiaryName beneficiaryStatus beneficiaryType beneficiaryShare acquiredBeneficiaryShare isDisputed khatauniId landPriceId villageId benefactorId legalHeirs isDocumentUploaded isDisbursementUploaded verificationStatus hasQuery verificationLevel"
      );

    // Transform beneficiaries
    const transformedBeneficiaries = await Promise.all(
      beneficiaries.map(async (b) => {
        const verifyData = await verifySchema
          .findOne({ beneficiaryId: b._id })
          .select("status verificationLevel");
        const queryData = await BeneficiaryQuery.findOne({
          beneficiaryId: b._id,
        });
        const docs = await beneficiaryDocs
          .findOne({ beneficiaryId: b._id })
          .select("aadhaarNumber panCardNumber");

        return {
          beneficiaryName: b.beneficiaryName,
          beneficiaryId: b._id,
          isDisputed: b.isDisputed,
          beneficiaryStatus: b.beneficiaryStatus,
          beneficiaryType: b.beneficiaryType,
          villageId: b.villageId?._id || "",
          villageName: b.villageId?.villageName || "",
          khatauniSankhya: b.khatauniId?.khatauniSankhya || "",
          serialNumber: b.khatauniId?.serialNumber || "",
          khasraNumber: b.khatauniId?.khasraNumber || "",
          acquiredKhasraNumber: b.khatauniId?.acquiredKhasraNumber || "",
          areaVariety: b.khatauniId?.areaVariety || "",
          acquiredRakbha: b.khatauniId?.acquiredRakbha || "",
          beneficiaryShare: b.beneficiaryShare,
          acquiredBeneficiaryShare: b.acquiredBeneficiaryShare,
          landPricePerSqMt: b.landPriceId?.landPricePerSqMtr || "",
          benefactorId: b.benefactorId || "",
          legalHeirs: b.legalHeirs || [],
          isDocumentsUploaded: docs ? "1" : "0",
          aadhar: docs?.aadhaarNumber || "",
          pancard: docs?.panCardNumber || "",
          isDisbursementUploaded: b.isDisbursementUploaded || "0",
          hasQuery: queryData?.status || "0",
          verificationStatus: verifyData?.status || "",
          verificationLevel: verifyData ? verifyData.verificationLevel : "0",
        };
      })
    );

    // Filter based on user role
    const filteredBeneficiaries = transformedBeneficiaries.filter((b) => {
      if (userRole === "0")
        return b.verificationLevel === "0" || b.verificationLevel === "4";
      if (userRole === "1")
        return b.verificationLevel === "0" || b.verificationLevel === "1";
      if (userRole === "2")
        return b.verificationLevel === "1" || b.verificationLevel === "2";
      if (userRole === "3")
        return b.verificationLevel === "2" || b.verificationLevel === "3";

      return false;
    });

    // Return filtered beneficiaries
    return res
      .status(200)
      .json({ success: true, beneficiaries: filteredBeneficiaries });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error occurred while fetching beneficiaries.",
      error: error.message,
    });
  }
};

// Controller to post disbursement details for multiple beneficiaries
export const createDisbursementDetails = async (req, res) => {
  const { beneficiaries } = req.body;

  if (!beneficiaries || beneficiaries.length === 0) {
    return res.status(400).json({ message: "No beneficiaries provided" });
  }

  try {
    const userId = req.user.id; // Ensure userId is available
    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    const disbursementDetailsArray = await Promise.all(
      beneficiaries.map(async (beneficiary) => {
        // Fetch villageId from beneficiarDetailsSchema using beneficiaryId
        const beneficiaryDetails = await beneficiarDetails
          .findById(beneficiary.beneficiaryId)
          .select("villageId isDisbursementUploaded");
        if (!beneficiaryDetails) {
          throw new Error(
            `Beneficiary with ID ${beneficiary.beneficiaryId} not found`
          );
        }

        // Check if disbursement details already exist for the beneficiary
        let disbursementDetails = await beneficiarDisbursementDetails.findOne({
          beneficiaryId: beneficiary.beneficiaryId,
        });

        if (disbursementDetails) {
          // Update existing disbursement details
          disbursementDetails.bhumiPrice = beneficiary.bhumiPrice;
          disbursementDetails.faldaarBhumiPrice = beneficiary.faldaarBhumiPrice;
          disbursementDetails.landPricePerSqMt = beneficiary.landPricePerSqMt;
          disbursementDetails.gairFaldaarBhumiPrice =
            beneficiary.gairFaldaarBhumiPrice;
          disbursementDetails.housePrice = beneficiary.housePrice;
          disbursementDetails.toshan = beneficiary.toshan;
          disbursementDetails.interest = beneficiary.interest;
          disbursementDetails.totalCompensation = beneficiary.totalCompensation;
          disbursementDetails.vivran = beneficiary.vivran || "";
          disbursementDetails.isDisputed = beneficiary.isDisputed || "0";
          disbursementDetails.isConsent = beneficiary.isConsent || "0";
          disbursementDetails.isAproved = beneficiary.isAproved || "0";
          disbursementDetails.isRejected = beneficiary.isRejected || "0";
          disbursementDetails.rejectedMessage =
            beneficiary.rejectedMessage || "";
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
            vivran: beneficiary.vivran || "",
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
        if (beneficiaryDetails.isDisbursementUploaded !== "1") {
          beneficiaryDetails.isDisbursementUploaded = "1";
          await beneficiaryDetails.save(); // Save the beneficiary record with updated isDisbursementUploaded
        }

        return disbursementDetails;
      })
    );

    res.status(201).json({
      userId: userId,
      beneficiaries: disbursementDetailsArray,
      message: "Disbursement details added successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating/updating disbursement details",
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
      return next(
        new ErrorHandler("villageId or khatauniSankhya is missing.", 400)
      );
    }

    // Fetch the khatauni details and associated beneficiaries
    const khatauniDetailsData = await KhatauniDetailsWeb.find({
      villageId,
      khatauniSankhya,
    });

    if (!khatauniDetailsData.length) {
      return next(
        new ErrorHandler("villageId or KhatauniSankhya does not exist.", 404)
      );
    }

    // Extract beneficiary IDs from the fetched khatauni details
    const beneficiaryIds = khatauniDetailsData.map(
      (detail) => detail.beneficiaryId
    );

    // Fetch all required details for each beneficiary
    const beneficiariesData = await Promise.all(
      beneficiaryIds.map(async (beneficiaryId) => {
        // First, fetch beneficiarySelfDetails
        const beneficiarySelfDetails = await beneficiarDetails.findOne({
          _id: beneficiaryId,
        });

        if (!beneficiarySelfDetails) {
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
          beneficiarySelfDetails?.landPriceId
            ? landPrice.findOne({ _id: beneficiarySelfDetails.landPriceId })
            : null,
        ]);

        const userRole = req.user.role;
        const lastApprovedHistory = verificationData?.history?.filter(
          (item) => item.userRole == userRole && item.status == "1"
        );

        const landPricePerSqMt = landPriceDetails?.landPricePerSqMtr || "";
        return {
          beneficiaryId: beneficiarySelfDetails._id,
          beneficiaryName: beneficiarySelfDetails.beneficiaryName || "",
          beneficiaryStatus: beneficiarySelfDetails.beneficiaryStatus || "",
          villageName: villageData?.villageName,
          villageId: villageData?._id,
          interestDays: villageData?.interestDays || 0,
          khatauniSankhya: khatauniSankhya,
          beneficiaryType: beneficiarySelfDetails.beneficiaryType || "",
          benefactorId: beneficiarySelfDetails.benefactorId || "",
          legalHeirs: beneficiarySelfDetails.legalHeirs || [],
          serialNumber: khatauniDetails?.serialNumber || "",
          khasraNumber: khatauniDetails?.khasraNumber || "",
          acquiredKhasraNumber: khatauniDetails?.acquiredKhasraNumber || "",
          areaVariety: khatauniDetails?.areaVariety || "",
          acquiredRakbha: khatauniDetails?.acquiredRakbha || "",
          beneficiaryShare: beneficiarySelfDetails.beneficiaryShare || "",
          acquiredBeneficiaryShare:
            beneficiarySelfDetails.acquiredBeneficiaryShare || "",
          landPricePerSqMt: landPricePerSqMt,
          hasQuery: queryData?.status || "0",
          isDocumentsUploaded: beneficiarySelfDetails.isDocumentUploaded || "",
          isDisbursementUploaded:
            beneficiarySelfDetails.isDisbursementUploaded || "0",
          verificationDetails: {
            level: verificationData ? verificationData.verificationLevel : "0", // Default to 0 if verificationData is not present
            status: verificationData?.status || "",
            userName: verificationData?.updatedBy || "",
            updatedAt: verificationData?.updatedAt || "",
            userRole: verificationData?.userRole || "",
            userId: verificationData?.userId || "",
            rejectionMessage: verificationData?.rejectionMessage || "",
            history: lastApprovedHistory || "",
          },
          queryMessages:
            queryData?.queryMessages.map((msg) => ({
              userId: msg.userId || "",
              message: msg.message || "",
              updatedAt: msg.updatedAt || "",
              userRole: msg.userRole || "",
              userName: msg.name || "",
              attachment: msg.attachment,
              attachmentName: msg.attachmentName,
            })) || [],
          disbursementDetails: {
            bhumiPrice: beneficiaryDisbursement?.bhumiPrice || "",
            faldaarBhumiPrice: beneficiaryDisbursement?.faldaarBhumiPrice || "",
            gairFaldaarBhumiPrice:
              beneficiaryDisbursement?.gairFaldaarBhumiPrice || "",
            housePrice: beneficiaryDisbursement?.housePrice || "",
            toshan: beneficiaryDisbursement?.toshan || "",
            interest: beneficiaryDisbursement?.interest || "",
            totalCompensation: beneficiaryDisbursement?.totalCompensation || "",
            vivran: beneficiaryDisbursement?.vivran || "",
          },
          bankDetails: {
            accountNumber: beneficiaryDocsUploadedList?.accountNumber || "",
            pancardNumber: beneficiaryDocsUploadedList?.panCardNumber || "",
            ifscCode: beneficiaryDocsUploadedList?.ifscCode || "",
            // bankName: beneficiaryDocsUploadedList?.bankName || '',
            // bankBranch: beneficiaryDocsUploadedList?.bankBranch || '',
            aadhaarNumber: beneficiaryDocsUploadedList?.aadhaarNumber || "",
            paymentInvoice: beneficiaryDocsUploadedList?.paymentInvoice || "",
          },
          documents: {
            landIndemnityBond:
              beneficiaryDocsUploadedList?.landIndemnityBond || "",
            structureIndemnityBond:
              beneficiaryDocsUploadedList?.structureIndemnityBond || "",
            affidavit: beneficiaryDocsUploadedList?.uploadAffidavit || "",
            aadharCard: beneficiaryDocsUploadedList?.aadhaarCard || "",
            pancard: beneficiaryDocsUploadedList?.panCard || "",
            checkORpassbook:
              beneficiaryDocsUploadedList?.chequeOrPassbook || "",
            photo: beneficiaryDocsUploadedList?.photo || "",
          },
        };
      })
    );

    // Filter out any null values from beneficiariesData
    const filteredBeneficiariesData = beneficiariesData.filter(
      (b) => b !== null
    );
    // Fetch the user role
    const { role: userRole } = req.user;
    // Filter beneficiaries based on user role
    const finalBeneficiariesData = filteredBeneficiariesData.filter((b) => {
      const level = b.verificationDetails.level;
      const roleLevels = {
        0: ["0", "4"],
        1: ["0", "1", "4"],
        2: ["1", "2", "4"],
        3: ["2", "3", "4"],
      };
      const isAllowed = roleLevels[userRole]?.includes(level);
      return isAllowed;
    });
    // Return the response with filtered beneficiary data
    res.status(200).json({
      success: true,
      message: "Successfull",
      beneficiaries: finalBeneficiariesData,
    });
  } catch (error) {
    next(error);
  }
});

// get all bnefeciary
export const getAllBeneficiaries = async (req, res) => {
  try {
    const { villageId } = req.query;
    const { role: userRole } = req.user; // Get user role from the authentication middleware

    if (!villageId) {
      return res
        .status(400)
        .json({ status: false, message: "villageId is required" });
    }

    // Fetch beneficiaries based on villageId
    const beneficiaries = await beneficiarDetails
      .find({ villageId })
      .populate(
        "khatauniId",
        "khatauniSankhya serialNumber khasraNumber acquiredKhasraNumber areaVariety acquiredRakbha"
      )
      .populate("landPriceId", "landPricePerSqMtr")
      .populate("villageId", "villageName interestDays")
      .select(
        "beneficiaryName beneficiaryStatus beneficiaryShare acquiredBeneficiaryShare isDisputed khatauniId landPriceId villageId benefactorId legalHeirs isDocumentUploaded isDisbursementUploaded"
      );

    const transformedBeneficiaries = await Promise.all(
      beneficiaries.map(async (b) => {
        // Fetch verification details for the current beneficiary
        const verificationData = await verifySchema.findOne({
          beneficiaryId: b._id,
        });

        // If verificationData doesn't exist, default the verification level to 0
        const verificationLevel = verificationData
          ? verificationData.verificationLevel
          : "0";

        // Apply user role-based filtering
        const isAllowed =
          (userRole === "0" && verificationLevel === "0") ||
          (userRole === "1" &&
            (verificationLevel === "0" || verificationLevel === "1")) ||
          (userRole === "2" &&
            (verificationLevel === "1" || verificationLevel === "2")) ||
          (userRole === "3" &&
            (verificationLevel === "2" || verificationLevel === "3"));

        // If not allowed, return null (which will be filtered out later)
        if (!isAllowed) return null;

        // Fetch disbursement details for each beneficiary
        const disbursementDetails = await beneficiarDisbursementDetails.findOne(
          { beneficiaryId: b._id }
        );

        return {
          beneficiaryName: b.beneficiaryName,
          beneficiaryId: b._id,
          isDisputed: b.isDisputed,
          beneficiaryStatus: b.beneficiaryStatus,
          villageId: b.villageId?._id || "",
          interestDays: b.villageId?.interestDays || 0,
          villageName: b.villageId?.villageName || "",
          khatauniSankhya: b.khatauniId?.khatauniSankhya || "",
          serialNumber: b.khatauniId?.serialNumber || "",
          khasraNumber: b.khatauniId?.khasraNumber || "",
          acquiredKhasraNumber: b.khatauniId?.acquiredKhasraNumber || "",
          areaVariety: b.khatauniId?.areaVariety || "",
          acquiredRakbha: b.khatauniId?.acquiredRakbha || "",
          beneficiaryShare: b.beneficiaryShare,
          acquiredBeneficiaryShare: b.acquiredBeneficiaryShare,
          landPricePerSqMt: b.landPriceId?.landPricePerSqMtr || "",
          isDocumentsUploaded: b.isDocumentUploaded || "0",
          isDisbursementUploaded: b.isDisbursementUploaded, // This should fetch the exact value from the collection
          // If disbursement details exist, use them; otherwise, default to zeros
          bhumiPrice: disbursementDetails?.bhumiPrice || 0,
          faldaarBhumiPrice: disbursementDetails?.faldaarBhumiPrice || 0,
          gairFaldaarBhumiPrice:
            disbursementDetails?.gairFaldaarBhumiPrice || 0,
          housePrice: disbursementDetails?.housePrice || 0,
          toshan: disbursementDetails?.toshan || 0,
          interest: disbursementDetails?.interest || 0,
          totalCompensation: disbursementDetails?.totalCompensation || 0,
          vivran: disbursementDetails?.vivran || "",
        };
      })
    );

    // Filter out any null beneficiaries (i.e., those that didn't match the user role-based filter)
    const filteredBeneficiaries = transformedBeneficiaries.filter(
      (b) => b !== null
    );

    res.status(200).json({
      success: true,
      beneficiaries: filteredBeneficiaries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error,
    });
  }
};

// Controller to create BeneficiaryQuery and add a queryMessage to the array
export const createBeneficiaryQuery = async (req, res) => {
  try {
    const { beneficiaryId, message } = req.body;

    // Extract user information from the request object as set by the middleware
    const userId = req.user.id; // userId is attached from authentication
    const updatedBy = req.user.name; // userName is attached from authentication
    const userRole = req.user.role; // userRole is attached from authentication

    // Step 1: Check if a BeneficiaryQuery already exists for the beneficiaryId
    let beneficiaryQuery = await BeneficiaryQuery.findOne({ beneficiaryId });

    if (!beneficiaryQuery) {
      // If no BeneficiaryQuery exists, create a new one
      beneficiaryQuery = new BeneficiaryQuery({
        beneficiaryId: beneficiaryId,
        queryMessages: [],
        queryLevel: userRole,
        status: "1",
      });
    }
    beneficiaryQuery.status = "1";
    // Step 2: Add the new message to the queryMessages array
    const newQueryMessage = {
      userId: userId,
      updatedAt: new Date(),
      message: message,
      queryLevel: userRole,
      userRole: userRole,
      name: updatedBy,
    };
    if (req.file) {
      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;
      newQueryMessage["attachmentName"] = req.file.originalname;
      newQueryMessage["attachment"] = fileUrl; // Correctly set the URL
    }

    // Push the new message to the queryMessages array
    beneficiaryQuery.queryMessages.push(newQueryMessage);

    // Save the BeneficiaryQuery document (with the new message)
    const savedBeneficiaryQuery = await beneficiaryQuery.save();

    // Return success response with the updated BeneficiaryQuery
    res.status(201).json({
      success: true,
      message: "Query added successfully",
      beneficiaryQuery: savedBeneficiaryQuery,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create beneficiary query and message",
      error: error.message,
    });
  }
};

// verify
// Updated controller using requireAuth middleware to fetch user data
export const verifyBeneficiaryDetails = catchAsyncError(
  async (req, res, next) => {
    try {
      // Log the req.user object to ensure it's attached by the middleware
      const { beneficiaryId, status, rejectionMessage, revokedMessage } =
        req.body;

      // Ensure that req.user is properly populated
      if (!req.user) {
        throw new ErrorHandler("Authentication failed, user not found", 401);
      }

      // Extract user information from the request object as set by the middleware
      const userId = req.user.id; // userId is attached from authentication
      const updatedBy = req.user.name; // userName is attached from authentication
      const userRole = req.user.role; // userRole is attached from authentication

      // Check if all required fields are present
      if (!beneficiaryId) {
        throw new ErrorHandler("Missing beneficiaryId", 400);
      }
      if (!userId) {
        throw new ErrorHandler("Missing userId", 400);
      }
      if (status === undefined) {
        throw new ErrorHandler("Missing status", 400);
      }

      // Fetch existing verification record (if exists)
      let verificationDetails = await verifySchema.findOne({ beneficiaryId });

      // If no verification record exists, create a new one
      if (!verificationDetails) {
        verificationDetails = await verifySchema.create({
          beneficiaryId,
          updatedBy,
          userRole,
          userId,
          status,
          verificationLevel: status === "1" ? "1" : "0",
          rejectionMessage: status === "0" ? rejectionMessage : "",
          history: [
            {
              userId,
              status,
              userRole: userRole,
              updatedBy: updatedBy,
              rejectionMessage: status === "0" ? rejectionMessage : "",
              updatedAt: new Date(),
            },
          ],
        });
      } else {
        // Update the verificationLevel or status if a record exists
        if (status === "1") {
          const newHistory = {
            userId,
            status,
            userRole: userRole,
            updatedBy: updatedBy,
            updatedAt: new Date(),
          };
          verificationDetails.history.push(newHistory);
          verificationDetails.updatedBy = updatedBy;
          verificationDetails.userRole = userRole;
          verificationDetails.verificationLevel = userRole;
          verificationDetails.status = status;
          verificationDetails.rejectionMessage = "";
        } else if (status === "0") {
          const newHistory = {
            userId,
            status,
            userRole: userRole,
            updatedBy: updatedBy,
            rejectionMessage,
            updatedAt: new Date(),
          };
          verificationDetails.history.push(newHistory);
          verificationDetails.updatedBy = updatedBy;
          verificationDetails.userRole = userRole;
          verificationDetails.status = status;
          verificationDetails.rejectionMessage = rejectionMessage;
        } else if (status === "2") {
          const newHistory = {
            userId,
            status,
            userRole: userRole,
            updatedBy: updatedBy,
            revokedMessage,
            updatedAt: new Date(),
          };
          verificationDetails.history.push(newHistory);
          verificationDetails.updatedBy = updatedBy;
          verificationDetails.userRole = userRole;
          verificationDetails.status = userRole === "1" ? "" : "1";
          verificationDetails.revokedMessage = rejectionMessage;
        } else {
          throw new ErrorHandler("Invalid status value", 400);
        }
        await verificationDetails.save();
      }

      let beneficiaryQuery = await BeneficiaryQuery.findOne({ beneficiaryId });
      if (beneficiaryQuery) {
        // To reset query status to "0"
        beneficiaryQuery.status = "0";

        if (status === "0") {
          // Add the rejection message to queryMessages array
          const rejectionQueryMessage = {
            userId: userId,
            updatedAt: new Date(),
            message: `---@rejected@---${rejectionMessage}`,
            userRole: userRole,
            name: updatedBy,
          };
          beneficiaryQuery.queryMessages.push(rejectionQueryMessage);
        }

        if (status === "1") {
          // Add the approved message to queryMessages array
          const approvedQueryMessage = {
            userId: userId,
            updatedAt: new Date(),
            message: "---@approved@---",
            userRole: userRole,
            name: updatedBy,
          };
          beneficiaryQuery.queryMessages.push(approvedQueryMessage);
        }

        if (status === "2") {
          // Add the revoking message to queryMessages array
          const revokedQueryMessage = {
            userId: userId,
            updatedAt: new Date(),
            message: `---@revoked@---${revokedMessage}`,
            userRole: userRole,
            name: updatedBy,
          };
          beneficiaryQuery.queryMessages.push(revokedQueryMessage);
        }
        await beneficiaryQuery.save();
      } else {
        // If no BeneficiaryQuery exists, create a new one
        beneficiaryQuery = new BeneficiaryQuery({
          beneficiaryId: beneficiaryId,
          queryMessages: [],
          queryLevel: userRole,
          status: "0",
        });
        // To reset query status to "0"
        beneficiaryQuery.status = "0";

        if (status === "0") {
          // Add the rejection message to queryMessages array
          const rejectionQueryMessage = {
            userId: userId,
            updatedAt: new Date(),
            message: `---@rejected@---${rejectionMessage}`,
            userRole: userRole,
            name: updatedBy,
          };
          beneficiaryQuery.queryMessages.push(rejectionQueryMessage);
        }

        if (status === "1") {
          // Add the approved message to queryMessages array
          const approvedQueryMessage = {
            userId: userId,
            updatedAt: new Date(),
            message: "---@approved@---",
            userRole: userRole,
            name: updatedBy,
          };
          beneficiaryQuery.queryMessages.push(approvedQueryMessage);
        }

        if (status === "2") {
          // Add the revoking message to queryMessages array
          const revokedQueryMessage = {
            userId: userId,
            updatedAt: new Date(),
            message: `---@revoked@---${revokedMessage}`,
            userRole: userRole,
            name: updatedBy,
          };
          beneficiaryQuery.queryMessages.push(revokedQueryMessage);
        }
        await beneficiaryQuery.save();
      }

      // If verificationLevel is 3, create a payment record
      if (verificationDetails.verificationLevel === "3") {
        const disbursementDetails = await beneficiarDisbursementDetails.findOne(
          { beneficiaryId }
        );
        if (!disbursementDetails) {
          throw new ErrorHandler("Disbursement details not found", 400);
        }

        const beneficiaryDoc = await beneficiaryDocs.findOne({ beneficiaryId });

        const paymentStatus = await beneficiaryPaymentStatus.create({
          accountInfo: {
            accountNumber: beneficiaryDoc?.accountNumber || "N/A",
            ifscCode: beneficiaryDoc?.ifscCode || "N/A",
          },
          paymentStatus: "0",
          beneficiaryId,
          disbursementId: disbursementDetails._id,
          update: { userId: userId, updatedAt: new Date(), action: "0" },
        });

        return res.status(200).json({
          success: true,
          message:
            "Beneficiary details approved and payment request sent to the bank",
          verificationLevel: verificationDetails.verificationLevel,
          data: {
            verificationDetails,
            paymentStatus,
          },
        });
      }

      // Send response based on status
      if (status === "1") {
        return res.status(200).json({
          success: true,
          message: "Beneficiary details approved successfully",
          data: verificationDetails,
        });
      }
      if (status === "0") {
        return res.status(200).json({
          success: true,
          message: "Beneficiary details got rejected",
          rejectionMessage,
          data: verificationDetails,
        });
      }
      if (status === "2") {
        return res.status(200).json({
          success: true,
          message: "Beneficiary revoked successfully",
          revokedMessage,
          data: verificationDetails,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// benfeciary paymeent status list
export const getAllBeneficiariesPaymentStatus = async (req, res) => {
  try {
    // Fetch beneficiaries based on villageId
    const beneficiaries = await beneficiarDetails
      .find()
      .populate(
        "khatauniId",
        "khatauniSankhya serialNumber khasraNumber acquiredKhasraNumber areaVariety acquiredRakbha"
      ) // Populating khatauni details
      .populate("villageId", "villageName") // Populating village name from villageListSchema
      .select(
        "beneficiaryName beneficiaryStatus beneficiaryShare acquiredBeneficiaryShare khatauniId landPriceId villageId"
      );

    if (beneficiaries.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No beneficiaries found for this village",
      });
    }

    // Filter beneficiaries to keep only those with payment status
    const beneficiariesWithPaymentStatus = await Promise.all(
      beneficiaries.map(async (b) => {
        const paymentStatus = await beneficiaryPaymentStatus
          .findOne({ beneficiaryId: b._id })
          .populate("disbursementId", "totalCompensation")
          .select("paymentStatus totalCompensation");

        if (paymentStatus) {
          return {
            beneficiaryName: b.beneficiaryName,
            beneficiaryId: b._id,
            beneficiaryStatus: b.beneficiaryStatus,
            villageName: b.villageId?.villageName || "",
            villageId: b.villageId?._id,
            khatauniSankhya: b.khatauniId?.khatauniSankhya || "",
            serialNumber: b.khatauniId?.serialNumber || "",
            khasraNumber: b.khatauniId?.khasraNumber || "",
            acquiredKhasraNumber: b.khatauniId?.acquiredKhasraNumber || "",
            areaVariety: b.khatauniId?.areaVariety || "",
            acquiredRakbha: b.khatauniId?.acquiredRakbha || "",
            beneficiaryShare: b.beneficiaryShare,
            acquiredBeneficiaryShare: b.acquiredBeneficiaryShare,
            totalCompensation: paymentStatus.disbursementId.totalCompensation,
            paymentStatus: paymentStatus.paymentStatus || "0",
          };
        }

        // Return null if no payment status found for this beneficiary
        return null;
      })
    );

    // Filter out null entries (those without a payment status)
    const filteredBeneficiaries = beneficiariesWithPaymentStatus.filter(
      (b) => b !== null
    );

    res
      .status(200)
      .json({ success: true, beneficiaries: filteredBeneficiaries });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

// Controller for adding legal heir
export const addLegalHeir = async (req, res) => {
  const { beneficiaries, beneficiaryId, beneficiaryType } = req.body; // Destructure payload from frontend
  const userId = req.user.id;
  const updatedBy = req.user.name;
  const userRole = req.user.role;

  if (!beneficiaryId || !beneficiaries || !beneficiaryType) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  try {
    // Fetch the data of the original beneficiary using beneficiaryId
    const existingBeneficiary = await beneficiarDetails.findById(beneficiaryId);
    if (!existingBeneficiary) {
      return res
        .status(404)
        .json({ success: false, message: "Beneficiary not found." });
    }

    // Fetch the disbursement details of the original beneficiary
    const originalDisbursementDetails =
      await beneficiarDisbursementDetails.findOne({ beneficiaryId });
    if (!originalDisbursementDetails) {
      return res
        .status(404)
        .json({ success: false, message: "Disbursement details not found." });
    }

    // Fetch the Khatauni details for the original beneficiary
    const originalKhatauni = await KhatauniDetailsWeb.findOne({
      beneficiaryId,
    });
    if (!originalKhatauni) {
      return res
        .status(404)
        .json({ success: false, message: "Khatauni details not found." });
    }

    // Fetch existing verification record (if exists)
    let verificationDetails = await verifySchema.findOne({ beneficiaryId });
    // If no verification record exists, create a new one
    if (!verificationDetails) {
      verificationDetails = await verifySchema.create({
        beneficiaryId,
        updatedBy,
        userRole,
        userId,
        // status: "",
        verificationLevel: "4",
      });
    } else {
      verificationDetails.beneficiaryId = beneficiaryId;
      verificationDetails.userId = updatedBy;
      verificationDetails.userId = userRole;
      verificationDetails.userId = userId;
      // verificationDetails.status = "";
      verificationDetails.verificationLevel = "4";
      await verificationDetails.save();
    }

    // Update the original beneficiary's beneficiaryType
    existingBeneficiary.beneficiaryType = beneficiaryType;

    // Create new beneficiary data and update collections
    const newBeneficiaries = [];
    const disbursementPromises = [];
    const khatauniPromises = [];

    for (let index = 0; index < beneficiaries.length; index++) {
      const beneficiary = beneficiaries[index];

      // Create new Beneficiary
      const newBeneficiary = new beneficiarDetails({
        beneficiaryName: beneficiary.name,
        beneficiaryStatus: "active",
        beneficiaryShare: `${existingBeneficiary.beneficiaryShare}-${beneficiary.percentage}%`,
        acquiredBeneficiaryShare: `0-00-${parseFloat(
          existingBeneficiary.acquiredBeneficiaryShare.split("-").join("") *
            (beneficiary.percentage / 100) || 0
        ).toFixed(2)}`,
        beneficiaryType: beneficiaryType === "poa" ? "poah" : "nokh",
        benefactorId: beneficiaryId,
        isDocumentUploaded: "0",
        isDisbursementUploaded: "0",
        legalHeirs: [],
        isDeleted: "0",
        isDisputed: "0",
        isConsent: "0",
        hasQuery: "0",
        villageId: existingBeneficiary.villageId,
        landPriceId: existingBeneficiary.landPriceId,
        update: {
          userId,
          updatedAt: new Date(),
          action: "0",
        },
      });

      const savedBeneficiary = await newBeneficiary.save();
      newBeneficiaries.push(savedBeneficiary);

      // Create new disbursement details using the original disbursement details and percentage
      const disbursementDetails = new beneficiarDisbursementDetails({
        bhumiPrice:
          parseFloat(
            originalDisbursementDetails.bhumiPrice *
              (beneficiary.percentage / 100)
          ).toFixed(2) || 0,
        faldaarBhumiPrice:
          parseFloat(
            originalDisbursementDetails.faldaarBhumiPrice *
              (beneficiary.percentage / 100)
          ).toFixed(2) || 0,
        gairFaldaarBhumiPrice:
          parseFloat(
            originalDisbursementDetails.gairFaldaarBhumiPrice *
              (beneficiary.percentage / 100)
          ).toFixed(2) || 0,
        housePrice:
          parseFloat(
            originalDisbursementDetails.housePrice *
              (beneficiary.percentage / 100)
          ).toFixed(2) || 0,
        toshan:
          parseFloat(
            originalDisbursementDetails.toshan * (beneficiary.percentage / 100)
          ).toFixed(2) || 0,
        interest:
          parseFloat(
            originalDisbursementDetails.interest *
              (beneficiary.percentage / 100)
          ).toFixed(2) || 0,
        totalCompensation:
          parseFloat(
            originalDisbursementDetails.totalCompensation *
              (beneficiary.percentage / 100)
          ).toFixed(2) || 0,
        villageId: originalDisbursementDetails.villageId,
        beneficiaryId: savedBeneficiary._id,
        update: { userId, updatedAt: new Date(), action: "0" },
      });
      const savedDisbursementDetails = await disbursementDetails.save();
      disbursementPromises.push(savedDisbursementDetails);

      // Create new KhatauniDetails
      const newSerialNumber = `${originalKhatauni.serialNumber}.${index + 1}`;
      const newKhatauni = new KhatauniDetailsWeb({
        ...originalKhatauni.toObject(),
        _id: new mongoose.Types.ObjectId(),
        serialNumber: newSerialNumber,
        beneficiaryId: savedBeneficiary._id,
        update: {
          userId,
          updatedAt: new Date(),
          action: "0",
        },
      });
      const savedKhatauni = await newKhatauni.save();
      khatauniPromises.push(savedKhatauni);
      savedBeneficiary.khatauniId = savedKhatauni._id;
      await savedBeneficiary.save();
    }

    // Update the original beneficiary with new legalHeirs
    const legalHeirIds = newBeneficiaries.map((ben) => ben._id);
    existingBeneficiary.legalHeirs = legalHeirIds;
    await existingBeneficiary.save();

    // Update the village collection with the new total beneficiary count
    const villageId = existingBeneficiary.villageId;
    const totalBeneficiaries = await beneficiarDetails.countDocuments({
      villageId,
    });
    await villageSchema.findOneAndUpdate(
      { _id: villageId },
      {
        $set: {
          totalBeneficiaries,
          update: {
            userId,
            updatedAt: new Date(),
            action: "0",
          },
        },
      },
      { new: true }
    );

    // Wait for all async operations to complete
    await Promise.all([...disbursementPromises, ...khatauniPromises]);

    res.status(200).json({
      success: true,
      message: "Legal Heirs added successfully",
      newBeneficiaries, // Return newly created beneficiaries
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
