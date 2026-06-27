import User from '../models/userModel.js';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const TOKEN_EXPIRE = '24h';

/* =========================
   GENERATE TOKEN
========================= */
const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in .env");
  }

  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRE }
  );
};

/* =========================
   REGISTER USER
========================= */
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required."
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email."
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters."
    });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "User already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const token = createToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   LOGIN USER
========================= */
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Both fields are required."
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = createToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   GET CURRENT USER
========================= */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      user
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   UPDATE PROFILE
========================= */
export const updateProfile = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email || !validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Valid name and email required."
    });
  }

  try {
    const exists = await User.findOne({
      email,
      _id: { $ne: req.user.id }
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email already in use."
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    ).select("name email");

    return res.json({
      success: true,
      user
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   UPDATE PASSWORD
========================= */
export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Invalid password input."
    });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};