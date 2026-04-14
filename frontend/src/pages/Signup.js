import React, { useEffect, useState } from "react";
import "../styles/Signup.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import image512 from "../assets/logo512.png";
import image192 from "../assets/logonew.png";
import { SHA256 } from "crypto-js";
import see from "../assets/see.png";
import hide from "../assets/hide.png";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  // eslint-disable-next-line
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [SaveOTP, setOtp] = useState(
    Math.floor(100000 + Math.random() * 900000) || 0
  );
  // Track selected account type to show/hide student-specific fields
  const [accountType, setAccountType] = useState("");
  const navigate = useNavigate();

  function computeHash(input) {
    return SHA256(input).toString();
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    let name     = e.target.name.value;
    let pno      = e.target.pno.value;
    let email    = e.target.email.value;
    let type     = e.target.type.value;
    let password = e.target.password.value;
    let confirmPassword = e.target.confirmPassword.value;

    if (password.length > 0 && confirmPassword.length > 0) {
      if (password === confirmPassword) {
        password = computeHash(password);
        password = computeHash(email + password);

        const formData = { name, email, password, pno, type };

        // Add student-specific fields if account type is student
        if (type === "student") {
          formData.regno   = e.target.regno.value;
          formData.branch  = e.target.branch.value;
          formData.year    = e.target.year.value;
          formData.section = e.target.section.value;

          if (!formData.regno || !formData.branch || !formData.year || !formData.section) {
            alert("Please fill all student details (Roll No, Branch, Year, Section)");
            return;
          }
        }

        try {
          await axios.post("http://localhost:5000/users/signup", formData);
          navigate("/login");
        } catch (err) {
          console.log(err);
          alert(err.response?.data?.message || "Signup failed. Please try again.");
        }
      } else {
        alert("Passwords do not match");
      }
    } else {
      alert("Please fill all the fields");
    }
  };

  // Slide 1 → 2: Validate name, email, type; then send OTP
  const toggleTwo = async () => {
    let name  = document.querySelector("input[name='name']").value;
    let email = document.querySelector("input[name='email']").value;
    let type  = document.querySelector("select[name='type']").value;

    if (!name || !email || !type) {
      alert("Please fill all the fields");
      return;
    }

    setAccountType(type);

    document.querySelector(".first-slide").style.display  = "none";
    document.querySelector(".second-slide").style.display = "block";
    document.querySelector(".third-slide").style.display  = "none";
    document.querySelector(".fourth-slide").style.display = "none";

    try {
      const res = await axios.post("http://localhost:5000/users/sendmail", { email });
      setOtp(res.data.otp);
    } catch (err) {
      console.log(err);
    }
  };

  // Slide 2 → 1: go back to edit email
  const toggleOne = () => {
    document.querySelector(".first-slide").style.display  = "block";
    document.querySelector(".second-slide").style.display = "none";
    document.querySelector(".third-slide").style.display  = "none";
    document.querySelector(".fourth-slide").style.display = "none";
  };

  // Slide 2 → 3: Verify OTP
  const toggleThree = () => {
    let otp = document.querySelector("input[name='otp']").value;
    if (!otp) {
      alert("Please Enter OTP");
      return;
    }
    if (parseInt(otp) !== parseInt(SaveOTP)) {
      alert("Invalid OTP");
      return;
    }
    document.querySelector(".first-slide").style.display  = "none";
    document.querySelector(".second-slide").style.display = "none";
    document.querySelector(".third-slide").style.display  = "block";
    document.querySelector(".fourth-slide").style.display = "none";
  };

  // Slide 3 → 4: Validate phone + student fields
  const toggleFour = () => {
    const pno = document.querySelector("input[name='pno']").value;

    // Validate student-specific fields if student type
    if (accountType === "student") {
      const regno   = document.querySelector("input[name='regno']").value;
      const branch  = document.querySelector("input[name='branch']").value;
      const year    = document.querySelector("input[name='year']").value;
      const section = document.querySelector("input[name='section']").value;

      if (!regno || !branch || !year || !section) {
        alert("Please fill all student details");
        return;
      }
    }

    document.querySelector(".first-slide").style.display  = "none";
    document.querySelector(".second-slide").style.display = "none";
    document.querySelector(".third-slide").style.display  = "none";
    document.querySelector(".fourth-slide").style.display = "block";
  };

  useEffect(() => {
    if (token !== "") {
      navigate("/dashboard");
    }
  });

  return (
    <div className="register-main">
      <div className="register-left">
        <img alt="Full" src={image512} />
      </div>
      <div className="register-right">
        <div className="register-right-container">
          <div className="register-logo">
            <img alt="logo" src={image192} />
          </div>
          <div className="register-center">
            <h2>Welcome to our website!</h2>
            <p>Please enter your details</p>
            <form onSubmit={handleRegisterSubmit}>

              {/* ── Slide 1: Name, Email, Account Type ── */}
              <div className="first-slide">
                <select
                  name="type"
                  id="type"
                  required
                  onChange={(e) => setAccountType(e.target.value)}
                >
                  <option value="" disabled hidden>
                    Select Account Type
                  </option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
                <input
                  type="text"
                  placeholder="Name"
                  name="name"
                  required={true}
                />
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  required={true}
                />
                <button type="button" onClick={toggleTwo}>
                  Next
                </button>
              </div>

              {/* ── Slide 2: OTP Verification ── */}
              <div className="second-slide" style={{ display: "none" }}>
                <input
                  type="text"
                  placeholder="Enter OTP sent to your email"
                  name="otp"
                  required={true}
                />
                <button type="button" onClick={toggleOne}>
                  Edit Email
                </button>
                <button type="button" onClick={toggleThree}>
                  Verify OTP
                </button>
              </div>

              {/* ── Slide 3: Phone + Student-Specific Details ── */}
              <div className="third-slide" style={{ display: "none" }}>
                <input
                  type="text"
                  placeholder="Phone Number (optional)"
                  name="pno"
                />

                {/* Student-only fields */}
                {accountType === "student" && (
                  <>
                    <input
                      type="text"
                      placeholder="Roll Number"
                      name="regno"
                      required={true}
                    />
                    <input
                      type="text"
                      placeholder="Branch (e.g. CSE, ECE)"
                      name="branch"
                      required={true}
                    />
                    <input
                      type="text"
                      placeholder="Year (e.g. 2nd Year)"
                      name="year"
                      required={true}
                    />
                    <input
                      type="text"
                      placeholder="Section (e.g. A, B)"
                      name="section"
                      required={true}
                    />
                  </>
                )}

                <button type="button" onClick={toggleOne}>
                  Back
                </button>
                <button type="button" onClick={toggleFour}>
                  Next
                </button>
              </div>

              {/* ── Slide 4: Password ── */}
              <div className="fourth-slide" style={{ display: "none" }}>
                <div className="pass-input-div">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    name="password"
                    required={true}
                  />
                  {showPassword ? (
                    <button
                      type="button"
                      onClick={() => setShowPassword(false)}
                      style={{ color: "white", padding: 0 }}
                    >
                      <img className="hide" src={hide} alt="hide" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPassword(true)}
                      style={{ color: "white", padding: 0 }}
                    >
                      <img className="see" src={see} alt="see" />
                    </button>
                  )}
                </div>
                <div className="pass-input-div">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    name="confirmPassword"
                    required={true}
                  />
                  {showPassword ? (
                    <button
                      type="button"
                      onClick={() => setShowPassword(false)}
                      style={{ color: "white", padding: 0 }}
                    >
                      <img className="hide" src={hide} alt="hide" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPassword(true)}
                      style={{ color: "white", padding: 0 }}
                    >
                      <img className="see" src={see} alt="see" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={toggleThree}
                  style={{ width: 100 + "%", marginBottom: 10 + "px" }}
                >
                  Back
                </button>
                <div className="register-center-buttons">
                  <button type="submit">Sign Up</button>
                </div>
              </div>

            </form>
          </div>

          <p className="login-bottom-p">
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#76ABAE" }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
