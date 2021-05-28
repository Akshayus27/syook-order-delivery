const mongoose = require('mongoose')

const Vehicle = new mongoose.Schema({
    registrationNumber: {
        type: String,
        required: true,
        unique: true,
        dropDups: true
    },
    vehicleType: {
        type: String,
        enum: ['bike', 'truck'],
        default: 'bike'
    },
    name: {
        type: String,
        required: true,
        min: 3
    },
    city: {
        type: String,
        required: true
    },
    activeOrders: {
        type: Number,
        default: 0,
        max: 2
    }
})

module.exports = mongoose.model('Vehicle', Vehicle)