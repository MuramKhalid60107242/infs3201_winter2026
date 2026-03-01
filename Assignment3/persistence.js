const mongodb = require("mongodb")
const fs = require("fs/promises")
const {setServers} = require('node:dns/promises')
setServers(["1.1.1.1","8.8.8.8"])

let client = undefined

/**
 * Connect to MongoDB
 * @returns 
 */

async function connectToDatabase() {
    if (!client) {
        client = new mongodb.MongoClient("mongodb+srv://Muram:12class34@infs3201.vjlzxtx.mongodb.net/")
        await client.connect()
    }
    return client.db("infs3201_winter2026")
}

/**
 * load all the employees
 * @returns {Promise<Array>}
 */
async function loadAllEmployees() {
    const db = await connectToDatabase()
    return db.collection("employees").find({}).toArray()
}

/**
 * find an employee by ID
 * @param {string} id 
 * @returns 
 */
async function getEmployeeById(id) {
    const db = await connectToDatabase()
    return db.collection("employees").findOne({ employeeId: id})
}

/**
 * update an employee details
 * @param {string} id 
 * @param {{name:string, phone:string}} updateInfo 
 */
async function editEmployee(id, updateInfo) {
    const db = await connectToDatabase()

    await db.collection("employees").updateOne(
        { employeeId: id },
        {
            $set: {
                name: updateInfo.name,
                phone: updateInfo.phone
            }
        }
    )
}

/**
 * find an employee shif by an ID
 * @param {string} id 
 * @returns 
 */
async function getShiftById(id) {
    const db = await connectToDatabase()
    return db.collection("shifts").findOne({ shiftId: id})
}

/**
 * get all the shift assigned to an employee
 * @param {string} employeeId 
 * @returns {Promise<Array>}
 */
async function loadEmployeeShifts(employeeId) {
    const db = await connectToDatabase()

    const records = await db
        .collection("assignments")
        .find({ employeeId: employeeId })
        .toArray()

    const relatedShiftIds = []

    for (let index = 0; index < records.length; index++){
        relatedShiftIds[index] = records[index].shiftId
    }

    if (relatedShiftIds.length === 0){
        return []
    }

    return db
        .collection("shifts")
        .find({ shiftId: { $in: relatedShiftIds} })
        .toArray()
}

module.exports = {
    loadAllEmployees,
    getEmployeeById,
    editEmployee,
    getShiftById,
    loadEmployeeShifts
}
