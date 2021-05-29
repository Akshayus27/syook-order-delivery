const Customer = require('../models/customer')
const Item = require('../models/item')
const Order = require('../models/order')
const Invoice = require('../models/invoice')
const Vehicle = require('../models/vehicle')

// Placing an order for the item
exports.orderItem = async function (req, res) {
    // Get all the orders and get the order-number to assign to the new order
    let orders = await Order.find({})
    const orderNumber = await getOrderNumber(orders)

    // Get the delivery vehicle-id for assigning it to the order
    const customer = await Customer.findOne({ email: req.customer.email })
    const deliveryVehicleId = await getDeliveryVehicleId(customer)

    // Getting the item-id to assign it to the order
    const item = await Item.findOne({ _id: req.params.id })

    // Creating a new document for the invoice collection
    const invoice = new Invoice({
        customerName: customer.name,
        itemName: item.name,
        price: item.price
    })

    // Creating a new document for the collection and assign the invoice-id to the order
    const order = new Order({
        orderNumber: orderNumber,
        itemId: req.params.id,
        price: item.price,
        customerId: customer._id,
        deliveryVehicleId: deliveryVehicleId,
        invoiceId: invoice._id
    })
    try {
        // Save the order and invoice to their respective collections
        await order.save()
        await invoice.save()
        return res.status(200).send('Order is placed')
    }
    catch (err) {
        return res.status(500).send(err)
    }
}

// Marking the order delivered
exports.deliveredOrder = async function (req, res) {
    // Getting the vehicle registration number from the token and see 
    // if the document's id matches the request sent from the token
    const vehicle = await Vehicle.findOne({ registrationNumber: req.vehicle.registrationNumber })
    if (!vehicle) return res.status(200).send('No such order')
     
    const order = await Order.findOne({ _id: req.params.id, deliveryVehicleId: vehicle._id, isDelivered: false })
    if (order) {
        // Updating the delivery status in the order from false to true
        await Order.findOneAndUpdate({ _id: order._id }, { isDelivered: true })

        // Reduce the active orders for the vehicle by 1
        await activeOrdersUpdate(vehicle)
        try {
            // Get all orders for where the delivery vehicle-id is not assigned yet
            let orders = await Order.find({ isDelivered: false, deliveryVehicleId: '' })
            if (orders.length === 0) {
                return res.status(200).send('Order delivered')
            }
            // Sort the orders in ascending based on the order number
            // Assign the vehicle to first order that has been put on hold
            orders = orders.sort((a, b) => parseInt(a.orderNumber) - parseInt(b.orderNumber))
            for (let ord of orders) {
                if (ord.deliveryVehicleId === '') {
                    // Gets the delivery vehicle-id for the order
                    let deliveryVehicleId = await getDeliveryVehicleId(await Customer.findOne({ _id: ord.customerId }))
                    if (deliveryVehicleId) {
                        // Updates the vehicle-id of the order without one
                        await Order.findOneAndUpdate({ _id: ord._id }, { deliveryVehicleId: deliveryVehicleId })
                    }
                }
            }
            return res.status(200).send('Order delivered')
        }
        catch (err) {
            return res.status(500).send('Internal error')
        }
    }
    // Return if the order is already been delivered
    return res.status(200).send('No such order')
}

// Function to get order-number
const getOrderNumber = (orders) => {
    let orderNumber = ''
    if (orders.length >= 1) {
        // Sort the orders in descending based on the order numbers
        orders = orders.sort((a, b) => parseInt(b.orderNumber) - parseInt(a.orderNumber))

        // Increment the first order-number in the sorted list and convert it to a string 
        const idNumber = parseInt(orders[0].orderNumber) + 1
        orderNumber = String(idNumber)
        
        // Prefix zeros to ensure it to be a string of length four
        for (let i = orderNumber.length; i < 4; i++) {
            orderNumber = '0' + orderNumber
        }
    }
    else {
        // Return the number as 0001 if there are zero orders in the collection
        orderNumber = '0001'
    }
    return orderNumber
}

// Function to get delivery vehicle for order
const getDeliveryVehicleId = async (customer) => {
    // Get all the vehicles matching the customer city
    let vehicles = await Vehicle.find({ city: customer.city })

    if (vehicles.length >= 1) {
        // Filter out all the vehicles that has orders above 2
        vehicles = vehicles.filter(vehicle => vehicle.activeOrders < 2)
        if (vehicles.length === 0) return ''

        // Choose a random vehicle from the list and send the vehicle-id
        let idx = Math.floor(Math.random() * (vehicles.length - 1))

        // Increase the active orders of the vehicle by 1
        await Vehicle.findOneAndUpdate({ _id: vehicles[idx]._id }, { $inc: { activeOrders: 1 } })
        return vehicles[idx]._id
    }
    else {
        return ''
    }
}

// Change vehicle's active orders
const activeOrdersUpdate = async (vehicle) => {
    await Vehicle.findOneAndUpdate({registrationNumber: vehicle.registrationNumber},{ $inc: {activeOrders: -1 }})
}