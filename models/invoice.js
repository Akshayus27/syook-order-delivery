const mongoose = require('mongoose')

const Invoice = new mongoose.Schema({
    customerName: {
        type: String
    },
    itemName: {
        type: String
    },
    price: {
        type: Number
    }
})

module.exports = mongoose.model('Invoice', Invoice)