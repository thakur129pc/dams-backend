import mongoose from 'mongoose';

const landPrice = new mongoose.Schema({
    landPricePerSqMtr: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["active", "deactive"],
        default: "active"
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
    villageId: { type: mongoose.Schema.Types.ObjectId, ref: 'villageListSchema', required: false },
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }

})
const landPriceSchema = mongoose.model('landPrice', landPrice);

export default landPriceSchema;