import mongoose from 'mongoose';
import validator from 'validator';

const userDetailsSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserCredentials'  
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        validate: [validator.isEmail, "Please provide a valid Email!"]
    },
    dob: {
        type: Date
    },
    phoneNumber: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    userRole: {
        type: String,
        trim: true
    },
    assignedVillages: {
        type: [String],
        default: []
    },
    isUserDeleted: {
        type: Boolean,
        required: true
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    deletedAt: {
        type: Date
    }
}, { timestamps: true });

const UserDetails = mongoose.model('UserDetails', userDetailsSchema);
export default UserDetails;
