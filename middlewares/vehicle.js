const jwt = require('jsonwebtoken')

module.exports = function(req, res, next) {
    const token = req.header('Authorization')
    if (!token) return res.status(400).send('Access Denied')

    try {
        const verified = jwt.verify(token, 'vehicle')
        req.vehicle = verified
        next()
    }
    catch (err) {
        return res.status(400).send('Access Denied')
    }
}