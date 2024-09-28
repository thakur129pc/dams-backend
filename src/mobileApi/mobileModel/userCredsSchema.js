import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userCredsSchema = new mongoose.Schema({
    // id: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     index: true,
    //     required: true,
    //     auto: true,
    // },
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 20
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 12
    }
}, { timestamps: true }); 

userCredsSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userCredsSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userCredsSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRES,
    });
};

const userCredentials = mongoose.model('userCredentials', userCredsSchema);

export default userCredentials;
