const jwt = require('jsonwebtoken')

// Verifies the token is a customer's token
module.exports = function(req, res, next) {
    const token = req.header('Authorization')
    if (!token) return res.status(400).send('Access Denied')

    try {
        const verified = jwt.verify(token, 'customer')
        req.customer = verified
        next()
    }
    catch (err) {
        return res.status(400).send('Access Denied')
    }
}