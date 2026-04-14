import React, { useEffect, useRef, useState, useCallback } from "react";
import "../styles/Signup.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import image512 from "../assets/logo512.png";
import image192 from "../assets/logonew.png";
import { SHA256 } from "crypto-js";
import see from "../assets/see.png";
import hide from "../assets/hide.png";

const Signup = () => {
  const navigate = useNavigate();

  // ── Auth guard ────────────────────────────────────────────────────────────
  const token = localStorage.getItem("token") || "";

  // ── Slide state ───────────────────────────────────────────────────────────
  const [slide, setSlide] = useState(1);

  // ── Form values — all in state so they survive slide transitions ──────────
  const [form, setForm] = useState({
    type: "", name: "", email: "", otp: "",
    pno: "", regno: "", branch: "", year: "", section: "",
    password: "", confirmPassword: "",
  });
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // ── OTP ───────────────────────────────────────────────────────────────────
  const [savedOtp, setSavedOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── Face capture ──────────────────────────────────────────────────────────
  const videoRef          = useRef(null);
  const streamRef         = useRef(null); // keep stream ref separate from video
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoData, setPhotoData] = useState("");
  const [cameraOn, setCameraOn]   = useState(false);

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera. Please allow camera permission.");
    }
  }, []);

  // ── Stop camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  }, []);

  // ── Capture photo ─────────────────────────────────────────────────────────
  const capturePhoto = async () => {
    const video  = videoRef.current;
    if (!video) return;
    const MAX_W  = 320;
    const scale  = Math.min(1, MAX_W / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width  = video.videoWidth  * scale;
    canvas.height = video.videoHeight * scale;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    const blob    = await fetch(dataUrl).then((r) => r.blob());
    setPhotoData(dataUrl);
    setPhotoBlob(blob);
    stopCamera();
  };

  const resetPhoto = () => {
    setPhotoData("");
    setPhotoBlob(null);
    startCamera();
  };

  // ── Cleanup camera when leaving slide 5 or unmounting ────────────────────
  useEffect(() => {
    if (slide !== 5) stopCamera();
  }, [slide, stopCamera]);

  useEffect(() => {
    return () => stopCamera(); // cleanup on unmount
  }, [stopCamera]);

  // ── Auth redirect ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (token) navigate("/dashboard");
  }, [token, navigate]);

  // ── Slide navigation ───────────────────────────────────────────────────────
  const goTo2 = async () => {
    if (!form.name || !form.email || !form.type) {
      alert("Please fill all the fields"); return;
    }
    setSlide(2);
    try {
      const res = await axios.post("http://localhost:5000/users/sendmail", { email: form.email });
      setSavedOtp(String(res.data.otp));
    } catch (err) { console.log(err); }
  };

  const goTo3 = () => {
    if (!form.otp)                        { alert("Please Enter OTP"); return; }
    if (form.otp !== savedOtp)            { alert("Invalid OTP");      return; }
    setSlide(3);
  };

  const goTo4 = () => {
    if (form.type === "student") {
      if (!form.regno || !form.branch || !form.year) {
        alert("Please fill Roll No, Branch and Year"); return;
      }
    }
    setSlide(4);
  };

  const goTo5OrSubmit = () => {
    if (!form.password || !form.confirmPassword) { alert("Please fill in your password"); return; }
    if (form.password !== form.confirmPassword)  { alert("Passwords do not match");       return; }
    if (form.type === "student") {
      setSlide(5);
    } else {
      submitForm(); // Teachers skip face capture
    }
  };

  // ── Hash password ──────────────────────────────────────────────────────────
  function hashPassword(email, password) {
    return SHA256(email + SHA256(password).toString()).toString();
  }

  // ── Submit form ────────────────────────────────────────────────────────────
  const submitForm = async () => {
    const formData = new FormData();
    formData.append("name",     form.name);
    formData.append("email",    form.email);
    formData.append("password", hashPassword(form.email, form.password));
    formData.append("pno",      form.pno);
    formData.append("type",     form.type);

    if (form.type === "student") {
      if (!form.regno || !form.branch || !form.year) {
        alert("Please fill all student details"); return;
      }
      formData.append("regno",   form.regno);
      formData.append("branch",  form.branch);
      formData.append("year",    form.year);
      formData.append("section", form.section);
      if (photoBlob) formData.append("profile_photo", photoBlob, "face.jpg");
    }

    try {
      await axios.post("http://localhost:5000/users/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Signup failed. Please try again.");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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

            {/* ── Slide 1: Account Type, Name, Email ── */}
            {slide === 1 && (
              <div className="first-slide">
                <select name="type" value={form.type} onChange={set("type")} required>
                  <option value="" disabled>Select Account Type</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
                <input type="text"  placeholder="Name"  value={form.name}  onChange={set("name")}  required />
                <input type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
                <button type="button" onClick={goTo2}>Next</button>
              </div>
            )}

            {/* ── Slide 2: OTP ── */}
            {slide === 2 && (
              <div className="second-slide">
                <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                  OTP sent to <strong>{form.email}</strong>
                </p>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={form.otp}
                  onChange={set("otp")}
                  required
                />
                <button type="button" onClick={() => setSlide(1)}>Edit Email</button>
                <button type="button" onClick={goTo3}>Verify OTP</button>
              </div>
            )}

            {/* ── Slide 3: Phone + Student Fields ── */}
            {slide === 3 && (
              <div className="third-slide">
                <input type="text" placeholder="Phone Number (optional)" value={form.pno}     onChange={set("pno")} />
                {form.type === "student" && (
                  <>
                    <input type="text" placeholder="Roll Number"          value={form.regno}   onChange={set("regno")}   required />
                    <input type="text" placeholder="Branch (e.g. CSE)"    value={form.branch}  onChange={set("branch")}  required />
                    <input type="text" placeholder="Year (e.g. 2nd Year)" value={form.year}    onChange={set("year")}    required />
                    <input type="text" placeholder="Section (e.g. A)"     value={form.section} onChange={set("section")} />
                  </>
                )}
                <button type="button" onClick={() => setSlide(1)}>Back</button>
                <button type="button" onClick={goTo4}>Next</button>
              </div>
            )}

            {/* ── Slide 4: Password ── */}
            {slide === 4 && (
              <div className="fourth-slide">
                <div className="pass-input-div">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={form.password}
                    onChange={set("password")}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((p) => !p)}>
                    <img src={showPassword ? hide : see} alt="toggle" />
                  </button>
                </div>
                <div className="pass-input-div">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword((p) => !p)}>
                    <img src={showPassword ? hide : see} alt="toggle" />
                  </button>
                </div>
                <button type="button" onClick={() => setSlide(3)}>Back</button>
                <button type="button" onClick={goTo5OrSubmit}>
                  {form.type === "student" ? "Next → Capture Face" : "Sign Up"}
                </button>
              </div>
            )}

            {/* ── Slide 5: Face Capture (Students only) ── */}
            {slide === 5 && (
              <div className="fifth-slide">
                <p style={{ fontWeight: 600, margin: "0 0 4px 0" }}>
                  📸 Capture your face for attendance verification
                </p>
                <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 12px 0" }}>
                  This photo will be used to verify your identity when marking attendance.
                </p>

                {/* Show video OR captured photo — never both */}
                {photoData ? (
                  <img src={photoData} alt="Face preview" style={{ width: "100%", borderRadius: 8 }} />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: "100%", borderRadius: 8, background: "#111" }}
                  />
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {photoData ? (
                    <button type="button" onClick={resetPhoto} style={{ flex: 1 }}>
                      Retake
                    </button>
                  ) : (
                    <>
                      {!cameraOn && (
                        <button type="button" onClick={startCamera} style={{ flex: 1 }}>
                          Start Camera
                        </button>
                      )}
                      <button type="button" onClick={capturePhoto} disabled={!cameraOn} style={{ flex: 1 }}>
                        Capture
                      </button>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button type="button" onClick={() => setSlide(4)} style={{ flex: 1 }}>
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={submitForm}
                    disabled={!photoData}
                    style={{ flex: 1, opacity: photoData ? 1 : 0.5, cursor: photoData ? "pointer" : "not-allowed" }}
                  >
                    {photoData ? "Complete Sign Up ✅" : "Capture face first"}
                  </button>
                </div>
              </div>
            )}

          </div>

          <p className="login-bottom-p">
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#76ABAE" }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
