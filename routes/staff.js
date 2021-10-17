const express = require('express')
const staffRouter = express.Router()
const session = require('express-session')
const {v4:uuidv4}=require('uuid')
const bodyparser = require('body-parser')
const libraryHelpers = require('../helpers/library-helpers')
const catalogueHelpers = require('../helpers/catalogue-helpers')
const patronHelpers = require('../helpers/patron-helpers')
const circulationHelpers = require('../helpers/circulation-helpers')
const { ObjectId } = require('mongodb')
const { PATRON_COLLECTION, CATALOGUE, CIRCULATION_COLLECTION } = require('../config/collection')
const e = require('express')

staffRouter.use(bodyparser.json())
staffRouter.use(bodyparser.urlencoded({extended:true}))

staffRouter.use(session({secret:uuidv4(),resave:true,saveUninitialized:true,cookie:{maxAge:600000}}))


// DEFAULT LOGIN USERNAME AND PASSWORD  OF STAFF
const credintails = {
    user: "muhriz",
    password: 123
}

// VERIFY STAFF
const verifyLogin = (req,res,next)=>{
    if(req.session.userlogged){
        next()
    }else{
        res.redirect('/staff/login')
    }
}

// VERIFY LIBRARY
const verifyLibrary = (req,res,next)=>{
    if(req.session.loggedLibrary){
        next()
    }else{
        res.redirect('/login')
    }
}

// LIBRARY NAME AND USERNAME
function library_n_username(req,res){
    var library_n_usernameVar = {
        user:req.session.user,
        library_name:req.session.library
    }
    return library_n_usernameVar
}

// GET STAFF HOME
staffRouter.get('/',verifyLibrary,verifyLogin,(req,res)=>{
    var libraryAndUserDetails = library_n_username(req,res)
    res.render('staff/home',{user:req.session.user,title:"Staff - Librarian",library_n_username:libraryAndUserDetails,})
})

// GET STAFF LOGIN
staffRouter.get('/login',verifyLibrary,(req,res)=>{
    if(req.session.loggedIn){
        res.redirect('/staff')
    }else{
       res.render('staff/login',{title:"Login - staff Librarian",logError:false}) 
    }   
})

// POST STAFF LOGIN
staffRouter.post('/login',(req,res)=>{
    if(!req.session.loggedIn){
        if(req.body.user == credintails.user & req.body.password == credintails.password){
            req.session.user = req.body.user
            req.session.userlogged = true
            console.log()
            res.redirect('/staff')
        }else{
            req.session.logError = true
            res.render('staff/login',{logError:req.session.logError})
            req.session.logError = false
        }
    }else{
        res.redirect('/staff')
    }
})

// LOGOUT STAFF
staffRouter.get('/logout',(req,res)=>{
    req.session.userlogged = false
    res.redirect('/staff/login')
})

//  GET CATALOGUE PAGE
staffRouter.get('/catalogue',verifyLibrary,verifyLogin,(req,res)=>{
    var libraryAndUserDetails = library_n_username(req,res)
    res.render('staff/add-book',{title:'Add book - Librarian',library_n_username:libraryAndUserDetails,library_n_username:libraryAndUserDetails,})
})

// GET AJAX CHECK DUPLICATE BARCODE
staffRouter.post('/catalogue/check-duplicate-barcode',(req,res)=>{
    req.body.library = req.session.library_id
    catalogueHelpers.checkDuplicateBarcode(req.body).then((result)=>{
        res.send({barcodeError:result.status})
    })
})

var added_book // ADDED BOOK DATA
staffRouter.post('/add-book',verifyLibrary,verifyLogin,(req,res)=>{
    req.body._id = new ObjectId()
    catalogueHelpers.addBook(req.session.library_id,req.body).then((recordedBook)=>{
            res.redirect('/staff/added-book')    
    })
})

// GET ADDED BOOK PAGE
staffRouter.get('/added-book',verifyLibrary,verifyLogin,(req,res)=>{
    var libraryAndUserDetails = library_n_username(req,res)
    res.render('staff/view-added-book',{added_book:added_book,title:'Added book - Librarian',library_n_username:libraryAndUserDetails,library_n_username:libraryAndUserDetails,})
})

// GET ADD PATRON PAGE
staffRouter.get('/patrons',verifyLibrary,verifyLogin,(req,res)=>{
    var libraryAndUserDetails = library_n_username(req,res)
    res.render('staff/patrons',{title:'Patrons - Librarian',library_n_username:libraryAndUserDetails,library_n_username:libraryAndUserDetails,})
})

// POST ADD PATRON
staffRouter.post('/add-patron',verifyLibrary,verifyLogin,(req,res)=>{
    req.body._id = new ObjectId()
    patronHelpers.addPatron(req.body,req.session.library_id).then((newPatron)=>{
        if(newPatron.status){
            res.send("This is username is available")
        }else{
             res.redirect('/staff/patrons')
        }
       
    })
})

// GET AJAX CHECK CARD NUMBER DUPLICATE
staffRouter.post('/patrons/check-duplicate-patron',(req,res)=>{
    req.body.library = req.session.library_id
    patronHelpers.checkDuplicateCardNumber(req.body).then((data)=>{
        res.send({isCardNumberDuplicate:data.status})
    })
})
// GET CIRCULATION PAGE
staffRouter.get('/circulation',verifyLibrary,verifyLogin,(req,res)=>{
    var libraryAndUserDetails = library_n_username(req,res)
    res.render('staff/circu',{title:'Circulation - Librarian',library_n_username:libraryAndUserDetails,})
})

// POST CHECKOUT BOOK
var cardNumber; // FOR VIEW PATRON AFTER CIRCULATION AND OTHER TIME
staffRouter.post('/checkout',verifyLibrary,verifyLogin,(req,res)=>{
    circulationHelpers.checkout(req.session.library_id,req.body).then((result)=>{
        cardNumber = req.body.card_number
        res.redirect('/staff/patrons/'+cardNumber)
    })
})


// GET REPORTS
staffRouter.get('/reports',verifyLibrary,verifyLogin,(req,res)=>{
    var libraryAndUserDetails = library_n_username(req,res)
    res.render('staff/reports',{title:'Reports - Librarian',library_n_username:libraryAndUserDetails,})
})

// GET REPORTS CATAGORY
staffRouter.get('/reports/:catagory',verifyLibrary,verifyLogin,(req,res)=>{
    var libraryAndUserDetails = library_n_username(req,res)
    catalogueHelpers.catalogueReports(req.session.library_id,req.params.catagory).then((result)=>{
        if(req.params.catagory == PATRON_COLLECTION){
            res.render('staff/view-reports',{reportData:result,patronCatagory:true,title:'Catalogue Reports - Librarian',library_n_username:libraryAndUserDetails,})
        }else if(req.params.catagory == CATALOGUE){
            res.render('staff/view-reports',{reportData:result,catalogueCatagory:true,title:'Catalogue Reports - Librarian',library_n_username:libraryAndUserDetails,})
        }else if(req.params.catagory == CIRCULATION_COLLECTION){
            res.render('staff/view-reports',{reportData:result,circulationCatagory:true,title:'Catalogue Reports - Librarian',library_n_username:libraryAndUserDetails,})
        }
        
    })
})

/*staffRouter.get('/patrons/'+cardNumber,verifyLibrary,verifyLogin,(req,res)=>{
    patronHelpers.viewPatron(req.params.cardNumber,req.session.library_id).then((result)=>{
        var libraryAndUserDetails = library_n_username(req,res)
        res.render('staff/view-patron',{patronDetail:result.patronDetails,checkoutItems:result.checkoutItems,library_n_username:libraryAndUserDetails})
    })
})*/

staffRouter.get('/patrons/:cardNumber',verifyLibrary,verifyLogin,(req,res)=>{
    patronHelpers.viewPatron(req.params.cardNumber,req.session.library_id).then((result)=>{
        var libraryAndUserDetails = library_n_username(req,res)
        res.render('staff/view-patron',{patronDetail:result.patronDetails,checkoutItems:result.checkoutItems,library_n_username:libraryAndUserDetails})
    })
})


module.exports = staffRouter