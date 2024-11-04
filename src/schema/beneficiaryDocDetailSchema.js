import mongoose from 'mongoose';
const beneficiarySchema = new mongoose.Schema({
  beneficiaryId: { type: mongoose.Schema.Types.ObjectId, required: false },
  khatauniSankhya: { type: String, required: false },
  beneficiaryName: { type: String, required: false },
  accountNumber: {
    type: String,
    required: false,
  },
  confirmAccountNumber: {
    type: String,
    required: false,

  },
  ifscCode: { type: String, required: false },
  aadhaarNumber: {
    type: String,
    required: false,

  },
  panCardNumber: {
    type: String,
    required: false,
  },
  documentUploadedEach: {
    type: String,
    required: false,
    enum: ['completed', 'incomplete']
  },
  // documentColor: {
  //   type: String
  // },
  // statusColor: {
  //   type: String
  // },
  submissionStatus: {
    type: String,
    enum: ['Completed', 'Partial']
  },
  remarks: { type: String },
  isConsent1: { type: String },
  isConsent2:{type: String},
  photo: { type: String },
  landIndemnityBond: { type: String },
  structureIndemnityBond: { type: String },
  uploadAffidavit: { type: String },
  aadhaarCard: { type: String },
  panCard: { type: String },
  chequeOrPassbook: { type: String }
}, { timestamps: true });

export default mongoose.model('BeneficiaryDocs', beneficiarySchema);
