import mongoose from 'mongoose';
import bcrypt from 'bcrypt'
const phoneNumberRegex = /^[6-9]\d{9}$/;
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
        validate: {
          validator: function(v) {
            return /^[6-9]\d{9}$/.test(v);
          },
          message: 'Phone number must start with a digit between 6 and 9 and be 10 digits long.'
        }
      }
,      
    userRole: {
        type: String,
        default: 'user',
    },
});

export const UserRegistration = mongoose.model('UserRegistration', userRegistrationSchema);
