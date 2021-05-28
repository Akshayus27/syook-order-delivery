const mongoose = require('mongoose')

const Order = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        dropDups: true,
        default: '0001'
    },
    itemId: {
        type: String
    },
    customerId: {
        type: String
    },
    deliveryVehicleId: {
        type: String
    },
    price: {
        type: Number
    },
    isDelivered: {
        type: Boolean,
        default: false
    },
    invoiceId: {
        type: String
    }
})

module.exports = mongoose.model('Order', Order)