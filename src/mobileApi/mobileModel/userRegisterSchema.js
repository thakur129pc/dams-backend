import mongoose from 'mongoose';

const userRegistrationSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },

        email: {
            type: String,
            validate: [validator.isEmail, "Please provide a valid Email!"],
        
    },
    password: {
        type: String,
        required: true,
        minlength: 6, 
    },
    fullName: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{10}$/, 'is invalid'],
    },
    userRole: {
        type: String,
        default: 'user',
    },
});

export const UserRegistration = mongoose.model('UserRegistration', userRegistrationSchema);
