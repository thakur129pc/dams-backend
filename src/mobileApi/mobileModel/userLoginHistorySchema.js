import mongoose from 'mongoose';

const userLoginHistorySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        trim: true, 
        minlength: 1
    },
    loginAt: {
        type: Date,
        required: true,
        default: Date.now 
    },
    userIp: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
               
                return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v);
            },
            message: props => `${props.value} is not a valid IP address!`
        }
    },
    userBrowser: {
        type: String,
        required: true,
        trim: true 
    }
}, { timestamps: true });
const userLoginHistory = mongoose.model('userLogin', userLoginHistorySchema);

export default userLoginHistory;
