const Customer = require('../models/customer')
const Item = require('../models/item')
const Order = require('../models/order')
const Invoice = require('../models/invoice')
const Vehicle = require('../models/vehicle')

exports.orderItem = async function (req, res) {
    let orders = await Order.find({})
    const orderNumber = await getOrderNumber(orders)

    const customer = await Customer.findOne({ email: req.customer.email })
    const deliveryVehicleId = await getDeliveryVehicleId(customer)
    const item = await Item.findOne({ _id: req.params.id })

    const invoice = new Invoice({
        customerName: customer.name,
        itemName: item.name,
        price: item.price
    })
    const order = new Order({
        orderNumber: orderNumber,
        itemId: req.params.id,
        price: item.price,
        customerId: customer._id,
        deliveryVehicleId: deliveryVehicleId,
        invoiceId: invoice._id
    })
    try {
        await order.save()
        await invoice.save()
        return res.status(200).send('Order is placed')
    }
    catch (err) {
        return res.status(500).send(err)
    }
}

exports.deliveredOrder = async function (req, res) {
    const vehicle = await Vehicle.findOne({ regitrationNumber: req.vehicle.regitrationNumber })
    const order = await Order.findOne({ _id: req.params.id, deliveryVehicleId: vehicle._id, isDelivered: false })
    if (order) {
        try {
            await Order.findOneAndUpdate({ _id: order._id }, { isDelivered: true })
            await Vehicle.findOneAndUpdate({ _id: vehicle._id }, { $inc: { activeOrders: -1 } })
            let orders = await Order.find({ isDelivered: false, deliveryVehicleId: '' })
            if (orders.length === 0) {
                return res.status(200).send('Order delivered')
            }
            orders = orders.sort((a, b) => parseInt(a.orderNumber) - parseInt(b.orderNumber))
            for (let ord of orders) {
                if (ord.deliveryVehicleId === '') {
                    let deliveryVehicleId = await getDeliveryVehicleId(await Customer.findOne({ _id: ord.customerId }))
                    if (deliveryVehicleId) {
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
    return res.status(200).send('No such order')
}

// Function to get order's number
const getOrderNumber = (orders) => {
    let orderNumber = ''
    if (orders.length >= 1) {
        orders = orders.sort((a, b) => parseInt(b.orderNumber) - parseInt(a.orderNumber))
        const idNumber = parseInt(orders[0].orderNumber) + 1
        orderNumber = String(idNumber)
        for (let i = orderNumber.length; i < 4; i++) {
            orderNumber = '0' + orderNumber
        }
    }
    else {
        orderNumber = '0001'
    }
    return orderNumber
}

// Function to get delivery vehicle for order
const getDeliveryVehicleId = async (customer) => {
    let vehicles = await Vehicle.find({ city: customer.city })
    if (vehicles.length >= 1) {
        vehicles = vehicles.filter(vehicle => vehicle.activeOrders < 2)
        if (vehicles.length === 0) return ''

        let idx = Math.floor(Math.random() * (vehicles.length - 1))
        await Vehicle.findOneAndUpdate({ _id: vehicles[idx]._id }, { $inc: { activeOrders: 1 } })
        return vehicles[idx]._id
    }
    else {
        return ''
    }
}