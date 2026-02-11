// import required modules 
const fs = require('fs/promises')
const prompt = require('prompt-sync')()

/**
 * This function will read the employees.json file and return an array of JSON objects 
 * @returns {Array} - An array of JSON objects representing employees.
 */

async function employeesData() {
    let data = await fs.readFile('employees.json');
    return JSON.parse(data)
}

/**
 * This function will read the shifts.json file and return an array of JSON objects 
 * @returns {Array} - An array of JSON objects representing shifts.
 */

async function shiftsData() {
    let data = await fs.readFile('shifts.json')
    return JSON.parse(data)
}

/**
 * This function will read the assignments.json and return an array of JSON objects.
 * @returns {Array} - An array of JSON objects representing assignments.
 */
async function assignmentsData() {
    let data = await fs.readFile('assignments.json')
    return JSON.parse(data)
}

/**
 * This function will save employees data
 */

async function saveEmployees() {
    await fs.writeFile('employees.json', JSON.stringify(data))
}

/**
 * This function will save assignments data
 */
async function saveAssignments() {
    await fs.writeFile('assignments.json', JSON.stringify(data))
}


/**
 * This function will display all employees details 
 * 
 */

async function listEmployees(){
    let employees = await employeesData()

    let employeeId = parseInt(prompt('Enter employee ID: '))


    if(!employee){
        console.log('Employee not found.')
        return;
    }

    console.log(`Employee ID: ${employee.id}`)
    console.log(`Name: ${employee.name}`)
    console.log(`Phone: ${employee.phone}`)


}

/**
 * This function will add a new employee 
 */

async function addEmployee() {
    let employees = await employeesData()

    let name = prompt('Enter employee name: ');
    let phone = prompt('Enter employee phone number: ');

    let maxId = 0;
    for (let i = 0; i < employees.length; i++){
        let idNumber = parseInt(employees[i].employeeId.substring(1))
        if (idNumber > maxId){
            maxId = idNumber
        }
    }

    let newId = 'E' + String(maxId + 1).padStart(3, '0')

    employees.push({
        employeeId: newId,
        name: name,
        phone: phone 
    })

    await saveEmplotees(employees)
    console.log('Employee added...')
}

/**
 * This function will assigns an employee to a shift 
 * @returns 
 */

async function assignEmployeeToShift() {
    let employees = await employeesData()
    let shifts = await shiftsData()
    let assignments = await assignmentsData()


    let employeeId = prompt('Enter employee ID: ')
    let shiftId = prompt('Enter shift ID: ')

    let employeeExists = false
    for (let i = 0; i < employees.length; i++){
        if (employees[i].employeeId === employeeId){
            employeeExists = true
            break
        }
    }

    if (!employeeExists) {
        console.log('Employee does not exist')
        return 
    }

    let shiftExists = false
    for (let i = 0; i < shifts.length; i++) {
        if (shifts[i].shiftId === shiftId) {
            shiftExists = true
            break
        }
    }

    if (!shiftExists) {
        console.log('Shift does not exist')
        return
    }

    for (let i = 0; i < assignments.length; i++) {
        if (
            assignments[i].employeeId === employeeId &&
            assignments[i] === shiftId
        ) {
            console.log('Employee already assigned to shift')
            return
        }
    }

    await saveAssignments(assignments)
    console.log('Shift Recorded')
    
}

/**
 * This function will show the employee schedule 
 */

async function viewEmployeeSchedule() {
    let employeeId = prompt('Enter employee ID: ')

    let employees = await employeesData()
    let shifts = await shiftsData()
    let assignments = await assignmentsData()

    let employeeExists = false
    for (let i = 0; i < employees.length; i++) {
        if (employees[i].employeeId === employeeId) {
            employeeExists = true
        }
    }

    console.log('')
    console.log('date,startTime,endTime')

    if (!employeeExists) {
        return
    }

    for (let i = 0; i < assignments.length; i++) {
        if (assignments[i].employeeId === employeeId) {
            for ( let j = 0; j < shifts.length; j++) {
                if (shifts[j].shiftId === assignments[i].shiftId) {
                    console.log(
                        shifts[j].data + ',' +
                        shifts[j].startTime + ',' +
                        shifts[j].endTime
                    )
                }
            }
        }
    }
}


/**
 * This function will displays menu and handles user input
 */
async function displayMenu() {
    while (true){
        console.log('1. Show all employees')
        console.log('2. Add new employee')
        console.log('3. Assign employee to shift')
        console.log('4. View employee schedule')
        console.log('5. Exit')
        let selection = Number(prompt("What is your choice> "))

        if (selection == 1){
            await listEmployees()
        } 
        else if (selection == 2){
            await addEmployee()
        }
        else if (selection == 3){
            await assignEmployeeToShift()
        }
        else if (selection == 4){
            await viewEmployeeSchedule
        }
        else if (selection == 5){
            break // leave the loop
            console.log('')
        }
        else{
            console.log('Invalid choice, choose number btween 1 and 5')
        }
    }
}

displayMenu()


