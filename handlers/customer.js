const Customer = require('../models/customer')
const Joi = require('joi')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

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

exports.customerRegistration = async function(req, res) {
    const {error} = validCustomerDetail.register.validate(req.body)
    if (error) return res.status(400).send(error.message)

    const salt = bcrypt.genSaltSync(10)
    const password = bcrypt.hashSync(req.body.password, salt)

    const customer = new Customer({
        email: req.body.email,
        name: req.body.name,
        password: password,
        city: req.body.city
    })
    const token = jwt.sign({email: customer.email}, 'customer')
    try {
        await customer.save()
        return res.header('Authorization', token).status(200).send('Registered successfully')
    } 
    catch (err) {
        if (err.keyValue.email) return res.status(400).send("Email already exist")
        return res.status(500).send('Internal error')
    }
}

exports.customerLogin = async function(req, res) {
    const {error} = validCustomerDetail.login.validate(req.body)
    if (error) return res.status(400).send(error.message)

    const presentCustomer = await Customer.findOne({email: req.body.email})
    if (presentCustomer) {
        const validPassword = bcrypt.compareSync(req.body.password, presentCustomer.password)
        if (!validPassword) return res.status(400).send('Incorrect Password')

        const token = jwt.sign({email: presentCustomer.email}, 'customer')
        return res.header('Authorization', token).status(200).send('Logged in succesfully')
    }
    else {
        return res.status(400).send('Email doesn\'t exist')
    }
}