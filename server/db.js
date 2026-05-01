import { MongoClient } from "mongodb"
import dotenv from "dotenv"

dotenv.config()
const client = new MongoClient(process.env.MONGO_URI)

let db
let ldb

// General Database Connection
export async function connectDB() {
  if (!db) {
    await client.connect()
    db = client.db(process.env.USER_DB_NAME)
    console.log("MongoDB connected")
  }
  return db
}

// Log Event database Connection
export async function connectLogDB() {
  if (!ldb) {
    await client.connect()
    ldb = client.db(process.env.LOG_DB_NAME)
    console.log("MongoDB connected - logs")
  }
  return ldb
}

export function getDB() {
  if (!db) throw new Error("DB not initialized")
  return db
}