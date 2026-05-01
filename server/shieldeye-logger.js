// middleware/shieldeye-logger.js
import { v4 as uuidv4 } from "uuid"
import { connectLogDB } from "./db.js"
import dotenv from "dotenv"

export async function logEvent(req, res, {
    event_type,
    level = "info",
    category,
    source,
    message,
    stack = "",
    tags = []
}) {
    try {

        const ldb = await connectLogDB()
        const collection = ldb.collection("event_logs")

        const log = {
            _id: uuidv4(),
            timestamp: new Date(),
            level,
            category,
            event_type,
            source,
            message,
            stack,
            app: {
                name: process.env.APP_NAME || "MyApp",
                version: process.env.APP_VERSION || "1.0.0"
            },
            user: {
                id: req?.validatedUserId || "anonymous",
                ip: req?.ip,
                method: req?.method,
                endpoint: req?.originalUrl,
                status: res?.statusCode,
                user_agent: req?.headers["user-agent"]
            },
            tags
        }

        await collection.insertOne(log)

    } catch (err) {
        console.error("ShieldEye Logger Error:", err.message)
    }
}

export function errorEvent(err, req, res, next) {
    logEvent(req, res, {
        event_type: err.name || "UnhandledException",
        level: "error",
        category: "server",
        source: req.originalUrl,
        message: err.message,
        stack: err.stack,
        tags: ["error", "exception"]
    })

    next(err)
}