const Vehicle = require('../models/vehicle')
const Customer = require('../models/customer')
const Order = require('../models/order')
const jwt = require('jsonwebtoken')
const Joi = require('joi')

// To check if the input matches the model
const validVehicle = {
    register: Joi.object({
        registrationNumber: Joi.string().pattern(new RegExp(/^[A-Z]{2}-[0-9]{2}-[A-Z]{2}-[0-9]{4}$/)).required(),
        vehicleType: Joi.string().valid('bike').valid('truck').required(),
        city: Joi.string().required(),
        name: Joi.string().min(3).required()
    }),
    login : Joi.object({
        registrationNumber: Joi.string().pattern(new RegExp(/^[A-Z]{2}-[0-9]{2}-[A-Z]{2}-[0-9]{4}$/)).required()
    })
}

// Register a new vehicle
exports.vehicleRegistration = async function(req, res) {
    if (req.body.registrationNumber) {
        // Change the registration number to uppercase to check for the regex pattern
        req.body.registrationNumber = req.body.registrationNumber.toUpperCase()
    }
    const {error} = validVehicle.register.validate(req.body)
    if (error) return res.status(400).send(error.message)

    // Create a new document for the collection
    const vehicle = new Vehicle({
        registrationNumber: req.body.registrationNumber,
        vehicleType: req.body.vehicleType,
        city: req.body.city,
        name: req.body.name.toUpperCase()
    })
    // Create a token specific to the vehicle
    const token = jwt.sign({registrationNumber: vehicle.registrationNumber}, 'vehicle')
    try {
        // Save the customer in the database and set the token to the header
        await vehicle.save()

        // Get all orders for where the delivery vehicle-id is not assigned yet
        let orders = await Order.find({ isDelivered: false, deliveryVehicleId: '' })
        if (orders.length === 0) {
            return res.header('Authorization', token).status(200).send('Registered successfully')
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
        return res.header('Authorization', token).status(200).send('Registered successfully')
    }
    catch (err) {
        // Catches the error thrown by the database for dropping duplicate registration number
        if (err.keyValue.registrationNumber) return res.status(400).send("Vehicle number already exist")
        return res.status(500).send('Internal error')
    }
}

// Login the vehicle
exports.vehicleLogin = async function(req, res) {
    if (req.body.registrationNumber) {
        // Change the registration number to uppercase to check for the regex pattern
        req.body.registrationNumber = req.body.registrationNumber.toUpperCase()
    }
    const {error} = validVehicle.login.validate(req.body)
    if (error) return res.status(400).send(error.message)

    // Check if the registration number is present in the collection
    const vehicle = await Vehicle.findOne({registrationNumber: req.body.registrationNumber})
    if (!vehicle) return res.status(400).send('Vehicle number doesn\'t exist')
    
    // Creating the token and setting it to the header
    const token = jwt.sign({registrationNumber: vehicle.registrationNumber}, 'vehicle')
    return res.header('Authorization', token).status(200).send('Logged in successfully')
}

// Return the profile of the vehicle based on the request of their token
// verified by the middleware function
exports.profile = async function(req, res) {
    const vehicle = await Vehicle.findOne({registrationNumber: req.vehicle.registrationNumber})
    return res.status(200).send(vehicle)
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