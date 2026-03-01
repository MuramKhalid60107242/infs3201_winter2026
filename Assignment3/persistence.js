const mongodb = require("mongodb")
const fs = require("fs/promises")

let client = undefined

/**
 * 
 * @returns 
 */

async function connectToDatabase() {
    if (!client) {
        client = new mongodb.MongoClient("")
        await client.connect()
    }
    return client.db("")
}

/**
 * 
 */

async function loadAllEmployees() {
    const db = await connectToDatabase()
    return db.collection("employees").find({}).toArray()
}

/**
 * 
 * @param {*} id 
 * @returns 
 */
async function getEmployeeById(id) {
    const db = await connectToDatabase()
    return db.collection("employees").findOne({ employeeId: id})
}

/**
 * 
 * @param {*} id 
 * @param {*} updateInfo 
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
 * 
 * @param {*} id 
 * @returns 
 */
async function getShiftById(id) {
    const db = await connectToDatabase()
    return db.collection("shifts").findOne({ shiftId: id})
}

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
