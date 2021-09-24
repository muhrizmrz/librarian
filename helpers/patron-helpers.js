const db = require('../config/connection')
const collection = require('../config/collection')
const { resolve, reject } = require('promise')
const { ObjectId } = require('mongodb')

module.exports={
    addPatron:(newPatron,library_id)=>{
        return new Promise(async(resolve,reject)=>{
            newPatron.cardNumber = parseInt(newPatron.cardNumber,10)
            const patronData =await db.get().collection(collection.PATRON_COLLECTION).findOne({library:library_id})
            if(patronData){
                console.log(newPatron)
                db.get().collection(collection.PATRON_COLLECTION).
                updateOne({library:library_id},{
                    $push:{patrons: newPatron}
                }).then((patron)=>{
                    resolve(patron)
                })
            }else{
                let patron = {
                    library:library_id,
                    patrons:[newPatron]
                }
                db.get().collection(collection.PATRON_COLLECTION).insertOne(patron).then((patron)=>{
                    resolve(patron)
                })
            }
        })
    }
}