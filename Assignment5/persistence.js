const mongodb = require("mongodb")

let dbClient

/**
 * Returns an active database connection, creating one if none exists.
 *
 * @returns {Promise<import("mongodb").Db>}
 */
async function getDatabase() {
    if (!dbClient) {
        dbClient = new mongodb.MongoClient("mongodb+srv://zeinab:12class34@cluster0.vgwl6zo.mongodb.net/")
        await dbClient.connect()
    }
    return dbClient.db("infs3201_winter2026")
}

// ── Employee operations 

async function getAllEmployees() {
    const db = await getDatabase()
    return db.collection("employees").find().toArray()
}

async function findEmployee(empId) {
    const db = await getDatabase()
    return db.collection("employees").findOne({ _id: new mongodb.ObjectId(empId) })
}

async function updateEmployee(empId, fields) {
    const db = await getDatabase()
    await db.collection("employees").updateOne(
        { _id: new mongodb.ObjectId(empId) },
        { $set: fields }
    )
}

async function getEmployeeShifts(empId) {
    const db = await getDatabase()
    const allShifts = await db.collection("shifts").find().toArray()
    const matched = []

    for (const shift of allShifts) {
        const assigned = shift.employees.some(e => e.toString() === empId)
        if (assigned) matched.push(shift)
    }

    return matched
}

// ── User operations ──────────────────────────────────────────────────────────

async function findUser(username) {
    const db = await getDatabase()
    return db.collection("users").findOne({ username })
}

async function createUser(username, password, email, role = "user") {
    const db = await getDatabase()
    return db.collection("users").insertOne({
        username,
        password,
        email,
        role,
        createdAt: new Date()
    })
}

// ── Session operations ───────────────────────────────────────────────────────

async function createSession(sessionId, userData) {
    const db = await getDatabase()
    await db.collection("sessions").insertOne({
        _id: sessionId,
        user: userData,
        lastActivity: Date.now()
    })
}

async function getSession(sessionId) {
    const db = await getDatabase()
    return db.collection("sessions").findOne({ _id: sessionId })
}

async function touchSession(sessionId) {
    const db = await getDatabase()
    await db.collection("sessions").updateOne(
        { _id: sessionId },
        { $set: { lastActivity: Date.now() } }
    )
}

async function removeSession(sessionId) {
    const db = await getDatabase()
    await db.collection("sessions").deleteOne({ _id: sessionId })
}

// ── Security logging ─────────────────────────────────────────────────────────

async function writeSecurityLog(entry) {
    const db = await getDatabase()
    await db.collection("security_log").insertOne(entry)
}

// ── Login attempt tracking ───────────────────────────────────────────────────

async function getLoginAttempts(username) {
    const db = await getDatabase()
    return db.collection("login_attempts").findOne({ username })
}

async function incrementFailedAttempts(username) {
    const db = await getDatabase()
    const updated = await db.collection("login_attempts").findOneAndUpdate(
        { username },
        { $inc: { failedAttempts: 1 } },
        { upsert: true, returnDocument: "after" }
    )
    return updated.value
}

async function resetFailedAttempts(username) {
    const db = await getDatabase()
    await db.collection("login_attempts").updateOne(
        { username },
        { $set: { failedAttempts: 0 } },
        { upsert: true }
    )
}

async function lockAccount(username) {
    const db = await getDatabase()
    await db.collection("login_attempts").updateOne(
        { username },
        { $set: { isLocked: true, lockedAt: new Date() } },
        { upsert: true }
    )
}

async function isAccountLocked(username) {
    const record = await getLoginAttempts(username)
    return record?.isLocked === true
}

// ── 2FA code store (in-memory) ───────────────────────────────────────────────

let twoFAStore = {}

const CODE_TTL_MS = 3 * 60 * 1000 // 3 minutes

function store2FACode(username, code) {
    const now = Date.now()
    twoFAStore[username] = {
        code,
        issuedAt: now,
        expiresAt: now + CODE_TTL_MS
    }
}

function get2FACode(username) {
    const entry = twoFAStore[username]
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
        delete twoFAStore[username]
        return null
    }
    return entry
}

function remove2FACode(username) {
    delete twoFAStore[username]
}

// ── File metadata operations ─────────────────────────────────────────────────

async function storeFileMetadata(fileData) {
    const db = await getDatabase()
    return db.collection("file_uploads").insertOne({
        ...fileData,
        uploadedAt: new Date()
    })
}

async function getEmployeeFiles(employeeId) {
    const db = await getDatabase()
    return db.collection("file_uploads").find({ employeeId }).toArray()
}

async function getFileById(fileId) {
    const db = await getDatabase()
    return db.collection("file_uploads").findOne({ _id: new mongodb.ObjectId(fileId) })
}

async function deleteFileMetadata(fileId) {
    const db = await getDatabase()
    await db.collection("file_uploads").deleteOne({ _id: new mongodb.ObjectId(fileId) })
}

module.exports = {
    getAllEmployees,
    findEmployee,
    updateEmployee,
    getEmployeeShifts,
    findUser,
    createUser,
    createSession,
    getSession,
    touchSession,
    removeSession,
    writeSecurityLog,
    getLoginAttempts,
    incrementFailedAttempts,
    resetFailedAttempts,
    lockAccount,
    isAccountLocked,
    store2FACode,
    get2FACode,
    remove2FACode,
    storeFileMetadata,
    getEmployeeFiles,
    getFileById,
    deleteFileMetadata
}
