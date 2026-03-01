const persistence = require('./persistence')

//I used the professor solution to solve assignment2


/**
 * return all employees
 * @returns {Array}
 */
async function getAllEmployees() {
    return await persistence.getEmployees()
}


/**
 * Assign an employee to a shift
 * @param {string} empId 
 * @param {string} shiftId 
 * @returns {string}
 */
async function assignShift(empId, shiftId) {
    let employee = await persistence.findEmployee(empId)
    if (!employee) {
        return 'Employee does not exist'
    }

    let shift = await persistence.findShift(shiftId)
    if (!shift) {
        return 'Shift does not exist'
    }

    let assignment = await persistence.findAssignment(empId, shiftId)
    if (assignment) {
        return 'Employee already assigned to shift'
    }

    await persistence.addAssignment(empId, shiftId)
    return 'Ok'
}

/**
 * Create a new employee
 * @param {string} name 
 * @param {string} phone 
 */
async function createEmployee(name, phone) {
    await persistence.addEmployeeRecord({
        name: name,
        phone: phone
    })
}

/**
 * Get an employee schedule
 * @param {string} empId 
 * @returns {Array}
 */
async function getEmployeeSchedule(empId) {
    return await persistence.getEmployeeShifts(empId)
}

module.exports = {
    getAllEmployees,
    assignShift,
    createEmployee,
    getEmployeeSchedule
}