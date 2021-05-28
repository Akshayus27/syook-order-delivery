const Item = require('../models/item')
const Joi = require('joi')

const validItem = {
    item: Joi.object({
        name: Joi.string().required(),
        price: Joi.number().required()
    })
}

exports.createItem = async function(req, res) {
    const {error} = validItem.item.validate(req.body)
    if (error) return res.status(400).send(error.message)

    const item = new Item({
        name: req.body.name,
        price: req.body.price
    })
    await item.save((err, data) => {
        if (err) return res.status(500).send(err)
        return res.status(200).send(data)
    })
}

exports.getAllItems = async function(req, res) {
    const items = await Item.find({})
    return res.send(items)
}