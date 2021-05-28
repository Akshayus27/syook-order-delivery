const Vehicle = require('../models/vehicle')
const jwt = require('jsonwebtoken')
const Joi = require('joi')

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

exports.vehicleRegistration = async function(req, res) {
    if (req.body.registrationNumber) {
        req.body.registrationNumber = req.body.registrationNumber.toUpperCase()
    }
    const {error} = validVehicle.register.validate(req.body)
    if (error) return res.status(400).send(error.message)

    const vehicle = new Vehicle({
        registrationNumber: req.body.registrationNumber,
        vehicleType: req.body.vehicleType,
        city: req.body.city,
        name: req.body.name.toUpperCase()
    })
    const token = jwt.sign({registrationNumber: vehicle.registrationNumber}, 'vehicle')
    try {
        await vehicle.save()
        return res.header('Authorization', token).status(200).send('Registered successfully')
    }
    catch (err) {
        if (err.keyValue.registrationNumber) return res.status(400).send("Vehicle number already exist")
        return res.status(500).send('Internal error')
    }
}

exports.vehicleLogin = async function(req, res) {
    if (req.body.registrationNumber) {
        req.body.registrationNumber = req.body.registrationNumber.toUpperCase()
    }
    const {error} = validVehicle.login.validate(req.body)
    if (error) return res.status(400).send(error.message)

    const vehicle = await Vehicle.findOne({registrationNumber: req.body.registrationNumber})
    if (!vehicle) return res.status(400).send('Vehicle number doesn\'t exist')
    
    const token = jwt.sign({registrationNumber: vehicle.registrationNumber}, 'vehicle')

    return res.header('Authorization', token).status(200).send('Logged in successfully')
}

exports.profile = async function(req, res) {
    const vehicle = await Vehicle.findOne({registrationNumber: req.vehicle.registrationNumber})
    return res.status(200).send(vehicle)
}