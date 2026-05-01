import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import cors from "cors"
import dotenv from "dotenv"
import { connectDB, getDB } from "./db.js"
import { logEvent, errorEvent } from "./shieldeye-logger.js"

dotenv.config()

const app = express()
app.use(express.json())
app.use(cors())

const PORT = 5000
const SECRET = process.env.JWT_SECRET

//
// 🔐 AUTH MIDDLEWARE
//
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) return res.status(401).json({ message: "No token" })

  try {
    const decoded = jwt.verify(token, SECRET)
    req.user = decoded
    next()
  } catch {

//  ==============================================================
//  Create log event when user token is invalid
//  ==============================================================
    logEvent(req, res, {
        event_type: "LOGIN_FAILED",
        level: "warn",
        category: "authentication",
        source: "authController",
        message: `Failed login attempt for ${req.body.username} (invalid/forged token)`,
        tags: ["auth", "failed_login"]
    })
    return res.status(403).json({ message: "Invalid token" })
  }
}

//
// 🔐 AUTH ROUTES
//

// Signup
app.post("/api/signup", async (req, res) => {
  const db = getDB()
  const { username, password } = req.body

  const existing = await db.collection("users").findOne({ username })
  if (existing) {
    return res.status(400).json({ message: "User already exists" })
  }

  const hashed = await bcrypt.hash(password, 10)

  const result = await db.collection("users").insertOne({
    username,
    password: hashed,
    createdAt: new Date()
  })

//  ==============================================================
//  Create log event when user created an account
//  ==============================================================
    await logEvent(req, res, {
        event_type: "PROFILE_CREATION",
        level: "info",
        category: "authentication",
        source: "userController",
        message: `A new profile created for ${username}`,
        tags: ["auth", "successful_signup"]
    })

  res.json({ message: "User created", userId: result.insertedId })
})

// Login
app.post("/api/login", async (req, res) => {
  const db = getDB()
  const { username, password } = req.body

  const user = await db.collection("users").findOne({ username })
  if (!user) {

//  ==============================================================
//  Create log event when user provided invalid crendentials
//  ==============================================================
    await logEvent(req, res, {
        event_type: "LOGIN_FAILED",
        level: "warn",
        category: "authentication",
        source: "authController",
        message: `Failed login attempt for ${req.body.username} (Invalid credentials)`,
        tags: ["auth", "failed_login"]
    })
    return res.status(401).json({ message: "Invalid credentials" })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {

//  ==============================================================
//  Create log event when user provided invalid crendentials
//  ==============================================================
    await logEvent(req, res, {
        event_type: "LOGIN_FAILED",
        level: "warn",
        category: "authentication",
        source: "authController",
        message: `Failed login attempt for ${req.body.username} (Invalid credentials)`,
        tags: ["auth", "failed_login"]
    })
    return res.status(401).json({ message: "Invalid credentials" })
  }

  const token = jwt.sign(
    { id: user._id.toString(), username },
    SECRET,
    { expiresIn: "1h" }
  )

    await logEvent(req, res, {
    
//  ==============================================================
//  Create log event when user successfully login
//  ==============================================================
        event_type: "LOGIN_SUCCESSFUL",
        level: "info",
        category: "authentication",
        source: "authController",
        message: `${username} successfully login into their account`,
        tags: ["auth", "successful_login"]
    })

  res.json({ token })
})

//
// 🧾 TICKET ROUTES
//

// Create ticket
app.post("/api/tickets", auth, async (req, res) => {
  const db = getDB()
  const { title, content } = req.body
  const userId = req.user.id

  const ticket = {
    userId,
    title,
    content,
    createdAt: new Date()
  }

  const result = await db.collection("tickets").insertOne(ticket)

//  ==============================================================
//  Create log event when user create a ticket
//  ==============================================================
    await logEvent(req, res, {
        event_type: "TICKET_CREATTION",
        level: "info",
        category: "file_creation",
        source: "ticketController",
        message: `user '${userId}' successfully created a note titled: ${title}`,
        tags: ["file", "successful_file_creation"]
    })

  res.json({ ...ticket, _id: result.insertedId })
})

// Get user tickets
app.get("/api/tickets", auth, async (req, res) => {
  const db = getDB()

  const userTickets = await db
    .collection("tickets")
    .find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .toArray()

  res.json(userTickets)
})

app.use(errorEvent)

//
// 🚀 START SERVER
//
async function start() {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start()