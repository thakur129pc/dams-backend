import { catchAsyncError } from '../../middleware/catchAsyncError.js';
import UserDetails from '../mobileModel/userDetailsSchema.js';
import UserCredentials from '../mobileModel/userCredsSchema.js';
import ErrorHandler from '../../middleware/error.js';
import { sendToken } from '../../utils/jwt.js';

export const register = catchAsyncError(async (req, res, next) => {
    const { username, password, email, phoneNumber, userRole, fullName } = req.body;

    if (!username || !password) {
        return next(new ErrorHandler("Please enter your username and password.", 400));
    }

    const isUsernameExists = await UserCredentials.findOne({ username });
    if (isUsernameExists) {
        return next(new ErrorHandler("Username already exists!", 400));
    }

    const newUserCreds = await UserCredentials.create({
        username,
        password,
        email
    });

    await UserDetails.create({
        userid: newUserCreds._id,
        username,
        phoneNumber,
        userRole,
        fullName,
        isUserDeleted: false,
        updatedAt: Date.now()
    });

    const token = newUserCreds.getJWTToken();

    sendToken(newUserCreds, 201, res, "User registered successfully!", {
        email: newUserCreds.email,
        phoneNumber,
        username,
        userRole,
        fullName,
        id: newUserCreds._id
    });
});

export const login = catchAsyncError(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return next(new ErrorHandler("Please provide username and password.", 400));
    }

    const userCreds = await UserCredentials.findOne({ username }).select("+password");
    if (!userCreds) {
        return next(new ErrorHandler("Invalid username or password.", 400));
    }

    const isPasswordMatched = await userCreds.comparePassword(password);
    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid username or password.", 400));
    }

    const userDetails = await UserDetails.findOne({ userid: userCreds._id });
    if (!userDetails) {
        return next(new ErrorHandler("User details not found.", 404));
    }

    const combinedUser = {
        email: userCreds.email,
        phoneNumber: userDetails.phoneNumber,
        username: userDetails.username,
        userRole: userDetails.userRole,
        fullName: userDetails.fullName,
        id: userCreds._id
    };


    sendToken(userCreds, 200, res, "Login Successful", combinedUser);
});

export const logout = catchAsyncError(async (req, res, next) => {
    res
        .status(200)
        .cookie('token', '', {
            httpOnly: true,
            expires: new Date(Date.now()),
        })
        .json({
            success: true,
            message: 'User logged out successfully.',
        });
});
