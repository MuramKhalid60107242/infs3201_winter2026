const prompt = require('prompt-sync')
const business = require('./business')
const persistence = require('./persistence')

async function displayEmployess() {
    let employees = await persistence.getEmployees()
    console.log('Emplyee ID  Name                  Phone')
    console.log('----------- --------------------- -----------')
    for (let e of employees) {
        console.log(`${e.employeeId.padEnd(13)}${e.name.padEnd(20)}${e.phone}`)
    }
}

async function addNewEmployee() {
    let name = prompt('Enter employee name: ')
    let phone = prompt('Enter phone number: ')
    await business.createEmployee(name, phone)
    console.log('A new employee was add... ')
}

async function scheduleEmployee() {
    let empId = prompt('Enter emplyee ID: ')
    let shiftId = prompt('Enter shift ID: ')
    let result = await business.assignShift(empId, shiftId)
    console.log(result === 'OK' ? 'Shift Recorded' : result)
    
}

async function viewEmployeeSchedule() {
    let empId = prompt('Enter employee ID: ')
    let shifts = await business.getEmployeeSchedule(empId)
    console.log('\n')
    console.log('date,start,end')
    for (let shift of shifts) {
        console.log(`${shift.date},${shift.startTime},${shift.endTime}`)
    }
}

/**
 * Main function to run the applicaion 
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
            await displayEmployess()
        } 
        else if (selection == 2){
            await addNewEmployee()
        }
        else if (selection == 3){
            await scheduleEmployee()
        }
        else if (selection == 4){
            await viewEmployeeSchedule()
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