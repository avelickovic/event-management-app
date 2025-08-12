const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');



exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await userModel.findUserByEmail(email);
    console.log("User found:", user);
    console.log(user.user_type);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if( user.status !== 'active') {
      return res.status(403).json({ message: "User is not active." });
    }


    const token = jwt.sign(
        { userId: user.id, type: user.user_type },
        process.env.JWT_SECRET,
    );

    res.status(200).json({ token });

  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error during login." });
  }
}

