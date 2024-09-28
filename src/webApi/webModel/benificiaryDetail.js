import mongoose from 'mongoose';

const beneficiarDetailsSchema = new mongoose.Schema({
    beneficiaryName: {
        type: String,
        required: false
    },
    beneficiaryStatus: {
        type: String,
        enum: ["active", "deactive"],
        default: "active"
    },
    uniqueBeneficiaryId: {
        type: String,
    },
    beneficiaryType: {
        type: String,
        enum: ["self", "nok", "poa","nokh","poah"],
        default: "self"
    },
    nokId: {
        type: String,
        required: false
    },
    poaId: {
        type: String,
        required: false
    },
    nokHId: {
        type: String,
        required: false
    },
    poaHId: {
        type: String,
        required: false
    },
    isDeleted: {
        type: String,
        enum: ["0", "1"],
        default: "0"
    },
    isDisputed: {
        type: String,
        enum: ["0", "1"],
        default: "0"
    },
    beneficiaryShare: {
        type: String,
        required: false
    },
    acquiredBeneficiaryShare: {
        type: String,
        required: false
    },
    isDocumentUploaded: {
        type: String,
        enum: ["0", "1"],
        default: "0"
    },
    isDisbursementUploaded: {
        type: String,
        enum: ["0", "1"],
        default: "0"
    },
    isConsent: {
        type: String,
        enum: ["0", "1"],
        default: "0"
    },
    ramark: {
        type: String,
    },
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
    hasQuery: {
        type: String,
        enum: ["0", "1"],
        default: '0',
    },
    villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'villageListSchema' },
    khatauniId: { type: mongoose.Schema.Types.ObjectId, ref: 'khatauniDetailsWeb' },
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    landPriceId: { type: mongoose.Schema.Types.ObjectId, ref: 'landPrice' },
});

const beneficiarDetails = mongoose.model('beneficiarDetailsSchema', beneficiarDetailsSchema);
export default beneficiarDetails;
