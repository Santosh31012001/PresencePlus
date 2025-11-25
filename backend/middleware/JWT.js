import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

function verifyToken(req, res, next) {
  // Accept token from httpOnly cookie (preferred), Authorization header or body
  const token =
    req.cookies.token ||
    (req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.replace("Bearer ", "").trim()
      : null) ||
    req.body.token ||
    req.query.token;

  if (!token) {
    return res.status(401).json({ message: "Access denied. Token missing." });
  }

  try {
    const secret =
      process.env.JWT_SECRET || "atendo-secret-key-2025-secure-jwt-token-sign";
    const verified = jwt.verify(token, secret);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function generateToken(data) {
  // Will generate token using user info and server secret key
  const secret =
    process.env.JWT_SECRET || "atendo-secret-key-2025-secure-jwt-token-sign";
  return jwt.sign(data, secret, { expiresIn: "5h" });
}

const JWT = {
  verifyToken,
  generateToken,
};

export default JWT;
