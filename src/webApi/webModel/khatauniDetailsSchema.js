import mongoose from "mongoose";

const khatauniDetailsSchema = new mongoose.Schema({
  khatauniSankhya: { type: String, required: true },
  documentUploadedEach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BeneficiaryDocs",
  },
  submissionStatus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BeneficiaryDocs",
  },
  khasraNumber: { type: String, default: "" }, // Optional, default to an empty string
  acquiredKhasraNumber: { type: String, default: "" }, // Optional, default to an empty string
  areaVariety: { type: String, default: "" }, // Optional, default to an empty string
  acquiredRakbha: { type: String, default: "" },
  totalAcquiredBhumi: { type: String, default: "" },
  landPriceId: { type: mongoose.Schema.Types.ObjectId, ref: "landPrice" },
  update: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    action: {
      type: String,
      enum: ["0", "1"],
      default: "0",
    },
  },
  isAllDocumentSubmitted: { type: String, enum: ["0", "1"], default: "0" }, // Default to "0"
  isDisbursementSubmitted: { type: String, enum: ["0", "1"], default: "0" }, // Default to "0"
  bhumiCompensation: { type: String, default: 0 },
  gairFaldaarBhumiCompensation: { type: String, default: 0 },
  faldaarBhumiCompensation: { type: String, default: 0 },
  makaanCompensation: { type: String, default: 0 },
  villageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "villageListSchema",
    required: false,
  },
});

const KhatauniDetails = mongoose.model(
  "khatauniDetailsWeb",
  khatauniDetailsSchema
);

export default KhatauniDetails;
