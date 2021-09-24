const express = require('express')
const admin = express.Router()
const libraryHelper = require('../helpers/library-helpers')
const objectId = require('mongodb').ObjectId
const verifyLibrary = (req,res,next)=>{
    if(req.session.loggedLibrary){
        next()
    }else{
        res.redirect('/login')
    }
}
admin.get('/',(req,res)=>{
    res.render('home/home',{library_name:req.session.library,loggedLibrary:req.session.loggedLibrary})
})

admin.get('/create-library',(req,res)=>{
    if(req.session.loggedLibrary){
        res.redirect('/')
    }else{
        res.render('home/createLibrary')
    }  
})

admin.post('/create-library',(req,res)=>{
    libraryHelper.createLibrary(req.body).then((result)=>{
        console.log(result.insertedId)
        req.session.library_id = objectId(result.insertedId)
        //req.session.library._id = objectId(result.insertedId)
        req.session.loggedLibrary = true
        res.redirect('/')
    })
})

admin.get('/logout',(req,res)=>{
    req.session.loggedLibrary = false
    req.session.destroy()
    res.redirect('/')
})

admin.get('/login',(req,res)=>{
    if(req.session.loggedLibrary){
        res.redirect('/')
    }else{
        res.render('home/login')
    }
})

admin.post('/login',(req,res)=>{
    libraryHelper.loginLibrary(req.body).then((response)=>{
        if(response.status){
            req.session.library = response.library.library_name
            req.session.library_id = response.library._id.toString()
            req.session.loggedLibrary = true
            res.redirect('/')
            console.log(req.session.library_id)
        }else{
            res.redirect('/login')
        }
    })
})

module.exports = admin