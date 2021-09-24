const { resolve, reject } = require('promise')
const db=require('../config/connection')
const bcrypt=require('bcrypt')
const e = require('express')
const objectID = require('mongodb').ObjectId
module.exports={
    createLibrary:(library,callback)=>{
        return new Promise(async(resolve,reject)=>{
           library.password = await bcrypt.hash(library.password,10)
           db.get().collection('library').insertOne(library).then((result)=>{
               resolve(result)
           }) 
        })
    },
    loginLibrary:(libraryData)=>{
        return new Promise(async(resolve,reject)=>{
            var status = false
            var response = {}
            let library =await db.get().collection('library').findOne({email:libraryData.email})
            if(library){
                bcrypt.compare(libraryData.password,library.password).then((result)=>{
                    if(result){
                        console.log('available')
                        resolve({library:library,status:true,library_id:library._id})
                    }else{
                        console.log("incorrect pass")
                        resolve({status:false})
                    }
                })
            }else{
                console.log('invalid user')
                resolve({status:false})
            }
        })
        
    }

}