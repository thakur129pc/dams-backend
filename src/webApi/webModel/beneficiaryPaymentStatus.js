import mongoose from "mongoose";

const beneficiaryPaymentSchema = new mongoose.Schema({
  accountInfo: {
    email: { type: String },
    accountNumber: { type: String }, // Change from Number to String
    ifscCode: { type: String }, // Change from Number to String
    bankName: { type: String },
    bankBranch: { type: String },
  },
  paymentStatus: {
    type: String,
    enum: ["0", "1"],
    default: "0",
  },
  totalCompensation: {
    type: String,
  },
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "beneficiarDetailsSchema",
    required: true,
  },
  disbursementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "beneficiarDisbursementDetails",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});
const beneficiaryPaymentStatus = mongoose.model(
  "beneficiaryPaymentStatus",
  beneficiaryPaymentSchema
);

export default beneficiaryPaymentStatus;
