import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { userCollection } from "../database.js";

const JWT_SECRET = process.env.JWT_SECRET || "gufcbr hjeuei g38eirg";

export const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await (await userCollection.find({ email: email }).toArray()).at(0)

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.password !== password) {
      return res.status(200).json({ message: 'Invalid Login Credentials' })
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleRegisterPassenger = async (req, res) => {
  try {
    const { name, emailId, phone, password } = req.body;

    if (!name || !emailId || !phone || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and phone are required" });
    }

    const user = userCollection.find({ email: emailId }).toArray()

    // Check if user already exists
    if ((await user).length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    const email = emailId;
    const newUser = {
      email,
      password,
      name,
      phone,
      role: "passenger"
    };

    await userCollection.insertOne(newUser)

    const token = jwt.sign(
      { role: newUser.role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Middleware to check user role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};
