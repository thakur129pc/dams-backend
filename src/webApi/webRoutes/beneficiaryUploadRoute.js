import express from "express";
import upload from "../../middleware/multer.js";
import { uploadExcel } from "../webController/uploadExcellController.js"; // Adjust the path if necessary
import {
  createBeneficiaryQuery,
  createDisbursementDetails,
  disbursePage,
  getAllBeneficiaries,
  getAllBeneficiariesPaymentStatus,
  getAllbeneficiaryDisburmentlist,
  verifyBeneficiaryDetails,
} from "../webController/beneficiaryController.js";
import requireAuth from "../../middleware/auth.js";

const router = express.Router();

router.post("/upload-excel", requireAuth, upload.single("file"), uploadExcel); // Ensure 'file' matches the form field name

router.get("/village-beneficiaries", requireAuth, getAllBeneficiaries);

// Route to fetch all beneficiaries
router.get("/beneficiaries-list", requireAuth, getAllbeneficiaryDisburmentlist);

// Route to post multiple beneficiaries
router.post("/add-disbursements", requireAuth, createDisbursementDetails);

router.get("/beneficiaries-details", requireAuth, disbursePage);

router.post(
  "/add-query",
  requireAuth,
  upload.single("attachment"),
  createBeneficiaryQuery
);

router.post("/verify-details", requireAuth, verifyBeneficiaryDetails);

router.get("/payment-beneficiaries", getAllBeneficiariesPaymentStatus);

export default router;
