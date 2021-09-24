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

staffRouter.use(bodyparser.json())
staffRouter.use(bodyparser.urlencoded({extended:true}))

staffRouter.use(session({secret:uuidv4(),resave:true,saveUninitialized:true,cookie:{maxAge:600000}}))



const credintails = {
    user: "muhriz",
    password: 123
} 
const verifyLogin = (req,res,next)=>{
    if(req.session.userlogged){
        next()
    }else{
        res.redirect('/staff/login')
    }
}
const verifyLibrary = (req,res,next)=>{
    if(req.session.loggedLibrary){
        next()
    }else{
        res.redirect('/login')
    }
}


staffRouter.get('/',verifyLibrary,verifyLogin,(req,res)=>{
            res.render('staff/home',{user:req.session.user,title:"Staff - Librarian",library_name:req.session.library})
})

staffRouter.get('/login',verifyLibrary,(req,res)=>{
    if(req.session.loggedIn){
        res.redirect('/staff')
    }else{
       res.render('staff/login',{title:"Login - staff Librarian",logError:false}) 
    }   
})

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

staffRouter.get('/logout',(req,res)=>{
    req.session.userlogged = false
    res.redirect('/staff/login')
})

var borcodeError=false
staffRouter.get('/catalogue',verifyLibrary,verifyLogin,(req,res)=>{
    console.log(borcodeError)
    res.render('staff/add-book',{title:'Add book - Librarian',error:borcodeError,user:req.session.user,library_name:req.session.library})
    borcodeError = false
})

var added_book
staffRouter.post('/add-book',verifyLibrary,verifyLogin,(req,res)=>{
    req.body._id = new ObjectId()
    catalogueHelpers.addBook(req.session.library_id,req.body).then((recordedBook)=>{
        if(recordedBook.status){
            borcodeError = true
            res.redirect('/staff/catalogue')
        }else{
            
            added_book = req.body
            res.redirect('/staff/added-book')    
        }
        //res.render('staff/view-added-book',{added_book:added_book})
    })
})
staffRouter.get('/added-book',verifyLibrary,verifyLogin,(req,res)=>{
    console.log(added_book)
    res.render('staff/view-added-book',{added_book:added_book,title:'Added book - Librarian',user:req.session.user,library_name:req.session.library})
})

staffRouter.get('/patrons',verifyLibrary,verifyLogin,(req,res)=>{
    res.render('staff/patrons',{title:'Patrons - Librarian',user:req.session.user,library_name:req.session.library})
})

staffRouter.post('/add-patron',verifyLibrary,verifyLogin,(req,res)=>{
    req.body._id = new ObjectId()
    patronHelpers.addPatron(req.body,req.session.library_id).then((newPatron)=>{
        res.redirect('/staff/patrons')
    })
})

staffRouter.get('/circulation',verifyLibrary,verifyLogin,(req,res)=>{
    res.render('staff/circu',{title:'Circulation - Librarian',user:req.session.user,library_name:req.session.library})
})

staffRouter.post('/checkout',verifyLibrary,verifyLogin,(req,res)=>{
    circulationHelpers.checkout(req.session.library_id,req.body).then((result)=>{
        res.send(result)
    })
})

module.exports = staffRouter