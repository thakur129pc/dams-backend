import mongoose from "mongoose";

// Define the merged schema with query messages as an array of objects
const BeneficiaryQuerySchema = new mongoose.Schema({
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "beneficiarDetailsSchema",
    required: true,
  },
  status: {
    type: String,
    enum: ["0", "1"],
    default: "0",
  },
  queryLevel: {
    type: String,
  },
  queryMessages: [
    {
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      message: {
        type: String,
      },
      attachment: {
        type: String,
      },
      attachmentName: {
        type: String,
      },
      userRole: {
        type: String,
        enum: ["0", "1", "2", "3"],
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      name: {
        type: String,
      },
    },
  ],
});

// Create the model
const BeneficiaryQuery = mongoose.model(
  "BeneficiaryQuery",
  BeneficiaryQuerySchema
);

export default BeneficiaryQuery;
