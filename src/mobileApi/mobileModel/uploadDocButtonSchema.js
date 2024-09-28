import mongoose from 'mongoose';

const mobileDashboardSchema = new mongoose.Schema({
    totalBeneficiary: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'villageDetails',
        required: true,
    },
    beneficiaryName: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'beneficiaryDetails',
        required: true,
    },
    landIndemnityBond: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'beneficiaryDocs',
        required: true
    },
    structureIndemnityBond: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'beneficiaryDocs',
        required: true
    },
    uploadAffidavit: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'beneficiaryDocs',
        required: true
    },
    aadhaarCard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'beneficiaryDocs',
        required: true
    },
    panCard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'beneficiaryDocs',
        required: true
    },
    chequeOrPassbook: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'beneficiaryDocs',
        required: true
    },
    aadhaarNumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'beneficiaryDocs',
        required: true
    },
    panCardNumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'beneficiaryDocs',
        required: true
    },
    photo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'beneficiaryDocs',
        required: true
    },
    isConsent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'beneficiaryDocs',
        required: true
    },
    update: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'update'
    }
});

export const mobileDashboard = mongoose.model('mobileDashboard', mobileDashboardSchema);
