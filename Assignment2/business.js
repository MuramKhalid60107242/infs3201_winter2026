const { prependListener } = require('node:cluster')
const persistence = require('./persistence')

async function assignShift(empId, shiftId) {
    let employee = await persistence.findEmployee(empId)
    if (!employee) {
        return 'Employee does not exist'
    }
}

async function createEmployee(name, phone) {
    await persistence.addEmployeeRecord({
        name: name,
        phone: phone
    })
}

async function getEmployeeSchedule(empId) {
    return await persistence.getEmployeeShifts(empId)
}

module.exports = {
    assignShift,
    createEmployee,
    getEmployeeSchedule
}