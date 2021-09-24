const db = require('../config/connection')
const bcrypt = require('bcrypt')
const collection = require('../config/collection')
const objectID = require('mongodb').ObjectId
const { resolve, reject } = require('promise')

module.exports = {

    checkout: (library_id, checkoutDetails) => {
        return new Promise(async (resolve, reject) => {
            checkoutDetails.card_number = parseInt(checkoutDetails.card_number,10)
            checkoutDetails.barcode = parseInt(checkoutDetails.barcode,10)

            //Checking Library
            let libraryCatalogue = await db.get().collection(collection.PATRON_COLLECTION).findOne({ library: library_id })
            if (libraryCatalogue) {

                //Checking Patron
                var patron = await libraryCatalogue.patrons.findIndex(patron => patron.cardNumber == checkoutDetails.card_number)
                if (patron != -1) {
                    //access Patron Id
                    var CardDetails = await db.get().collection(collection.PATRON_COLLECTION).aggregate([
                        {
                            "$match": {
                                "library": library_id
                            }
                        },
                        { "$unwind": "$patrons" },
                        { "$match": { "patrons.cardNumber": checkoutDetails.card_number } }

                    ]).toArray()
                    
                    //Checking Barcode
                    let catalogueCollection = await db.get().collection(collection.CATALOGUE).findOne({ library: library_id })
                    let barcode = catalogueCollection.books.findIndex(book => book.barcode == checkoutDetails.barcode)
                    if (barcode != -1) {
                        //Access Barcode data
                        var barcodeDetails = await db.get().collection(collection.CATALOGUE).aggregate([
                            { "$match": {"library":library_id}},
                            { "$unwind":"$books"},
                            { "$match": {"books.barcode":checkoutDetails.barcode}}
                        ]).toArray()
                        
                        //Checking Circulation Collection
                        let circulationCollection = await db.get().collection(collection.CIRCULATION_COLLECTION).findOne({library:library_id})
                        if(circulationCollection){
                            console.log(circulationCollection)
                            //Checking IF Patron has checkouts
                            let ifpatronHasCheckouts = await circulationCollection.circulation.findIndex(patron => patron.patronId == CardDetails[0].patrons._id)
                            console.log(ifpatronHasCheckouts)
                            if(ifpatronHasCheckouts != -1){
                                //if patron has checkout
                                db.get().collection(collection.CIRCULATION_COLLECTION)
                                .updateOne({library:library_id,"circulation.userId":CardDetails[0].patrons._id},
                                    {$push: {"circulation.$.chekoutItems":{
                                        bookId: barcodeDetails[0].books._id,
                                        status: true
                                    }}})
                            }else{
                                //patron has not checkout
                                var checkoutObj = {
                                    patronId: CardDetails[0].patrons._id,
                                    chekoutItems: [{
                                        bookId: barcodeDetails[0].books._id,
                                        status: true
                                    }]
                                }
                                db.get().collection(collection.CIRCULATION_COLLECTION)
                                .updateOne({library:library_id},{
                                    $push: { circulation: checkoutObj}
                                }).then((result)=>{
                                    resolve(result)
                                })
                            }

                            // if circulation collection
                            
                            
                        }else{ //if not Circulation Collection
                            var checkoutObj = {
                                library: library_id,
                                circulation: [{
                                    patronId: CardDetails[0].patrons._id,
                                    chekoutItems: [{
                                        bookId: barcodeDetails[0].books._id,
                                        status: true
                                    }]
                                }]
                            }
                            db.get().collection(collection.CIRCULATION_COLLECTION).insertOne(checkoutObj).then((checkout)=>{
                                resolve(checkout)
                            })
                        }
                        
                        
                    } else { //if Barcode was not Found
                        resolve("book not")
                    }
                } else { //if Patron was not found
                    resolve("card not found")
                }

            }//if Patron Collection was not Available

        })
    }

}