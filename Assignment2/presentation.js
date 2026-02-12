const prompt = require("prompt-sync")
const business = require("./business")

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