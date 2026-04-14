/**
 * Notification Module
 * Simulates outgoing email notifications by printing formatted output to the console.
 * No real emails are dispatched — all output goes to stdout.
 */

const DIVIDER = "-".repeat(48)

/**
 * Prints a formatted email notification to the console.
 *
 * @param {string} recipient - Destination email address
 * @param {string} subject - Email subject line
 * @param {string} body - Main content of the message
 */
function dispatchEmail(recipient, subject, body) {
    console.log("\n" + DIVIDER)
    console.log("TO:      " + recipient)
    console.log("SUBJECT: " + subject)
    console.log("BODY:    " + body)
    console.log(DIVIDER)
}

/**
 * Sends the one-time 2FA verification code to the user.
 *
 * @param {string} emailAddress - The user's registered email
 * @param {string} verificationCode - A 6-digit numeric code
 */
function notify2FACode(emailAddress, verificationCode) {
    dispatchEmail(
        emailAddress,
        "Your Verification Code",
        `Your login verification code is: ${verificationCode}\nThis code will expire in 3 minutes.`
    )
}

/**
 * Alerts the user that suspicious login activity was detected on their account.
 *
 * @param {string} emailAddress - The user's registered email
 */
function notifySuspiciousLogin(emailAddress) {
    dispatchEmail(
        emailAddress,
        "Unusual Login Activity Detected",
        "We noticed several failed login attempts on your account. If this wasn't you, please update your password right away."
    )
}

/**
 * Notifies the user that their account has been locked due to too many failed attempts.
 *
 * @param {string} emailAddress - The user's registered email
 */
function notifyAccountLocked(emailAddress) {
    dispatchEmail(
        emailAddress,
        "Account Locked",
        "Your account has been temporarily locked following repeated failed login attempts. Please reach out to support to restore access."
    )
}

module.exports = {
    dispatchEmail,
    notify2FACode,
    notifySuspiciousLogin,
    notifyAccountLocked
}
