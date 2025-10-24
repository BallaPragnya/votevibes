const express = require("express");
const router = express.Router();
const db = require("../db.js"); // ✅ MySQL connection
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
// ✅ USER REGISTRATION
router.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (result.length > 0)
        return res.status(400).json({ message: "User already registered" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
      db.query(sql, [username, email, hashedPassword, role || "user"], (err2) => {
        if (err2) return res.status(500).json({ message: "Database error" });
        res.json({ success: true, message: "✅ User registered successfully!" });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
// LOGIN ROUTE
router.post("/login", (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: "Please enter credentials" });
  }

  const sql = `
    SELECT * FROM users 
    WHERE email = ? OR roll_no = ? OR admin_id = ?
  `;

  db.query(sql, [identifier, identifier, identifier], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ success: false, message: "User not found" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Incorrect password" });

    res.json({
      success: true,
      message: "✅ Login successful!",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  });
});
// FORGOT PASSWORD

router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Please provide your email" });

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.length === 0)
      return res.status(404).json({ message: "No account found with that email" });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    db.query(
      "UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?",
      [token, expires, email],
      (err2) => {
        if (err2) return res.status(500).json({ message: "Database error" });

        // send reset email
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "youremail@gmail.com", // 🔒 replace
            pass: "your-app-password", // 🔒 use App Password
          },
        });

        const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;

        const mailOptions = {
          from: "VoteVibes <youremail@gmail.com>",
          to: email,
          subject: "Password Reset Request",
          html: `
            <h2>Reset Your Password</h2>
            <p>Click the link below to reset your password. This link is valid for 15 minutes.</p>
            <a href="${resetLink}">${resetLink}</a>
          `,
        };

        transporter.sendMail(mailOptions, (error) => {
          if (error) {
            console.error(error);
            return res.status(500).json({ message: "Failed to send email" });
          }
          res.json({ success: true, message: "📩 Reset link sent to your email!" });
        });
      }
    );
  });
});
// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword)
    return res.status(400).json({ message: "Missing fields" });

  db.query(
    "SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()",
    [token],
    async (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (result.length === 0)
        return res.status(400).json({ message: "Invalid or expired token" });

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        "UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE reset_token = ?",
        [hashedPassword, token],
        (err2) => {
          if (err2) return res.status(500).json({ message: "Database error" });
          res.json({ success: true, message: "✅ Password reset successful!" });
        }
      );
    }
  );
});

module.exports = router;
