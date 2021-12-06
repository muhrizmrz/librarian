const db = require('../config/connection')
const bcrypt = require('bcrypt')
const collection = require('../config/collection')
const objectID = require('mongodb').ObjectId
const { resolve, reject } = require('promise')
var barcodeCheckoutStatus = true
var date = new Date()
function updateBarcodeCheckoutStatus(library, barcode, barcodeCheckoutStatus) { // UPDATE CHECKOUT STATUS OF BARCODE TRUE FUNCTION
    return new Promise((resolve,reject)=>{
        db.get().collection(collection.CATALOGUE)
        .updateOne({
            $and: [
                { library: objectID(library) },
                { barcode: parseInt(barcode) }
            ]
        }, {
            $set: {
                "checkoutStatus": barcodeCheckoutStatus
            }
        }).then((result)=>{
            resolve(result)
        })
    })
}
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

                        // CHECKING PATRON HAS CHECKOUTS
                        let hasCheckout = await db.get().collection(collection.CIRCULATION_COLLECTION).findOne({ patronId: patron._id })
                        var checkedOutdate = new Date()
                        if (hasCheckout) { // IF PATRON HAS CHECKOUTS
                            barcodeCheckoutStatus = true
                            updateBarcodeCheckoutStatus(library_id, checkoutDetails.barcode, barcodeCheckoutStatus)
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
                                    resolve(result)
                                })
                        } else { // IF PATRON HAS NO CHECKOUTS
                            barcodeCheckoutStatus = true
                            updateBarcodeCheckoutStatus(library_id, checkoutDetails.barcode, barcodeCheckoutStatus)
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
                                resolve(result)
                            })
                        }
                    }

                } else { // IF BARCODE IS NOT AVAILABLE
                    resolve("This is barcode is not available")
                }

            } else { // IF PATRON IS NOT AVAILBLE
                resolve("This patron is not available")
            }
        })
    },
    checkInBook: (barcode, libraryId) => {
        return new Promise(async(resolve, reject) => {
            barcodeCheckoutStatus = false
           // console.log(libraryId)
           
            var barcodeBook =  await db.get().collection(collection.CATALOGUE).findOne({
                $and: [
                    {library: objectID(libraryId)},
                    {barcode: parseInt(barcode)}
                ]
            })
            db.get().collection(collection.CIRCULATION_COLLECTION).updateOne({
                $and: [
                    {library: objectID(libraryId)},
                    {'checkoutItem.bookId': barcodeBook._id},
                    {'checkoutItem.checkoutStatus':true}
                ]
            },{
                $set:{
                    'checkoutItem.$.checkoutStatus' : false,
                    'checkoutItem.$.checkInDate': date.toLocaleDateString()
                }
            })
             updateBarcodeCheckoutStatus(libraryId, barcode, barcodeCheckoutStatus).then((result)=>{
                resolve(result)
            })
        })
    },
    viewCheckIn:(barcode,libraryId)=>{
        return new Promise(async(resolve,reject)=>{
            let getBook = await db.get().collection(collection.CATALOGUE).findOne({
                $and: [
                    {library:objectID(libraryId)},
                    {barcode: parseInt(barcode)}
                ]
            })
            let getCheckoutDetails = await db.get().collection(collection.CIRCULATION_COLLECTION).aggregate([
                {
                    $match: {library:objectID(libraryId)}
                },
                {
                    $unwind: '$checkoutItem'
                },{
                    $match: {
                        'checkoutItem.bookId':objectID(getBook._id),
                        'checkoutItem.checkoutStatus':true
                    }
                },{
                    $lookup: {
                        from: collection.PATRON_COLLECTION,
                        localField: 'patronId',
                        foreignField: '_id',
                        as: 'patronDetails'
                    }
                },{
                    $lookup: {
                        from: collection.CATALOGUE,
                        localField: 'checkoutItem.bookId',
                        foreignField: '_id',
                        as: 'bookDetails' 
                    }
                },{
                    $unwind: '$patronDetails'
                },{
                    $unwind: '$bookDetails'
                },{
                    $project: {
                        'checkoutItem.date':1,
                        'patronDetails.patron_name': 1,
                        'patronDetails.cardNumber':1,
                        'bookDetails.book_name':1,
                        'bookDetails.author':1,
                        'bookDetails.barcode':1
                    }
                }
            ]).toArray()
            resolve(getCheckoutDetails)
        })
    }

}