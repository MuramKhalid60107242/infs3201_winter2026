const express = require("express")
const business = require("./business")
const bodyParser = require("body-parser")
const exphbs = require("express-handlebars")

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))

app.set("views", __dirname + "/templates")
app.set("view engine", "handlebars")
app.engine("handlebars", exphbs.engine())

/**
 * 
 */
app.get("/", async (req, res) => {
    const employeesList = await business.listEmployees()
    res.render("landing", {
        employees: employeesList,
        layout: undefined
    })
})

app.get("/employeeDetails", async (req, res) => {
    let employeeId = req.query.empId
    let employeeData = await business.getEmployee(employeeId)

    if (employeeData === null) {
        res.send("Employee not found")
        return
    }

    let assignedShifts = await business.listEmployeeShifts(employeeId)

    for (let x = 0; x < assignedShifts.length; x++) {
        for (let y = x + 1; y < assignedShifts.length; y++) {
            const first = new Data(
                assignedShifts[x].data + "T" + assignedShifts[x].startTime
            )
            const second = new Data(
                assignedShifts[y].data + "T" + assignedShifts[y].startTime
            )
            if (first > second) {
                let swap = assignedShifts[x]
                assignedShifts[x] = assignedShifts[y]
                assignedShifts[y] = swap
            }
        }
    }

    for (let i = 0; i < assignedShifts.length; i++) {
        let timeParts = assignedShifts[i].startTime.split(":")
        let startHour = Number(timeParts[0])
        assignedShifts[i].isMorning = startHour < 12
    }

    res.render("employeeDetails", {
        employee: employeeData,
        shifts: assignedShifts,
        layout: undefined
    })
})

app.get("/editEmployee", async (req, res) => {
    let employeeId = req.query.empId
    let employeeData = await business.getEmployee(employeeId)

    if (employeeData === null) {
        res.send("Employee not found")
        return
    }

    res.render("editEmployee", {
        employee: employeeData,
        layout: undefined
    })
})

app .post("/editEmployee", async (req, res) => {
    let employeeId = req.body.empId
    let updateName = req.body.name.trim()
    let updatePhone = req.body.phone.trim()

    let phonePattern = /^[0-9]{4}-[0-9]{4}$/

    if (updateName.length === 0){
        res.send("Name cannot be empty")
        return
    }

    if (!phonePattern.test(updatePhone)){
        res.send("Phone must bi in fprmat ####-####")
        return
    }

    await business.saveemployee(employeeId, {
        name: updateName,
        phone: updatePhone
    })

    res.redirect("/")
})

app.listen(8000, function() {
    console.log("Server started")
})