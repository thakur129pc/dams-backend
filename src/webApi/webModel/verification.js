import mongoose from "mongoose";

// Define the schema
const verifySchema = new mongoose.Schema(
  {
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BeneficiarDetailsSchema", // Reference to the beneficiary details schema
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    updatedBy: {
      type: String,
      required: true, // User's name (from auth middleware)
    },
    userRole: {
      type: String,
      required: true, // User's role (from auth middleware)
    },
    status: {
      type: String,
      enum: ["0", "1", "2"], // "0" for Rejected, "1" for Approved, "2" for Pending
      default: "0", // Default status is 'Pending'
    },
    verificationLevel: {
      type: String,
      default: "0", // Default level set to 0
    },
    rejectionMessage: {
      type: String,
      default: null, // Set null when no rejection message
    },
    history: { type: Array },
    updatedAt: {
      type: Date,
      default: Date.now, // Automatically set to the current date/time
    },
  },
  { timestamps: true }
); // Automatically handle createdAt and updatedAt fields

// Create the model
const Verification = mongoose.model("Verification", verifySchema);

export default Verification;
