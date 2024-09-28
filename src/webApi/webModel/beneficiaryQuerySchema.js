import mongoose from 'mongoose';

// Define the merged schema with query messages as an array of objects
const BeneficiaryQuerySchema = new mongoose.Schema({
  beneficiaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'beneficiarDetailsSchema',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ["0", "1"],
    default: '0',
  },
  queryLevel:{
    type: String,
    // enum: ["0", "1"],
    // default: '0',
  },
  queryMessages: [
    {
      updatedBy: {
        type: String,
        required: true,
      },
      updatedAt: {
        type: Date,
        default: Date.now, // Automatically set to the current date
      },
      message: {
        type: String,
        required: true,
      },
      userRole: {
        type: String,
        enum: ['0', '1', '2'],
        required: true,
      },
      name: {
        type: String,
        required: true,
      }
    }
  ]
});

// Create the model
const BeneficiaryQuery = mongoose.model('BeneficiaryQuery', BeneficiaryQuerySchema);

export default BeneficiaryQuery;
