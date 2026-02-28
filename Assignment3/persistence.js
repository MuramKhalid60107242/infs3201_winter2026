const fs = require("fs/promises")

async function getEmployees(){
    let data = await fs.readFile('employees.json');
    return JSON.parse(data)
}

async function findEmployee(empId) {
    let employess = await getEmployees()
    for (let employee of employess) {
        if (employee.employeeId === empId) {
            return employee
        }
    }
    return undefined
}

async function findShift(shiftId) {
    let data = await fs.readFile('shfts.json')
    let shifts = JSON.parse(data)
    for (let shift of shifts) {
        if (shift.shiftId === shiftId) {
            return shift
        }
    }
    return undefined
}

async function findAssignment(empId, shiftId) {
    let data = await fs.readFile('assignments.json')
    let assignments = JSON.parse(data)
    for (let assignment of assignments) {
        if (assignment.employeeId === empId && assignment.shiftId === shiftId) {
            return assignment
        }
    }
    return undefined
}

async function addAssignment(empId, shiftId) {
    let data = await fs.readFile('assignments.json')
    let assignments = JSON.parse(data)
    assignments.push({employeeId: empId, shiftId: shiftId})
    await fs.writeFile('assignments.json', JSON.stringify(assignment,null,4))
}

async function addEmployeeRecord(emp) {
    let employees = await getEmployees()
    let maxId = 0

    for (let e of employees) {
        let num = Number(e.employeeId.slice(1))
        if (num > maxId) {
            maxId = num
        }
    }
    emp.employeeId = `E${String(maxId + 1).padStart(3, '0')}`
    employees.push(emp)

    await fs.writeFile('employees.json', JSON.stringify(employees,null,4))
}

async function getEmployeeShifts(empId) {
    let asnData = await fs.readFile('assignments.json')
    let assignments = JSON.parse(asnData)
    
    let shiftIds = []
    for (let a of assignments) {
        if (a.employeeId === empId) {
            shiftIds.push(a.shiftId)
        }
    }
    let shData = await fs.readFile('shifts.json')
    let shifts = JSON.parse(shData)

    return shifts.filter(s => shiftIds.includes(s.shiftId))
}

module.exports = {
    getEmployees,
    findEmployee,
    findShift,
    findAssignment,
    addAssignment,
    addEmployeeRecord,
    getEmployeeShifts
}
