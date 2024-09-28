import mongoose from 'mongoose';

const beneficiarDisbursementOld= new mongoose.Schema({
    bhumiPrice: {
        type: Number,
        required: true
    },
    faldaarBhumiPrice: {
        type: Number,
        required: true
    },
    gairFaldaarBhumiPrice: {
        type: Number,
        required: true
    },
    housePrice: {
        type: Number,
        required: true
    },
    toshan: {
        type: Number,
        required: true
    },
    interest: {
        type: Number,
        required: true
    },
    totalCompensation: {
        type: Number,
        required: true
    },
    vivran: {
        type: String,
        required: false
    },
    isConsent: {
        type: String,
        enum: ["0", "1"],
        default: "0"
    },
    dispute: [
        {
            isDisputed: {
                type: Boolean,
                required: true,
                default: false,
            },
            remarks: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'remark',
            },
            disBy: {
                type: String,
            },
            disputedAt: {
                type: Date,
            },
        },
    ],
    isAproved: {
        type: String,
        enum: ["0", "1"],
        default: "0"
    },
    isRejected: {
        type: String,
        enum: ["0", "1"],
        default: "0"
    },
    rejectedMessage: {
        type: String
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    update:{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt:{type: Date,
            default: Date.now,},
        action:{
            type: String,
            enum: ["0", "1"],
            default: '0',
        }    
    },
    // Adding villageId, linking to the villageListSchema
    villageId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'villageListSchema', // Make sure 'villageListSchema' matches the schema you're referencing
        required: true // Added 'required' to ensure it always gets filled
    },
    // Linking beneficiaryId to beneficiarDetailsSchema
    beneficiaryId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'beneficiarDetailsSchema', 
        required: true 
    },
    // Linking to User schema for keeping track of who performed actions
    // userId: { 
    //     type: mongoose.Schema.Types.ObjectId, 
    //     ref: 'User', 
    //     // required: true 
    // }
})

const OldBeneficiarDisbursement = mongoose.model('DisbursementOldData', beneficiarDisbursementOld);
export default OldBeneficiarDisbursement;
