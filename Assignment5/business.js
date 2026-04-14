const db = require("./persistence")

// Fetch every employee record from the database
async function listAllEmployees() {
    return await db.getAllEmployees()
}

// Look up one employee using their unique ID
async function getEmployeeById(id) {
    return await db.findEmployee(id)
}

// Apply changes to an employee's profile
async function saveEmployeeChanges(id, updatedFields) {
    await db.updateEmployee(id, updatedFields)
}

// Retrieve all shifts that belong to a given employee
async function fetchShiftsForEmployee(id) {
    return await db.getEmployeeShifts(id)
}

// Look up a user account by username
async function lookupUser(username) {
    return await db.findUser(username)
}

/**
 * Validates an uploaded file against allowed type, extension, and size limits.
 *
 * @param {string} mimeType - MIME type of the file
 * @param {string} originalFilename - The file's original name
 * @param {number} sizeInBytes - Size of the file in bytes
 * @returns {{ isValid: boolean, error?: string }}
 */
function verifyUploadedFile(mimeType, originalFilename, sizeInBytes) {
    const SIZE_LIMIT_BYTES = 2 * 1024 * 1024 // 2 MB cap

    if (mimeType !== "application/pdf") {
        return { isValid: false, error: "Only PDF files are accepted" }
    }

    const nameLower = originalFilename.toLowerCase()
    if (!nameLower.endsWith(".pdf")) {
        return { isValid: false, error: "File extension must be .pdf" }
    }

    if (sizeInBytes > SIZE_LIMIT_BYTES) {
        return { isValid: false, error: "File exceeds the 2MB size limit" }
    }

    return { isValid: true }
}

/**
 * Checks whether an employee has room for another document upload.
 * Each employee may have at most 5 documents stored.
 *
 * @param {string} empId - The employee's database ID
 * @returns {Promise<{ allowed: boolean, used: number, limit: number }>}
 */
async function canEmployeeReceiveUpload(empId) {
    const DOCUMENT_LIMIT = 5
    const existingFiles = await db.getEmployeeFiles(empId)
    return {
        allowed: existingFiles.length < DOCUMENT_LIMIT,
        used: existingFiles.length,
        limit: DOCUMENT_LIMIT
    }
}

/**
 * Saves a new file's metadata to the database after a successful upload.
 *
 * @param {{ employeeId, username, filename, storagePath, fileSize, mimeType }} params
 * @returns {Promise<Object>} The inserted document metadata including its _id
 */
async function recordFileUpload(params) {
    return await db.storeFileMetadata({
        employeeId: params.employeeId,
        username: params.username,
        originalName: params.filename,
        storagePath: params.storagePath,
        size: params.fileSize,
        mimeType: params.mimeType
    })
}

module.exports = {
    listAllEmployees,
    getEmployeeById,
    saveEmployeeChanges,
    fetchShiftsForEmployee,
    lookupUser,
    verifyUploadedFile,
    canEmployeeReceiveUpload,
    recordFileUpload
}
