const express = require("express")
const bodyParser = require("body-parser")
const handleBars = require("express-handlebars")
const mongodb = require("mongodb")
const fs = require("fs")
const path = require("path")
const persistence = require("./persistence")
const notifications = require("./emailSystem")

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set("views", __dirname + "/templates")
app.set("view engine", "handlebars")
app.engine("handlebars", handleBars.engine({
    helpers: {
        eq: (a, b) => a === b
    }
}))

// Make sure the uploads folder exists on startup
const uploadsDir = path.join(__dirname, "uploads")
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

// ── Utility functions ────────────────────────────────────────────────────────

/**
 * Produces a random 6-character numeric string for use as a 2FA code.
 * @returns {string}
 */
function makeVerificationCode() {
    return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("")
}

/**
 * Reads a named cookie from the raw cookie header string.
 *
 * @param {string} rawCookieHeader
 * @param {string} name
 * @returns {string|undefined}
 */
function readCookie(rawCookieHeader, name) {
    if (!rawCookieHeader) return undefined
    for (const part of rawCookieHeader.split(";")) {
        const trimmed = part.trim()
        const prefix = name + "="
        if (trimmed.startsWith(prefix)) {
            return trimmed.slice(prefix.length)
        }
    }
    return undefined
}

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000 // 5-minute session timeout

// ── Middleware ───────────────────────────────────────────────────────────────

// Attach an authenticated session to the request, or expire stale ones
app.use(async (req, res, next) => {
    const rawCookie = req.headers.cookie
    const sid = rawCookie ? rawCookie.split("=")[1] : undefined

    if (sid) {
        const session = await persistence.getSession(sid)
        if (session) {
            const elapsed = Date.now() - session.lastActivity
            if (elapsed > INACTIVITY_LIMIT_MS) {
                await persistence.removeSession(sid)
            } else {
                await persistence.touchSession(sid)
                req.session = session
            }
        }
    }
    next()
})

// Log every incoming request for security auditing
app.use(async (req, res, next) => {
    await persistence.writeSecurityLog({
        timestamp: new Date(),
        username: req.session?.user?.username ?? "anonymous",
        path: req.originalUrl,
        method: req.method
    })
    next()
})

// Route guard: redirect unauthenticated users to login
function mustBeLoggedIn(req, res, next) {
    if (!req.session?.user) return res.redirect("/login")
    next()
}

// Route guard: reject non-admin users
function mustBeAdmin(req, res, next) {
    if (req.session.user.role !== "admin") return res.send("Access denied")
    next()
}

// ── Auth routes ──────────────────────────────────────────────────────────────

app.get("/login", (req, res) => {
    res.render("login", { layout: undefined, message: req.query.message })
})

app.get("/signup", (req, res) => {
    res.render("signup", { layout: undefined, message: req.query.message })
})

app.post("/signup", async (req, res) => {
    const { username, password, confirmPassword, email } = req.body

    if (!username || !password || !confirmPassword || !email) {
        return res.redirect("/signup?message=All+fields+are+required")
    }
    if (username.length < 3) {
        return res.redirect("/signup?message=Username+must+be+at+least+3+characters")
    }
    if (password.length < 6) {
        return res.redirect("/signup?message=Password+must+be+at+least+6+characters")
    }
    if (password !== confirmPassword) {
        return res.redirect("/signup?message=Passwords+do+not+match")
    }

    const existing = await persistence.findUser(username)
    if (existing) {
        return res.redirect("/signup?message=Username+already+exists")
    }

    try {
        await persistence.createUser(username, password, email)
        return res.redirect("/login?message=Account+created.+Please+sign+in.")
    } catch {
        return res.redirect("/signup?message=Could+not+create+account.+Try+again.")
    }
})

app.post("/login", async (req, res) => {
    const { username, password } = req.body

    if (await persistence.isAccountLocked(username)) {
        return res.redirect("/login?message=Account+is+locked.+Contact+support.")
    }

    const account = await persistence.findUser(username)

    if (!account || account.password !== password) {
        const record = await persistence.incrementFailedAttempts(username)
        const count = record?.failedAttempts ?? 0

        if (count === 3) {
            notifications.notifySuspiciousLogin(account?.email ?? username + "@company.com")
        }

        if (count >= 10) {
            await persistence.lockAccount(username)
            notifications.notifyAccountLocked(account?.email ?? username + "@company.com")
            return res.redirect("/login?message=Account+locked+after+too+many+failed+attempts.")
        }

        return res.redirect("/login?message=Incorrect+username+or+password")
    }

    // Credentials valid — issue 2FA code
    const verificationCode = makeVerificationCode()
    persistence.store2FACode(username, verificationCode)
    notifications.notify2FACode(account.email, verificationCode)

    const tempId = new mongodb.ObjectId().toString()
    res.setHeader("Set-Cookie", [
        "tempSessionId=" + tempId + "; HttpOnly",
        "2faUser=" + username
    ])
    res.redirect("/2fa?message=A+verification+code+has+been+sent+to+your+email")
})

app.get("/2fa", (req, res) => {
    const twoFAUser = readCookie(req.headers.cookie, "2faUser")
    if (!twoFAUser) return res.redirect("/login?message=Please+sign+in+first")

    res.render("twoFA", {
        layout: undefined,
        message: req.query.message,
        username: twoFAUser
    })
})

app.post("/2fa", async (req, res) => {
    const { code } = req.body
    const twoFAUser = readCookie(req.headers.cookie, "2faUser")

    if (!twoFAUser) return res.redirect("/login?message=Please+sign+in+first")

    const stored = persistence.get2FACode(twoFAUser)

    if (!stored) {
        return res.redirect("/2fa?message=Code+has+expired.+Please+sign+in+again.")
    }
    if (stored.code !== code) {
        return res.redirect("/2fa?message=Incorrect+code.+Please+try+again.")
    }

    const account = await persistence.findUser(twoFAUser)
    const newSessionId = new mongodb.ObjectId().toString()

    await persistence.createSession(newSessionId, {
        username: account.username,
        role: account.role
    })

    await persistence.resetFailedAttempts(twoFAUser)
    persistence.remove2FACode(twoFAUser)

    res.setHeader("Set-Cookie", [
        "sessionId=" + newSessionId + "; HttpOnly",
        "tempSessionId=; Max-Age=0",
        "2faUser=; Max-Age=0"
    ])
    res.redirect("/")
})

app.get("/logout", async (req, res) => {
    const sid = req.headers.cookie ? req.headers.cookie.split("=")[1] : undefined
    if (sid) await persistence.removeSession(sid)
    res.setHeader("Set-Cookie", "sessionId=; Max-Age=0")
    res.redirect("/login")
})

// ── Main app routes ──────────────────────────────────────────────────────────

app.get("/", mustBeLoggedIn, async (req, res) => {
    const employees = await persistence.getAllEmployees()
    res.render("landing", { employees, user: req.session.user, layout: undefined })
})

app.get("/employeeDetails", mustBeLoggedIn, async (req, res) => {
    const empId = req.query.empId
    const employee = await persistence.findEmployee(empId)
    if (!employee) return res.send("Employee not found")

    let shifts = await persistence.getEmployeeShifts(empId)

    // Sort shifts by date + start time (bubble sort)
    for (let i = 0; i < shifts.length - 1; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
            const timeA = new Date(shifts[i].date + "T" + shifts[i].startTime)
            const timeB = new Date(shifts[j].date + "T" + shifts[j].startTime)
            if (timeA > timeB) {
                [shifts[i], shifts[j]] = [shifts[j], shifts[i]]
            }
        }
    }

    // Tag each shift as morning (before noon) or afternoon
    shifts = shifts.map(shift => {
        const hourOfDay = parseInt(shift.startTime.split(":")[0])
        return { ...shift, isMorning: hourOfDay < 12 }
    })

    res.render("employeeDetails", { employee, shifts, user: req.session.user, layout: undefined })
})

app.get("/editEmployee", mustBeLoggedIn, mustBeAdmin, async (req, res) => {
    const employee = await persistence.findEmployee(req.query.empId)
    res.render("editEmployee", { employee, layout: undefined })
})

app.post("/editEmployee", mustBeLoggedIn, mustBeAdmin, async (req, res) => {
    const name = req.body.name.trim()
    const phone = req.body.phone.trim()

    if (!name) return res.send("Name cannot be empty")
    if (!/^\d{4}-\d{4}$/.test(phone)) return res.send("Phone format must be XXXX-XXXX")

    await persistence.updateEmployee(req.body.empId, { name, phone })
    res.redirect("/")
})

// ── Document upload routes ───────────────────────────────────────────────────

app.get("/employee/:id/upload", mustBeLoggedIn, async (req, res) => {
    const empId = req.params.id
    const employee = await persistence.findEmployee(empId)
    if (!employee) return res.send("Employee not found")

    const docs = await persistence.getEmployeeFiles(empId)

    res.render("uploadDocument", {
        layout: undefined,
        employee,
        fileCount: docs.length,
        canUpload: docs.length < 5,
        user: req.session.user
    })
})

app.post("/employee/:id/upload", mustBeLoggedIn, async (req, res) => {
    const empId = req.params.id
    const employee = await persistence.findEmployee(empId)
    if (!employee) return res.send("Employee not found")

    const docs = await persistence.getEmployeeFiles(empId)
    if (docs.length >= 5) {
        return res.send("This employee already has the maximum of 5 documents")
    }

    return res.send("File upload requires form implementation. See documentation.")
})

app.get("/employee/:id/documents/:docId", mustBeLoggedIn, async (req, res) => {
    const { id: empId, docId } = req.params

    try {
        const fileMeta = await persistence.getFileById(docId)

        if (!fileMeta) return res.send("Document not found")
        if (fileMeta.employeeId !== empId) return res.send("Document does not belong to this employee")
        if (!fs.existsSync(fileMeta.storagePath)) return res.send("File missing from server")

        res.download(fileMeta.storagePath, fileMeta.originalName)
    } catch (err) {
        res.send("Error retrieving document: " + err.message)
    }
})

app.listen(8000)