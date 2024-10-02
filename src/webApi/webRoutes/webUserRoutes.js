import express from "express";
import {
  changePassword,
  loginUser,
  signupUser,
} from "../webController/webUserController.js"; // Ensure the path is correct
import requireAuth from "../../middleware/auth.js";

const router = express.Router();

// Route for user login
router.post("/login", loginUser);
// Route for user signup
router.post("/register", signupUser);
// Route for change password
router.post("/change-password", requireAuth, changePassword);

export default router;
