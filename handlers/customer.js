const Customer = require('../models/customer')
const Joi = require('joi')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// To check if the input matches the model
const validCustomerDetail = {
    register: Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().min(3).required(),
        password: Joi.string().min(6).required(),
        city: Joi.string().required()
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required()
    })
}

// Register the customer
exports.customerRegistration = async function(req, res) {
    const {error} = validCustomerDetail.register.validate(req.body)
    if (error) return res.status(400).send(error.message)

    // Hash the password
    const salt = bcrypt.genSaltSync(10)
    const password = bcrypt.hashSync(req.body.password, salt)

    // Create new document for the collection
    const customer = new Customer({
        email: req.body.email,
        name: req.body.name,
        password: password,
        city: req.body.city
    })
    // Create a token specific to the customer
    const token = jwt.sign({email: customer.email}, 'customer')
    try {
        // Save the customer in the database and set the token to the header
        await customer.save()
        return res.header('Authorization', token).status(200).send('Registered successfully')
    } 
    catch (err) {
        // Catches the error thrown by the database for dropping duplicate email-id
        if (err.keyValue.email) return res.status(400).send("Email already exist")
        return res.status(500).send('Internal error')
    }
}

// Login the customer
exports.customerLogin = async function(req, res) {
    const {error} = validCustomerDetail.login.validate(req.body)
    if (error) return res.status(400).send(error.message)

    // Check if the email-id is present in the collection
    const presentCustomer = await Customer.findOne({email: req.body.email})
    if (presentCustomer) {
        // Check the hashed password by dehashing it to the typed password
        const validPassword = bcrypt.compareSync(req.body.password, presentCustomer.password)
        if (!validPassword) return res.status(400).send('Incorrect Password')

        // Creating the token and set it to the header
        const token = jwt.sign({email: presentCustomer.email}, 'customer')
        return res.header('Authorization', token).status(200).send('Logged in succesfully')
    }
    else {
        // If the email-id is not present will return without logging-in
        return res.status(400).send('Email doesn\'t exist')
    }
}

// Return the profile of the customer based on the request of their token
exports.profile = async function(req, res) {
    const customer = await Customer.findOne({email: req.customer.email})
    return res.status(200).send(customer)
}