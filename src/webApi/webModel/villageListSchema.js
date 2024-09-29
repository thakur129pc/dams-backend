import mongoose from 'mongoose';

const villageListSchema = new mongoose.Schema({
    villageName:{
        type:String,
        required:true
    },
    villageNameHindi:{
        type:String,
        required:true
    },
    villageArea:{
        type:String,
        required:true
    },
    khatauni:{
        type:Number,
        required:true
    },
    totalBeneficiaries:{
        type:Number,
        required:true
    },
    villageStatus:{
        type: String,
        enum: ["active", "inactive"],
        default: "active"
    },
    interestDays:{
        type: Number,
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
    landPriceId: { type: mongoose.Schema.Types.ObjectId, ref: 'landPrice' }
})
const villageList = mongoose.model('villageListSchema', villageListSchema);
export default villageList;