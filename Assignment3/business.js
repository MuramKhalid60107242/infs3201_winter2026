const persistence = require("./persistence")

/**
 * Calculate shift duration in hours
 * @param {string} from 
 * @param {string} to 
 * @returns {number} duration in hours
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
 * Return all the employees
 * @returns {Promise<Array>}
 */
async function listEmployees() {
    const employees = await persistence.loadAllEmployees()
    return employees
}

/**
 * find an emolyee by ID
 * @param {string} employeeId 
 * @returns {Promise<Object|undefined}
 */
async function getEmployee(employeeId) {
    return await persistence.getEmployeeById(employeeId)
}

/**
 * get all the shifts of an employee
 * @param {string} employeeId 
 * @returns {Promise<Array}
 */
async function listEmployeeShifts(employeeId) {
    const shifts = await persistence.loadEmployeeShifts(employeeId)
    return shifts
}

/**
 * update employee details
 * @param {string} employeeId 
 * @param {{name:string, phone:string}} newValues 
 */
async function saveemployee(employeeId, newValues) {
    await persistence.editEmployee(employeeId, newValues)
}


module.exports = {
    listEmployees,
    getEmployee,
    listEmployeeShifts,
    saveemployee,
    calculateHours
}
