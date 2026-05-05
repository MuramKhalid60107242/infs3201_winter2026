const crypto = require("crypto")
const express = require("express")
const handleBars = require("express-handlebars")
const mongodb = require("mongodb")
const persistence = require("./persistence")

const app = express()
app.use(express.urlencoded({ extended: false }))

app.set("views", __dirname + "/templates")
app.set("view engine", "handlebars")
app.engine("handlebars", handleBars.engine({
    helpers: {
        eq: function(a, b) {
            return a === b
        }
    }
}))

const SESSION_TIMEOUT = 5 * 60 * 1000
const SESSION_COOKIE_AGE_SECONDS = 5 * 60

function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex")
}

function getSessionIdFromCookie(cookieHeader) {
    if (!cookieHeader) {
        return undefined
    }

    const cookiePairs = cookieHeader.split(";")

    for (let i = 0; i < cookiePairs.length; i++) {
        const parts = cookiePairs[i].trim().split("=")
        if (parts[0] === "sessionId") {
            return parts[1]
        }
    }

    return undefined
}

function setSessionCookie(res, sessionId) {
    res.setHeader(
        "Set-Cookie",
        `sessionId=${sessionId}; Max-Age=${SESSION_COOKIE_AGE_SECONDS}; HttpOnly; Path=/`
    )
}

// Session middleware
app.use(async (req, res, next) => {
    const sessionId = getSessionIdFromCookie(req.headers.cookie)

    if (sessionId) {
        const session = await persistence.getSession(sessionId)
        if (session) {
            if (Date.now() - session.lastActivity > SESSION_TIMEOUT) {
                await persistence.deleteSession(sessionId)
                req.authMessage = "Session expired. Please log in again."
            } else {
                await persistence.updateSessionActivity(sessionId)
                req.session = session
                setSessionCookie(res, sessionId)
            }
        }
    }
    next()
})

// Security log middleware
app.use(async (req, res, next) => {
    await persistence.logSecurityEvent({
        timestamp: new Date(),
        username: req.session?.user?.username || "Unknown",
        url: req.originalUrl,
        method: req.method
    })
    next()
})

// Auth middleware
function requireLogin(req, res, next) {
    if (!req.session?.user) {
        const message = req.authMessage || "Please log in to continue."
        return res.redirect(`/login?message=${encodeURIComponent(message)}`)
    }
    next()
}

function requireAdmin(req, res, next) {
    if (req.session.user.role !== "admin") return res.send("Access denied")
    next()
}

// Login routes
app.get("/login", (req, res) => {
    res.render("login", { layout: undefined, message: req.query.message })
})

app.post("/login", async (req, res) => {
    const { username, password } = req.body
    const user = await persistence.findUser(username)
    const passwordHash = hashPassword(password)

    if (!user || user.password !== passwordHash) {
        return res.redirect("/login?message=Invalid+credentials")
    }

    const sessionId = new mongodb.ObjectId().toString()
    await persistence.createSession(sessionId, {
        username: user.username,
        role: user.role
    })

    setSessionCookie(res, sessionId)
    res.redirect("/")
})

app.get("/logout", async (req, res) => {
    const sessionId = getSessionIdFromCookie(req.headers.cookie)
    if (sessionId) await persistence.deleteSession(sessionId)

    res.setHeader("Set-Cookie", "sessionId=; Max-Age=0; HttpOnly; Path=/")
    res.redirect("/login?message=Logged+out")
})

// Routes
app.get("/", requireLogin, async (req, res) => {
    const employees = await persistence.getAllEmployees()
    res.render("landing", { employees, user: req.session.user, layout: undefined })
})

app.get("/employeeDetails", requireLogin, async (req, res) => {
    const empID = req.query.empId
    const employee = await persistence.findEmployee(empID)
    if (!employee) return res.send("Employee not found")

    const shifts = await persistence.getEmployeeShifts(empID)

    for (let i = 0; i < shifts.length - 1; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
            const da = new Date(shifts[i].date + "T" + shifts[i].startTime)
            const db = new Date(shifts[j].date + "T" + shifts[j].startTime)
            if (da > db) {
                const temp = shifts[i]
                shifts[i] = shifts[j]
                shifts[j] = temp
            }
        }
    }

    for (let i = 0; i < shifts.length; i++) {
        const hour = parseInt(shifts[i].startTime.split(":")[0])
        shifts[i].isMorning = hour < 12
    }

    res.render("employeeDetails", { employee, shifts, user: req.session.user, layout: undefined })
})

app.get("/editEmployee", requireLogin, requireAdmin, async (req, res) => {
    const employee = await persistence.findEmployee(req.query.empId)
    res.render("editEmployee", { employee, layout: undefined })
})

app.post("/editEmployee", requireLogin, requireAdmin, async (req, res) => {
    const name = req.body.name.trim()
    const phone = req.body.phone.trim()
    const photoUrl = req.body.photoUrl.trim()

    if (!name) return res.send("Name cannot be empty")
    if (!/^\d{4}-\d{4}$/.test(phone)) return res.send("Invalid phone")
    if (photoUrl && !/^https?:\/\//.test(photoUrl)) return res.send("Photo URL must start with http or https")

    await persistence.updateEmployee(req.body.empId, { name, phone, photoUrl })
    res.redirect("/")
})

app.listen(8000)
