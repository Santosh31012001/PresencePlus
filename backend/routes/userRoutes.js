import { Router } from "express";
const router = Router();
import UserController from "../controllers/UserController.js";
import JWT from "../middleware/JWT.js";
import upload from "../middleware/multer.js";

// Login
router.post("/signin", UserController.Login);

// Signup — uses multer to accept optional face photo (field name: "profile_photo")
router.post("/signup", upload.single("profile_photo"), UserController.Signup);

// Forgot password
router.post("/forgotpassword", UserController.ForgotPassword);

// Send OTP mail
router.post("/sendmail", UserController.SendMail);

// Get profile photo — protected, used by StudentForm for face verification
router.get("/profile_photo", JWT.verifyToken, UserController.GetProfilePhoto);

export default router;
