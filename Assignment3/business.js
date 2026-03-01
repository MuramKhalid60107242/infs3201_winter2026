const persistence = require("./persistence")


/**
 * 
 * @param {string} from 
 * @param {string} to 
 * @returns {number}
 */
function calculateHours(from, to){
    const fromSplit = from.split(":")
    const toSplit = to.split(":")

    const fromTotal = 
        Number(fromSplit[0]) * 60 + Number(fromSplit[1])
    const toTotal = 
        Number(toSplit[0]) * 60 + Number(toSplit[1])

    return (toTotal - fromTotal) / 60
}

/**
 * 
 * @returns 
 */
async function listEmployees() {
    const employees = await persistence.loadAllEmployees()
    return employees
}

/**
 * 
 * @param {string} employeeId 
 * @returns 
 */
async function getEmployee(employeeId) {
    return await persistence.getEmployeeById(employeeId)
}

/**
 * 
 * @param {*} employeeId 
 * @returns 
 */
async function listEmployeeShifts(employeeId) {
    const shifts = await persistence.loadEmployeeShifts(employeeId)
    return shifts
}

/**
 * 
 * @param {*} employeeId 
 * @param {*} newValues 
 */
async function saveemployee(employeeId, newValues) {
    await persistence.editEmployee(employeeId. newValues)
}


module.exports = {
    listEmployees,
    getEmployee,
    listEmployeeShifts,
    saveemployee,
    calculateHours
}
