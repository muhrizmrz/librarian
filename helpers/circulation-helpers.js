const db = require('../config/connection')
const bcrypt = require('bcrypt')
const collection = require('../config/collection')
const objectID = require('mongodb').ObjectId
const { resolve, reject } = require('promise')

module.exports = {

    checkout: (library_id, checkoutDetails) => {
        return new Promise(async (resolve, reject) => {
            checkoutDetails.card_number = parseInt(checkoutDetails.card_number, 10)
            checkoutDetails.barcode = parseInt(checkoutDetails.barcode, 10)

            // CHECKING PATRON IS AVAILABLE
            let patron = await db.get().collection(collection.PATRON_COLLECTION).findOne({
                $and: [
                    { library: objectID(library_id) },
                    { cardNumber: checkoutDetails.card_number }
                ]
            })
            if (patron) { // IF PATARON
                // CHECKING BARCODE IS AVAILABLE
                let barcode = await db.get().collection(collection.CATALOGUE).findOne({
                    $and: [
                        { library: objectID(library_id) },
                        { barcode: checkoutDetails.barcode }
                    ]
                })
                if (barcode) { // IF BARCODE IS AVAILABLE
                    if (barcode.checkoutStatus == true) { // IF BARCODE CHECKEDOUT TO ANOTHER PATRON
                        resolve("barcode checkedout to another patron")
                    } else { // IF NOT CHECKOUT BARCODE
                        function updateBarcodeCheckoutStatus() { // UPDATE CHECKOUT STATUS OF BARCODE TRUE FUNCTION
                            db.get().collection(collection.CATALOGUE)
                                .updateOne({
                                    $and: [
                                        { library: objectID(library_id) },
                                        { barcode: checkoutDetails.barcode }
                                    ]
                                }, {
                                    $set: {
                                        "checkoutStatus": true
                                    }
                                })
                        }
                        // CHECKING PATRON HAS CHECKOUTS
                        let hasCheckout = await db.get().collection(collection.CIRCULATION_COLLECTION).findOne({ patronId: patron._id })
                        var checkedOutdate = new Date()
                        if (hasCheckout) { // IF PATRON HAS CHECKOUTS
                            updateBarcodeCheckoutStatus() 
                            let newCheckout = { // DATA TO BO PUSHED TO CHECKOUTS
                                bookId: barcode._id,
                                date: checkedOutdate.toLocaleDateString(),
                                checkoutStatus: true
                            }
                            db.get().collection(collection.CIRCULATION_COLLECTION) // PUSH CHECKOUT DATA
                                .updateOne({ patronId: patron._id }, {
                                    $push: {
                                        checkoutItem: newCheckout
                                    }
                                }).then((result) => {
                                    console.log("new added")
                                })
                        } else { // IF PATRON HAS NO CHECKOUTS
                            updateBarcodeCheckoutStatus()
                            let newCheckoutWithNewPatron = { // DATA TO ADDED TO CIRCULATION
                                library: objectID(library_id),
                                patronId: patron._id,
                                checkoutItem: [{
                                    bookId: barcode._id,
                                    date: checkedOutdate.toLocaleDateString(),
                                    checkoutStatus: true
                                }]
                            }
                            // ADD CHECKOUT DATA
                            db.get().collection(collection.CIRCULATION_COLLECTION).insertOne(newCheckoutWithNewPatron).then((result) => {
                                console.log(result)
                            })
                        }
                    }

                } else { // IF BARCODE IS NOT AVAILABLE
                    resolve("This is barcode is not available")
                } 

            } else { // IF PATRON IS NOT AVAILBLE
                resolve("This patron is not available")
            }
            /*
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
                                        { "$match": { "library": library_id } },
                                        { "$unwind": "$books" },
                                        { "$match": { "books.barcode": checkoutDetails.barcode } }
                                    ]).toArray()
            
                                    //if barcode checkout
                                    //var circulationCollection = await db.get().collection(collection.CIRCULATION_COLLECTION).findOne({chec})
                                    var barcodeHasCheckout = await db.get().collection(collection.CIRCULATION_COLLECTION).aggregate([
                                        { "$match": { "library": library_id } },
                                        { "$unwind": "$chekoutItems" },
                                        { "$match": { "chekoutItems.bookId": barcodeDetails[0].books._id} }
                                    ]).toArray()
                                    console.log(barcodeHasCheckout)
                                    //let ifBarcodeCheckedOut = circulationCollection.findIndex(checkout => checkout.bookId == barcodeDetails[0].books._id)
                                    //if patron has checkout
                                    let ifPatronHasCheckout = await db.get().collection(collection.CIRCULATION_COLLECTION).findOne({ patronId: objectID(CardDetails[0].patrons._id) })
                                    if (ifPatronHasCheckout) {
                                            var checkoutItem = {
                                                bookId: barcodeDetails[0].books._id,
                                                    status: true
                                            } 
                                            db.get().collection(collection.CIRCULATION_COLLECTION)
                                                .updateOne({patronId: CardDetails[0].patrons._id },
                                                    {
                                                        $push: {
                                                            chekoutItems: checkoutItem 
                                                        }
                                                    }).then((result) => {
                                                        resolve(result)
                                                    })
                                    } else { //if not Circulation Collection
                                        var checkoutObj = {
                                            library: library_id,
                                            patronId: CardDetails[0].patrons._id,
                                            chekoutItems: [{
                                                bookId: barcodeDetails[0].books._id,
                                                status: true
                                            }]
            
                                        }
                                        db.get().collection(collection.CIRCULATION_COLLECTION).insertOne(checkoutObj).then((checkout) => {
                                            resolve(checkout)
                                        })
                                    }
            
            
                                } else { //if Barcode was not Found
                                    resolve("book not")
                                }
                            } else { //if Patron was not found
                                resolve("card not found")
                            }
            
                        }//if Patron Collection was not Available*/

        })
    }

}