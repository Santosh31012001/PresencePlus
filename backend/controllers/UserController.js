import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";
import { Student } from "../model/Student.js";
import { Teacher } from "../model/Teacher.js";
import JWT from "../middleware/JWT.js";
import uploadImage from "../middleware/Cloudinary.js";

// ─── Login ───────────────────────────────────────────────────────────────────
async function Login(req, res) {
  const { email, password } = req.body;
  let type = "student";

  let user = await Student.findOne({ email });
  if (!user) {
    type = "teacher";
    user = await Teacher.findOne({ email });
  }

  if (user) {
    if (user.password === password) {
      const token = JWT.generateToken({ email: user.email });
      user.type = type;
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        })
        .status(200)
        .json({ user, type, token });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } else {
    res.status(400).json({ message: "No such User" });
  }
}

// ─── Signup ───────────────────────────────────────────────────────────────────
// Now accepts multipart/form-data so students can upload a face photo
async function Signup(req, res) {
  try {
    console.log("Signup request body keys:", Object.keys(req.body));

    const { name, email, pno, password, type, regno, branch, year, section } = req.body;

    // Validate required fields
    if (!name || !email || !password || !type) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["name", "email", "password", "type"],
        received: Object.keys(req.body),
      });
    }

    if (type !== "student" && type !== "teacher") {
      return res.status(400).json({
        message: "Invalid type. Must be 'student' or 'teacher'",
        received: type,
      });
    }

    // Extra validation for students
    if (type === "student" && (!regno || !branch || !year)) {
      return res.status(400).json({
        message: "Missing student fields",
        required: ["regno", "branch", "year"],
        received: Object.keys(req.body),
      });
    }

    if (type === "student") {
      const existingUser = await Student.findOne({ email }).exec();
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Upload face photo to Cloudinary if provided
      let profilePhotoUrl = null;
      if (req.file) {
        try {
          console.log("📸 Uploading profile face photo to Cloudinary...");
          profilePhotoUrl = await uploadImage(req.file.filename);
          console.log("✅ Profile photo uploaded:", profilePhotoUrl);
        } catch (uploadErr) {
          // Don't fail signup if photo upload times out — student can retake later
          console.warn("⚠️ Profile photo upload failed (student saved without it):", uploadErr.message);
          profilePhotoUrl = null;
        }
      }

      const user = new Student({
        name,
        email,
        pno,
        password,
        regno,
        branch,
        year,
        section,
        profile_photo: profilePhotoUrl,
      });

      const newUser = await user.save();
      console.log("Created new student:", email);
      res.status(201).json(newUser);

    } else {
      const existingUser = await Teacher.findOne({ email }).exec();
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = new Teacher({ name, email, pno, password });
      const newUser = await user.save();
      console.log("Created new teacher:", email);
      res.status(201).json(newUser);
    }

  } catch (err) {
    console.error("Signup error:", err);
    res.status(400).json({
      message: "Registration failed",
      error: err.message,
      details: err.errors
        ? Object.keys(err.errors).map((key) => ({
            field: key,
            message: err.errors[key].message,
          }))
        : undefined,
    });
  }
}

// ─── Get Profile Photo ────────────────────────────────────────────────────────
// Used by StudentForm.js to fetch the stored face photo for comparison
async function GetProfilePhoto(req, res) {
  try {
    const tokenData = req.user;
    const student = await Student.findOne({ email: tokenData.email });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json({
      profile_photo: student.profile_photo,
      email: student.email,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// ─── Forgot Password ─────────────────────────────────────────────────────────
async function ForgotPassword(req, res) {
  const { email, password } = req.body;
  let user = await Student.findOneAndUpdate({ email }, { password }).exec();
  if (!user) {
    user = await Teacher.findOneAndUpdate({ email }, { password }).exec();
  }
  if (user) {
    res.status(200).json({ message: "Password changed successfully" });
  } else {
    res.status(400).json({ message: "No such User" });
  }
}

// ─── Edit User Details ────────────────────────────────────────────────────────
async function EditUserDetails(req, res) {
  const { email, name, pno } = req.body;
  let user = await Student.findOneAndUpdate({ email }, { name, pno }).exec();
  if (!user) {
    user = await Teacher.findOneAndUpdate({ email }, { name, pno }).exec();
  }
  if (user) {
    res.status(200).json({ message: "User updated" });
  }
}

// ─── Send OTP Mail ────────────────────────────────────────────────────────────
function SendMail(req, res) {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "OTP for registration",
    text: `Your OTP is ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      res.status(400).json({ message: error.message });
    } else {
      console.log("Email sent: " + info.response);
      res.status(200).json({ message: "OTP sent successfully", otp });
    }
  });
}

const UserController = {
  Login,
  Signup,
  ForgotPassword,
  EditUserDetails,
  SendMail,
  GetProfilePhoto,
};

export default UserController;
