import mongoose from 'mongoose';
const beneficiarySchema = new mongoose.Schema({
  beneficiaryId: { type: mongoose.Schema.Types.ObjectId, required: false },
  beneficiaryName: { type: String, required: false },
  accountNumber: { type: String, required: false },
  ifscCode: { type: String, required: false },
  // confirmAccountNumber: { type: String, required: false },
  aadhaarNumber: { type: String, required: false },
  panCardNumber: { type: String, required: false },
  remarks: { type: String },
  isConsent: { type: Boolean, required: false },
  photo: { type: String },
  landIndemnityBond: { type: String },
  structureIndemnityBond: { type: String },
  uploadAffidavit: { type: String },
  aadhaarCard: { type: String },
  panCard: { type: String },
  chequeOrPassbook: { type: String }
}, { timestamps: false });

export default mongoose.model('BeneficiaryDocs', beneficiarySchema);
