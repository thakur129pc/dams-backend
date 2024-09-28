import mongoose from 'mongoose';

const mobileDashboardSchema = new mongoose.Schema({
   khatauniId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'khatauniDetails',
        required: true
   },
   khatauniSankhya: {
        type: String, // This is a string, not an ObjectId
        required: true
   },
   beneficiaryName: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'beneficiaryDetails', // Assuming this should be a string representing beneficiary names
        required: true
   },
   khasraNumber: {
        type: String, // This should be a string if it's not an ObjectId
        required: true
   },
   areaVariety: {
        type: String, // This should be a string if it's not an ObjectId
        required: true
   },
   acquiredKhasraNumber: {
        type: String, // This should be a string if it's not an ObjectId
        required: true
   }
});

export const mobileDashboard = mongoose.model('mobileDashboard', mobileDashboardSchema);



