const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const route = require('./routes/router')

const PORT = process.env.PORT || 8080

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use('/syook', route)

mongoose.connect('mongodb://localhost:27017/Syook', {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify:false} , (err) => {
    if(!err) console.log('Connected to the database...')
    else{
        console.log(err)
    }
})

app.listen(PORT, () => {console.log(`Server up and running on port: ${PORT}`)})