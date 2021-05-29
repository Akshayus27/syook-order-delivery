const Vehicle = require('../models/vehicle')
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