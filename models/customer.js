const mongoose = require('mongoose')

const Customer = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        dropDups: true
    },
    password: {
        type: String,
        required: true,
        min: 6
    },
    name: {
        type: String,
        required: true,
        min: 3
    },
    city: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Customer', Customer)