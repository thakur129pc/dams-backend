import jwt from 'jsonwebtoken';
import User from '../webApi/webModel/webUserDetails.js'; // Ensure the path is correct
import ErrorHandler from './error.js';
import { catchAsyncError } from "../middleware/catchAsyncError.js";

// Middleware to verify token and attach user data to req object
const requireAuth = catchAsyncError(async (req, res, next) => {
  // Get the token from the Authorization header
  const { authorization } = req.headers;

  // Check if the authorization header is present and formatted correctly
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new ErrorHandler('Authorization token required or improperly formatted', 401));
  }

  // Extract token by splitting 'Bearer TOKEN'
  const token = authorization.split(' ')[1];

  try {
    // Verify the token using the secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Find the user by the decoded userId and attach user info to the request
    const user = await User.findById(decodedToken.id).select('_id role name'); // Fetching _id, role, and name
    if (!user) {
      return next(new ErrorHandler('User not found', 401));
    }

    // Check if the user has a valid role
    if (typeof user.role === 'undefined' || user.role === null) {
      return next(new ErrorHandler('User role is missing', 403));
    }

    // Attach user information to the request object
    req.user = {
      id: user._id,
      role: user.role,
      name: user.name
    };

    // Continue to the next middleware
    next();
  } catch (error) {
    // Handle specific token expiration errors
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorHandler('Token expired, please log in again', 401));
    }
    // Handle all other token-related errors
    return next(new ErrorHandler('Unauthorized, invalid token', 401));
  }
});

export default requireAuth;
