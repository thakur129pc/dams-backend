import { catchAsyncError } from '../../middleware/catchAsyncError.js';
import UserDetails from '../mobileModel/userDetailsSchema.js';
import UserCredentials from '../mobileModel/userCredsSchema.js';
import ErrorHandler from '../../middleware/error.js';
import { sendToken } from '../../utils/jwt.js';



export const register = catchAsyncError(async (req, res, next) => {
    const { username, password, email, phoneNumber, userRole, fullName } = req.body;

    // Validate required fields
    if (!username || !password) {
        return res.status(200).json({
            status: false,
            message: "Please provide username & password.",
        });
    }

    const isUsernameExists = await UserCredentials.findOne({ username });
    if (isUsernameExists) {
        return res.status(200).json({
            status: false,
            message: "Username already exists.",
        });
    }

    // Create user credentials
    const newUserCreds = await UserCredentials.create({
        username,
        password,
        email,
    });

    // Create user details
    await UserDetails.create({
        userid: newUserCreds._id,
        username,
        phoneNumber,
        userRole,
        fullName,
        isUserDeleted: false,
        updatedAt: Date.now(),
    });

    const token = newUserCreds.getJWTToken();

    sendToken(newUserCreds, 201, res, "User registered successfully!", {
        email: newUserCreds.email,
        phoneNumber,
        username,
        userRole,
        fullName,
        id: newUserCreds._id,
    });
});

export const login = catchAsyncError(async (req, res, next) => {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
        return res.status(200).json({
            status: false,
            message: "Please provide username & password.",
        });
    }

    const userCreds = await UserCredentials.findOne({ username }).select("+password");
    if (!userCreds) {
        return res.status(200).json({
            status: false,
            message: "Invalid username or password",
        });
    }

    const isPasswordMatched = await userCreds.comparePassword(password);
    if (!isPasswordMatched) {
        return res.status(200).json({
            status: false,
            message: "Invalid username or password",
        });
    }

    const userDetails = await UserDetails.findOne({ userid: userCreds._id });
    if (!userDetails) {
        return res.status(200).json({
            status: false,
            message: "User details not found.",
        });
    }

    // If everything is okay, you can send back user details
   

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
            status: true,
            message: 'User logged out successfully.',
        });
});
