import mongoose from 'mongoose';

// Schema for beneficiary details
const beneficiaryDetailsSchema = new mongoose.Schema({
    singleBeneficiaryDocUploaded: {
        type: Boolean,
        default: false // Default value is false
    },
    documentUploadedEach: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BeneficiaryDocs'
    },
    submissionStatus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BeneficiaryDocs'
    },
    remarks: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Remark'
    },
    khatauniId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KhatauniDetails',
        required: true
    },
    villageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VillageDetails'
    },
    update: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Update'
    },
    beneficiaryName: {
        type: String,
        required: true,
        maxlength: 250,
        minlength: 3
    },
    beneficiaryStatus: {
        type: String,
        required: true,
        enum: ['0', '1']
    },
    beneficiaryType: {
        type: String,
        required: true,
        enum: ['0', '1', '2', '3', '4']
    },
    NOKid: {
        type: String
    },
    POAid: {
        type: String
    },
    NOKHid: {
        type: String
    },
    POAHid: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        enum: [true, false] // This is acceptable but could also just be type: Boolean
    },
    deletedAt: {
        type: Date
    },
    isDisputed: {
        date: Date
    },
    beneficiaryShare: {
        type: String,
        required: true
    },
    acquiredBeneficiaryShare: {
        type: String,
        required: true
    },
    isDocUploaded: {
        type: Boolean,
        required: true
    },
    isDisbursementUploaded: {
        type: Boolean,
        required: true
    },
    isConsent: {
        type: Boolean,
        required: true // Ensure this field is required for validation
    },
    landPriceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LandPrice'
    }
});

export const beneficiaryDetails = mongoose.model('beneficiaryDetails', beneficiaryDetailsSchema);
