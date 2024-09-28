import mongoose from 'mongoose';

const khatauniDetailsSchema = new mongoose.Schema({
    khatauniSankhya: { type: Number, required: true },
    serialNumber: { type: Number, required: true },
    khasraNumber: { type: String, default: '' }, // Optional, default to an empty string
    acquiredKhasraNumber: { type: String, default: '' }, // Optional, default to an empty string
    areaVariety: { type: String, default: '' }, // Optional, default to an empty string
    acquiredRakbha: { type: String, default: '' },
    update: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
        action: {
            type: String,
            enum: ["0", "1"],
            default: '0',
        }
    },
    isAllDocumentSubmitted: { type: String, enum: ["0", "1"], default: "0" }, // Default to "0"
    villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'villageListSchema', required: false },
    beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'beneficiarDetailsSchema', required: true }
});

const KhatauniDetails = mongoose.model('khatauniDetailsWeb', khatauniDetailsSchema);

export default KhatauniDetails;
