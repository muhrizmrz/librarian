const express = require('express')
const path = require('path')
const session = require('express-session')
const {v4:uuidv4} = require('uuid')
const hbs = require('hbs')
const bodyparser = require('body-parser')
const staff = require('./routes/staff')
const admin = require('./routes/admin')
const db=require('./config/connection')




const app = express()

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}))

const partialFolder = path.join(__dirname,'views/partials')
app.set('views',path.join(__dirname,'views'))
app.set('view engine','hbs')
hbs.registerPartials(partialFolder)
app.use('/static',express.static(path.join(__dirname,'public')))
app.use('/assets',express.static(path.join(__dirname,'public/images')))
app.use(session({secret:uuidv4(),resave:true,saveUninitialized:true}))
db.connect((err)=>{
    if(err) console.log("connnection error"+err)
    else console.log("Database")
})
app.use('/',admin)
app.use('/staff',staff)



app.listen(3000,()=>{
    console.log("localhost connected")
})