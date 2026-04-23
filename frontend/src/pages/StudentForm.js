import React, { useState, useRef } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";
import { Box, Flex, Text, Button, VStack, HStack, Spinner } from "@chakra-ui/react";
import {
  MdClose, MdCameraAlt, MdFlipCameraAndroid,
  MdCheckCircle, MdWarning, MdGpsFixed, MdSend,
  MdFaceRetouchingNatural,
} from "react-icons/md";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  VERIFIED:         { emoji: "✅", color: "#3dd498", bg: "#eafaf4", label: "Verified"          },
  SUSPICIOUS:       { emoji: "⚠️", color: "#f59e0b", bg: "#fffbeb", label: "Suspicious"        },
  OUTSIDE_GEOFENCE: { emoji: "❌", color: "#ff6b81", bg: "#fff0f1", label: "Outside Geofence"  },
};

const FACE_BANNERS = {
  verifying: { bg: "#eff6ff", border: "rgba(59,130,246,0.3)",  color: "#1d4ed8", text: "🧠 Verifying your identity… please wait",  icon: (s) => <Spinner size="xs" color="#3b82f6" /> },
  passed:    { bg: "#d1fae5", border: "rgba(16,185,129,0.3)",  color: "#065f46", text: "✅ Identity verified!",                     icon: () => <MdCheckCircle size={14} color="#10b981" /> },
  failed:    { bg: "#fee2e2", border: "rgba(239,68,68,0.3)",   color: "#991b1b", text: "❌ Face mismatch — attendance blocked",      icon: () => <MdWarning size={14} color="#ef4444" /> },
};

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const Card = ({ children }) => (
  <Box
    bg="white"
    borderRadius="24px"
    boxShadow="0 24px 64px rgba(122,105,255,0.2)"
    border="1px solid rgba(122,105,255,0.12)"
    overflow="hidden"
    w={{ base: "92vw", sm: "440px" }}
    maxH="90vh"
    overflowY="auto"
  >
    <Box h="3px" style={{ background: "linear-gradient(90deg, #7a69ff, #9b8aff)" }} />
    {children}
  </Box>
);

const SectionLabel = ({ children }) => (
  <Text
    fontSize="10px"
    fontWeight="800"
    color="gray.400"
    textTransform="uppercase"
    letterSpacing="0.1em"
    mb={2}
  >
    {children}
  </Text>
);

const FaceBanner = ({ status }) => {
  const cfg = FACE_BANNERS[status];
  if (!cfg) return null;
  return (
    <Flex
      align="center"
      gap={2}
      bg={cfg.bg}
      border={`1.5px solid ${cfg.border}`}
      borderRadius="12px"
      px={4} py="10px"
      mb={4}
      color={cfg.color}
      fontSize="sm"
      fontWeight="600"
    >
      {cfg.icon()}
      <Text>{cfg.text}</Text>
    </Flex>
  );
};

const GpsBanner = ({ isCapturing }) => {
  if (!isCapturing) return null;
  return (
    <Flex
      align="center"
      gap={3}
      bg="#f0eeff"
      border="1.5px solid rgba(122,105,255,0.25)"
      borderRadius="12px"
      px={4} py="10px"
      mb={4}
    >
      <Spinner size="sm" color="#7a69ff" />
      <Box>
        <Text fontSize="sm" fontWeight="700" color="#7a69ff">Capturing GPS…</Text>
        <Text fontSize="xs" color="gray.400">Please stay still for a moment</Text>
      </Box>
    </Flex>
  );
};

// ─── Camera Section ───────────────────────────────────────────────────────────

const CameraSection = ({ videoRef, photoData, onStart, onCapture, onReset, disabled }) => (
  <Box mb={5}>
    <SectionLabel>Step 1 — Capture Photo</SectionLabel>

    {/* Preview area */}
    <Box
      borderRadius="14px"
      overflow="hidden"
      bg="#f8f7ff"
      border="1.5px solid rgba(122,105,255,0.15)"
      minH="180px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
    >
      {photoData ? (
        <Box as="img" src={photoData} w="100%" alt="Captured" display="block" />
      ) : (
        <>
          <Box as="video" ref={videoRef} w="100%" autoPlay display="block" />
          {!videoRef.current?.srcObject && (
            <Flex
              position="absolute" inset={0}
              direction="column" align="center" justify="center" gap={2}
              pointerEvents="none"
            >
              <MdCameraAlt size={36} color="#c4baff" />
              <Text fontSize="xs" color="gray.400">Tap Start Camera</Text>
            </Flex>
          )}
        </>
      )}
    </Box>

    {/* Camera controls */}
    <HStack gap={2} mt={3}>
      <Button
        flex={1} size="sm"
        bg="#f0eeff" color="#7a69ff"
        borderRadius="10px" fontWeight="600"
        _hover={{ bg: "#e8e2ff" }}
        onClick={onStart}
        isDisabled={disabled}
      >
        <MdCameraAlt size={14} />
        <Box as="span" ml={1}>Start</Box>
      </Button>

      <Button
        flex={1} size="sm"
        style={{ background: "linear-gradient(135deg, #7a69ff, #9b8aff)" }}
        color="white"
        borderRadius="10px" fontWeight="600"
        boxShadow="0 4px 12px rgba(122,105,255,0.3)"
        _hover={{ opacity: 0.9 }}
        onClick={onCapture}
        isDisabled={disabled}
      >
        <MdCameraAlt size={14} />
        <Box as="span" ml={1}>Capture</Box>
      </Button>

      <Button
        size="sm"
        variant="ghost"
        color="gray.400"
        borderRadius="10px" fontWeight="600"
        _hover={{ bg: "gray.100", color: "gray.600" }}
        onClick={onReset}
        isDisabled={disabled}
      >
        <MdFlipCameraAndroid size={14} />
        <Box as="span" ml={1}>Redo</Box>
      </Button>
    </HStack>
  </Box>
);

// ─── Submit Section ───────────────────────────────────────────────────────────

const SubmitSection = ({ onSubmit, disabled, isCapturingGPS, isSubmitting }) => (
  <Box as="form" onSubmit={onSubmit}>
    <SectionLabel>Step 2 — Submit Details</SectionLabel>

    <Box
      as="input"
      type="text"
      name="regno"
      placeholder="Registration Number"
      autoComplete="off"
      disabled={disabled}
      w="100%"
      px="14px"
      py="10px"
      mb={3}
      fontSize="sm"
      color="gray.800"
      bg="#f8f7ff"
      border="1.5px solid"
      borderColor="rgba(122,105,255,0.2)"
      borderRadius="10px"
      outline="none"
      display="block"
      style={{ fontFamily: "inherit" }}
      onFocus={(e) => { e.target.style.borderColor = "#7a69ff"; e.target.style.boxShadow = "0 0 0 3px rgba(122,105,255,0.12)"; }}
      onBlur={(e)  => { e.target.style.borderColor = "rgba(122,105,255,0.2)"; e.target.style.boxShadow = "none"; }}
    />

    <Button
      type="submit"
      w="100%"
      h="44px"
      style={{
        background: disabled
          ? "#c4b5fd"
          : "linear-gradient(135deg, #7a69ff, #6558ee)",
      }}
      color="white"
      fontWeight="700"
      fontSize="sm"
      borderRadius="12px"
      boxShadow={disabled ? "none" : "0 6px 20px rgba(122,105,255,0.38)"}
      _hover={disabled ? {} : { transform: "translateY(-2px)", boxShadow: "0 10px 28px rgba(122,105,255,0.5)" }}
      transition="all 0.2s"
      isDisabled={disabled}
      cursor={disabled ? "not-allowed" : "pointer"}
    >
      {isSubmitting || isCapturingGPS ? (
        <HStack gap={2} justify="center">
          <Spinner size="xs" />
          <Text>{isCapturingGPS ? "Capturing GPS…" : "Submitting…"}</Text>
        </HStack>
      ) : (
        <HStack gap={2} justify="center">
          <MdSend size={15} />
          <Text>Submit Attendance</Text>
        </HStack>
      )}
    </Button>
  </Box>
);

// ─── Result Screen ────────────────────────────────────────────────────────────

const ResultScreen = ({ result, onClose }) => {
  const isSuccess = result.type === "success";
  const cfg = isSuccess ? (STATUS_CFG[result.status] || STATUS_CFG.SUSPICIOUS) : null;

  const iconEmoji = isSuccess ? cfg.emoji
    : result.type === "faceMismatch" ? "❌"
    : result.type === "expired"      ? "⏰"
    : "❌";

  const iconBg = isSuccess ? cfg.bg
    : result.type === "expired" ? "#fffbeb"
    : "#fff0f1";

  return (
    <Card>
      <VStack gap={5} p={8} align="center" textAlign="center">
        {/* Icon */}
        <Box
          bg={iconBg}
          borderRadius="50%"
          w="80px" h="80px"
          display="flex" alignItems="center" justifyContent="center"
          fontSize="2rem"
          boxShadow={`0 8px 24px ${isSuccess ? cfg.color : "#ff6b81"}22`}
        >
          {iconEmoji}
        </Box>

        {/* Success */}
        {isSuccess && (
          <>
            <Text fontWeight="800" fontSize="xl" color="gray.800">{result.message}</Text>
            <Box
              bg={cfg.bg}
              color={cfg.color}
              border={`1px solid ${cfg.color}33`}
              borderRadius="999px"
              px={4} py="6px"
            >
              <Text fontWeight="700" fontSize="sm">{cfg.label}</Text>
            </Box>
            <Text fontSize="sm" color="gray.400">
              GPS Accuracy:{" "}
              <Box as="span" fontWeight="700" color="#7a69ff">
                {(result.consistency_score * 100).toFixed(0)}%
              </Box>
            </Text>
          </>
        )}

        {/* Face mismatch */}
        {result.type === "faceMismatch" && (
          <>
            <Text fontWeight="800" fontSize="xl" color="red.500">Face Mismatch</Text>
            <Text fontSize="sm" color="gray.500" maxW="300px">
              Your face does not match the registered profile photo.
            </Text>
            <Button
              onClick={() => window.location.reload()}
              style={{ background: "linear-gradient(135deg, #7a69ff, #9b8aff)" }}
              color="white" fontWeight="700" borderRadius="12px"
              boxShadow="0 4px 14px rgba(122,105,255,0.4)"
              _hover={{ transform: "translateY(-2px)" }}
              transition="all 0.2s"
            >
              Try Again
            </Button>
          </>
        )}

        {/* Expired */}
        {result.type === "expired" && (
          <>
            <Text fontWeight="800" fontSize="xl" color="orange.500">QR Code Expired</Text>
            <Text fontSize="sm" color="gray.500">
              The 15-minute window has closed. Ask your teacher to create a new session.
            </Text>
            {result.message && (
              <Box bg="#f8f7ff" borderRadius="10px" p={3} w="100%">
                <Text fontSize="xs" color="gray.400" wordBreak="break-word">{result.message}</Text>
              </Box>
            )}
          </>
        )}

        {/* Error */}
        {result.type === "error" && (
          <>
            <Text fontWeight="800" fontSize="xl" color="red.500">Something went wrong</Text>
            <Box bg="#fff0f1" border="1px solid rgba(255,107,129,0.2)" borderRadius="10px" p={3} w="100%">
              <Text fontSize="xs" color="#ff6b81" wordBreak="break-word">{result.errorMsg}</Text>
            </Box>
            <Button
              onClick={() => window.location.reload()}
              style={{ background: "linear-gradient(135deg, #7a69ff, #9b8aff)" }}
              color="white" fontWeight="700" borderRadius="12px"
              boxShadow="0 4px 14px rgba(122,105,255,0.4)"
            >
              Try Again
            </Button>
          </>
        )}

        <Button
          onClick={onClose}
          variant="ghost"
          color="gray.400"
          fontWeight="600"
          borderRadius="12px"
          _hover={{ bg: "#f8f7ff", color: "#7a69ff" }}
        >
          Back to Dashboard
        </Button>
      </VStack>
    </Card>
  );
};

// ─── Main StudentForm ─────────────────────────────────────────────────────────

const StudentForm = ({ togglePopup }) => {
  const [token]          = useState(localStorage.getItem("token") || "");
  const [image, setImage]          = useState(null);
  const [photoData, setPhotoData]  = useState("");
  const videoRef = useRef(null);

  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const gpsReadingsRef = useRef([]);

  const [faceStatus, setFaceStatus]             = useState(null);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);

  const [result, setResult]         = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBusy = isCapturingGPS || isSubmitting;

  // ── Camera ──────────────────────────────────────────────────────────────────
  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => { videoRef.current.srcObject = stream; })
      .catch((err) => console.error("Camera error:", err));
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) { stream.getTracks().forEach((t) => t.stop()); videoRef.current.srcObject = null; }
  };

  const capturePhoto = async () => {
    const canvas = document.createElement("canvas");
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    setImage(await fetch(dataUrl).then((r) => r.blob()));
    setPhotoData(dataUrl);
    stopCamera();
  };

  const resetCamera = () => { setPhotoData(""); setImage(null); startCamera(); };

  // ── GPS ──────────────────────────────────────────────────────────────────────
  const captureGPSReadings = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject("Geolocation not supported"); return; }
      setIsCapturingGPS(true);
      gpsReadingsRef.current = [];
      let resolved = false;

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (resolved) return;
          gpsReadingsRef.current.push({
            latitude:  parseFloat(pos.coords.latitude.toFixed(6)),
            longitude: parseFloat(pos.coords.longitude.toFixed(6)),
            accuracy:  pos.coords.accuracy,
            timestamp: new Date().toISOString(),
          });
          if (gpsReadingsRef.current.length >= 5) {
            resolved = true;
            navigator.geolocation.clearWatch(watchId);
            setIsCapturingGPS(false);
            resolve([...gpsReadingsRef.current]);
          }
        },
        (err) => {
          if (resolved) return;
          resolved = true;
          navigator.geolocation.clearWatch(watchId);
          setIsCapturingGPS(false);
          reject(`GPS error: ${err.message}`);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );

      // 10s hard cap
      setTimeout(() => {
        if (resolved) return;
        resolved = true;
        navigator.geolocation.clearWatch(watchId);
        setIsCapturingGPS(false);
        if (gpsReadingsRef.current.length > 0) resolve([...gpsReadingsRef.current]);
        else reject("GPS timeout: no readings received");
      }, 10000);
    });

  // ── Face verification ────────────────────────────────────────────────────────
  const verifyFace = async (livePhotoDataUrl) => {
    setFaceStatus("verifying");
    try {
      if (!faceModelsLoaded) {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setFaceModelsLoaded(true);
      }
      const profileRes = await axios.get("http://localhost:5000/users/profile_photo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profilePhotoUrl = profileRes.data.profile_photo;
      if (!profilePhotoUrl) { setFaceStatus("passed"); return true; }

      const loadImg = (src) =>
        new Promise((res, rej) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload  = () => res(img);
          img.onerror = () => rej(new Error("Failed to load: " + src));
          img.src = src;
        });

      const opts = new faceapi.TinyFaceDetectorOptions();
      const [liveImg, profileImg] = await Promise.all([loadImg(livePhotoDataUrl), loadImg(profilePhotoUrl)]);
      const [liveDet, profDet]    = await Promise.all([
        faceapi.detectSingleFace(liveImg, opts).withFaceLandmarks(true).withFaceDescriptor(),
        faceapi.detectSingleFace(profileImg, opts).withFaceLandmarks(true).withFaceDescriptor(),
      ]);

      if (!liveDet) { setFaceStatus("failed"); return false; }
      if (!profDet) { setFaceStatus("passed"); return true; }

      const dist = faceapi.euclideanDistance(liveDet.descriptor, profDet.descriptor);
      const passed = dist < 0.5;
      setFaceStatus(passed ? "passed" : "failed");
      return passed;
    } catch (err) {
      console.error("Face verification error:", err);
      setFaceStatus("passed"); // fail-open
      return true;
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const regno = e.target.regno.value.trim();
    if (!regno)     { alert("Please enter your registration number."); return; }
    if (!photoData) { alert("Please capture your photo first.");        return; }

    setIsSubmitting(true);
    try {
      const faceMatch = await verifyFace(photoData);
      if (!faceMatch) { setResult({ type: "faceMismatch" }); return; }

      axios.defaults.withCredentials = false;
      const { data: ipData } = await axios.get("https://api64.ipify.org?format=json");
      axios.defaults.withCredentials = true;

      const gpsReadingsArray = await captureGPSReadings();

      const formData = new FormData();
      formData.append("token",         token);
      formData.append("regno",         regno);
      formData.append("session_id",    localStorage.getItem("session_id"));
      formData.append("teacher_email", localStorage.getItem("teacher_email"));
      formData.append("IP",            ipData.ip);
      formData.append("date",          new Date().toISOString().split("T")[0]);
      formData.append("gps_readings",  JSON.stringify(gpsReadingsArray));
      formData.append("student_email", localStorage.getItem("email"));
      if (image instanceof Blob) formData.append("image", image, "photo.png");

      const { data } = await axios.post(
        "http://localhost:5000/sessions/attend_session",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setResult({ type: "success", message: data.message, status: data.status, consistency_score: data.consistency_score });
    } catch (err) {
      console.error("Attendance error:", err);
      if (err.response?.status === 410 || err.response?.data?.expired) {
        setResult({ type: "expired", message: err.response?.data?.message });
        return;
      }
      let errorMsg = "Error marking attendance: ";
      if      (err.response?.status === 400) errorMsg += err.response.data?.message || "Bad request";
      else if (err.response?.status === 404) errorMsg += "Session not found";
      else                                   errorMsg += err.message;
      setResult({ type: "error", errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Result screen ─────────────────────────────────────────────────────────────
  if (result) {
    return <ResultScreen result={result} onClose={() => togglePopup("close")} />;
  }

  // ── Main form ─────────────────────────────────────────────────────────────────
  return (
    <Card>
      {/* Header */}
      <Flex align="center" justify="space-between" px={5} py={4} borderBottom="1px solid rgba(122,105,255,0.1)">
        <HStack gap={3}>
          <Flex
            w="36px" h="36px"
            borderRadius="10px"
            align="center" justify="center"
            style={{ background: "linear-gradient(135deg, #7a69ff, #9b8aff)" }}
            boxShadow="0 4px 10px rgba(122,105,255,0.3)"
          >
            <MdFaceRetouchingNatural size={18} color="white" />
          </Flex>
          <Box>
            <Text fontWeight="800" fontSize="sm" color="gray.800" lineHeight={1.2}>Mark Attendance</Text>
            <Text fontSize="10px" color="gray.400" mt="1px">Complete both steps below</Text>
          </Box>
        </HStack>

        <Box
          as="button"
          w="32px" h="32px"
          borderRadius="8px"
          display="flex" alignItems="center" justifyContent="center"
          color="gray.400"
          bg="transparent"
          border="none"
          cursor={isBusy ? "not-allowed" : "pointer"}
          onClick={() => !isBusy && togglePopup("close")}
          style={{ transition: "all 0.15s" }}
          onMouseEnter={(e) => { if (!isBusy) { e.currentTarget.style.background = "#fff0f1"; e.currentTarget.style.color = "#ff6b81"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
        >
          <MdClose size={18} />
        </Box>
      </Flex>

      {/* Body */}
      <VStack align="stretch" gap={0} p={5}>
        <FaceBanner status={faceStatus} />
        <GpsBanner isCapturing={isCapturingGPS} />

        <CameraSection
          videoRef={videoRef}
          photoData={photoData}
          onStart={startCamera}
          onCapture={capturePhoto}
          onReset={resetCamera}
          disabled={isBusy}
        />

        <SubmitSection
          onSubmit={handleSubmit}
          disabled={isBusy}
          isCapturingGPS={isCapturingGPS}
          isSubmitting={isSubmitting}
        />
      </VStack>
    </Card>
  );
};

export default StudentForm;
