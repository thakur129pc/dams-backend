import mongoose from 'mongoose';

const khatauniDetailsSchema = new mongoose.Schema({
    update: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'update'
    },
    villageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'villageDetails'
    },
    khatauniSankhya: {
        type: String,
        required: true
    },
    serialNumber: {
        type: Number,
        required: true,
        unique: true
    },
    khasraNumber: {
        type: String,
        required: true
    },
    acquiredKhasraNumber: {
        type: String,
        required: true
    },
    areaVariety: {
        type: String,
        required: true
    },
    acquiredRakhba: {
        type: String,
        required: true
    },
    isAllDocsSubmitted: {
        type: String,
        enum: ['0', '1'],
        required: true
    }
});

export const khatauniDetails = mongoose.model('khatauniDetails', khatauniDetailsSchema);
