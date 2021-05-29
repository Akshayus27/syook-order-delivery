const router = require('express').Router()
const item = require('../handlers/item')
const customer = require('../handlers/customer')
const vehicle = require('../handlers/vehicle')
const order = require('../handlers/order')
const verifyCustomer = require('../middlewares/customer')
const verifyVehicle = require('../middlewares/vehicle')

// Item
router.post('/item/new', item.createItem)
router.get('/item/all', verifyCustomer, item.getAllItems)

// Customer
router.post('/customer/register', customer.customerRegistration)
router.post('/customer/login', customer.customerLogin)
router.get('/customer/profile', verifyCustomer, customer.profile)

// Vehicle
router.post('/vehicle/register', vehicle.vehicleRegistration)
router.post('/vehicle/login', vehicle.vehicleLogin)
router.get('/vehicle/profile', verifyVehicle, vehicle.profile)

// Order
router.post('/order/:id', verifyCustomer, order.orderItem)
router.put('/order/delivered/:id', verifyVehicle, order.deliveredOrder)

module.exports = router