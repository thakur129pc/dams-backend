import UserDetails from '../mobileApi/mobileModel/userDetailsSchema.js';

export const sendToken = async (userCreds, statusCode, res, message) => {
    
    try {
        const userDetails = await UserDetails.findOne({ userid: userCreds._id });

        if (!userDetails) {
            return res.status(404).json({
                success: false,
                message: 'User details not found',
            });
        }

        const token = userCreds.getJWTToken(); 
        const options = {
            maxAge: parseInt(process.env.COOKIE_EXPIRE_SECONDS) * 1000, 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
        };

      
        res.status(statusCode).cookie("token", token, options).json({
            status: true,
            message,
            token,
            user: {
                userId: userCreds._id,
                username:userDetails.username,
                email: userDetails.email,
                phoneNumber: userDetails.phoneNumber,
                userRole: userDetails.userRole,
                fullName: userDetails.fullName,
            }
        });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({
            status: false,
            message: 'Server Error',
        });
    }
};
