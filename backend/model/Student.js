import mongoose from "mongoose";
const schema = mongoose.Schema;

const userSchema = new schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true },
    pno:      { type: String },
    regno:    { type: String, required: true },
    branch:   { type: String, required: true },
    year:     { type: String, required: true },
    section:  { type: String },
    password: { type: String, required: true },
    profile_photo: { type: String, default: null }, // Face photo URL from signup
    sessions: [
      {
        session_id: { type: String, required: true },
        date: { type: String, required: true },
        time: { type: String, required: true },
        name: { type: String, required: true },
        duration: { type: String, required: true },
        distance: { type: String, required: true },
        radius: { type: String, required: true },
        student_location: { type: String, required: true },
        image: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const Student = mongoose.model("student", userSchema);
