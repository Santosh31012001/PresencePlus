import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";
import { Student } from "../model/Student.js";
import { Teacher } from "../model/Teacher.js";
import JWT from "../middleware/JWT.js";

//login
async function Login(req, res) {
  const { email, password } = req.body;
  let type = "student";
  //check if user is a student
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
        .json({ user: user, type: type, token: token });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } else {
    res.status(400).json({ message: "No such User" });
  }
}
// Create a new user  or we can say register
async function Signup(req, res) {
  try {
    console.log('Signup request body:', req.body);  // Debug log

    const { name, email, pno, password, type, regno, branch, year, section } = req.body;

    // Validate required fields
    if (!name || !email || !password || !type) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ['name', 'email', 'password', 'type'],
        received: Object.keys(req.body)
      });
    }

    // Extra validation for students
    if (type === 'student' && (!regno || !branch || !year || !section)) {
      return res.status(400).json({
        message: "Missing student fields",
        required: ['regno', 'branch', 'year', 'section'],
        received: Object.keys(req.body)
      });
    }

    // Validate type
    if (type !== 'student' && type !== 'teacher') {
      return res.status(400).json({
        message: "Invalid type. Must be 'student' or 'teacher'",
        received: type
      });
    }

    if (type === "student") {
      const user = new Student({
        name,
        email,
        pno,
        password,
        regno,
        branch,
        year,
        section,
      });

      const existingUser = await Student.findOne({ email: email }).exec();
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const newUser = await user.save();
      console.log('Created new student:', email);  // Debug log
      res.status(201).json(newUser);

    } else {
      const user = new Teacher({
        name,
        email,
        pno,
        password,
      });

      const existingUser = await Teacher.findOne({ email: email }).exec();
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const newUser = await user.save();
      console.log('Created new teacher:', email);  // Debug log
      res.status(201).json(newUser);
    }

  } catch (err) {
    console.error('Signup error:', err);  // Debug log
    res.status(400).json({
      message: "Registration failed",
      error: err.message,
      details: err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : undefined
    });
  }
}
//change password
async function ForgotPassword(req, res) {
  const { email, password } = req.body;
  //check if user is a student
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

//edit user details
async function EditUserDetails(req, res) {
  const { email, name, pno, dob } = req.body;
  //check if user is a student
  let user = await Student.findOne
    .findOneAndUpdate({ email }, { name, pno, dob })
    .exec();
  if (!user) {
    user = await Teacher.findOneAndUpdate
      .findOneAndUpdate({ email }, { name, pno, dob })
      .exec();
  }
  if (user) {
    res.status(200).json({ message: "User updated" });
  }
}

//send mail
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
      res.status(200).json({ message: "OTP sent successfully", otp: otp });
    }
  });
}

const UserController = {
  Login,
  Signup,
  ForgotPassword,
  EditUserDetails,
  SendMail,
};

export default UserController;
