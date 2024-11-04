import { boolean, number, required } from 'joi';
import mongoose from 'mongoose';

const beneficiaryDisbursementDetailsSchema = new mongoose.Schema({
    dispute: [{
        disBy: {
            type: String,
        },
        disputedAt: {
            type: Date
        }    
    }],
    beneficiaryId:{
       type:mongoose.Schema.types ,
       re:'beneficiaryDetails'
    },
    bhumiPrice:{
        type:Number,
        required:true
    },
    villageId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'villageDetails'
    },
    falldaarBhumiPrice:{
        type:Number,
        required:true,
    },
    dispute:[{
        isDisputed:{
            type:Boolean,
            required:true,
            default:false,
        },
        remarks:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'remark'
        },
    }],
    gairFaldaarBhumiPrice:{
        type:Number,
        required:true,
    },

    housePrice:{
        type:Number,
        required:true,
    },
    toshan:{
        type:Number,
        required:true,
    },
    interest:{
        type:Number,
        required:true,
    },
    totalCompensation:{
        type:Number,
        required:true,
    },
    vivran:{
        type:String,
        required:true,
    },
    isConsent:{
        type:Boolean,
        required:true,
    },
    updatedAt:{
        type:Date,
        required:true,
    },
    updatedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'webuserid',
        required:true
    },

});

const BeneficiaryDisbursementDetails = mongoose.model('BeneficiaryDisbursementDetails', beneficiaryDisbursementDetailsSchema);

export default BeneficiaryDisbursementDetails;
