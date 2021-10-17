const db = require('../config/connection')
const collection = require('../config/collection')
const { resolve, reject } = require('promise')
const { ObjectId } = require('mongodb')

module.exports={
    addPatron:(newPatron,library_id)=>{
        return new Promise(async(resolve,reject)=>{
            
            //CHECKING DUPLICATE PATRON
            let isPatronAvailable = await db.get().collection(collection.PATRON_COLLECTION).findOne({
                $and:[
                    {library:ObjectId(library_id)},
                    {cardNumber:parseInt(newPatron.cardNumber)}
                ]
            })

            //IF DUPLICATE PATRON
            if(isPatronAvailable){
                resolve({status:true})
            } else { // IF NOT 
                // adding some data
                newPatron.cardNumber = parseInt(newPatron.cardNumber,10)
                newPatron.library = ObjectId(library_id)
                var date = new Date()
                newPatron.date = date.toLocaleDateString()
                //DATABASE ADDING
                db.get().collection(collection.PATRON_COLLECTION).insertOne(newPatron).then((data)=>{
                    resolve(data)
                })
            } 
        })
    },
    checkDuplicateCardNumber:(details)=>{
        return new Promise(async(resolve,reject)=>{
            let checkDuplicateCardNumber = await db.get().collection(collection.PATRON_COLLECTION).findOne({
                $and:[
                    {library:ObjectId(details.library)},
                    {cardNumber:parseInt(details.cardNumber,10)}
                ]
            })
            if(checkDuplicateCardNumber){
                resolve({status:true})
            }else{
                resolve({status:false})
            }
        })
    },
    viewPatron:(cardNumber,library_id)=>{
        return new Promise(async(resolve,reject)=>{
            let searchPatron = await db.get().collection(collection.PATRON_COLLECTION).findOne({
                $and: [
                    {library:ObjectId(library_id)},
                    {cardNumber: parseInt(cardNumber,10)}
                ]
            })
            if(searchPatron){
                let searchPatronCirculationDetails = await db.get().collection(collection.CIRCULATION_COLLECTION).aggregate([
                    {
                        $match: {patronId:searchPatron._id}
                    },
                    {
                        $unwind:  '$checkoutItem'
                    },
                    {
                        $lookup:{
                            from:'catalogue',
                            localField: 'checkoutItem.bookId',
                            foreignField: '_id',
                            as: 'checkoutItemsDetails'
                        }
                    },{
                        $unwind: '$checkoutItemsDetails'
                    },{
                        $group: {
                            _id:{
                                date:'$checkoutItem.date', 
                                book_name:'$checkoutItemsDetails.book_name',
                                author:'$checkoutItemsDetails.author',
                                call_number:'$checkoutItemsDetails.call_number'
                            }
                        }
                    }
                ]).toArray()
                console.log(searchPatronCirculationDetails)
                if(searchPatronCirculationDetails){
                    resolve({patronDetails:searchPatron,checkoutItems:searchPatronCirculationDetails})
                } else {
                    resolve("No checkouts")
                }
            }else{
                resolve("This patron is not available")
            }
        })
    }
}