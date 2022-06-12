const db = require('../config/connection')
const collection = require('../config/collection')
const { resolve, reject } = require('promise')
const { ObjectId } = require('mongodb')

module.exports = {
    addPatron: (newPatron, library_id) => {
        return new Promise(async (resolve, reject) => {

            if (isNaN(newPatron.cardNumber)) {
                resolve({ errorStatus: true, errorMsg: 'Card number must be number' })
            } else {

                //CHECKING DUPLICATE PATRON
                let isPatronAvailable = await db.get().collection(collection.PATRON_COLLECTION).findOne({
                    $and: [
                        { library: ObjectId(library_id) },
                        { cardNumber: parseInt(newPatron.cardNumber) }
                    ]
                })

                //IF DUPLICATE PATRON
                if (isPatronAvailable) {
                    resolve({ errorStatus: true, errorMsg: 'This card is already in use' })
                } else { // IF NOT 
                    // adding some data
                    if (newPatron.cardNumber)
                        newPatron.cardNumber = parseInt(newPatron.cardNumber, 10)
                    newPatron.library = ObjectId(library_id)
                    var date = new Date()
                    newPatron.date = date.toLocaleDateString()
                    //DATABASE ADDING
                    db.get().collection(collection.PATRON_COLLECTION).insertOne(newPatron).then((data) => {
                        resolve(data)
                    })
                }
            }
        })
    },
    checkDuplicateCardNumber: (details) => {
        return new Promise(async (resolve, reject) => {
            let checkDuplicateCardNumber = await db.get().collection(collection.PATRON_COLLECTION).findOne({
                $and: [
                    { library: ObjectId(details.library) },
                    { cardNumber: parseInt(details.cardNumber, 10) }
                ]
            })
            if (checkDuplicateCardNumber) {
                resolve({ status: true })
            } else {
                resolve({ status: false })
            }
        })
    },
    viewPatron: (cardNumber, library_id) => {
        return new Promise(async (resolve, reject) => {
            let searchPatron = await db.get().collection(collection.PATRON_COLLECTION).findOne({
                $and: [
                    { library: ObjectId(library_id) },
                    { cardNumber: parseInt(cardNumber, 10) }
                ]
            })
            if (searchPatron) {
                let searchPatronCirculationDetails = await db.get().collection(collection.CIRCULATION_COLLECTION).aggregate([
                    {
                        $match: {
                            patronId: searchPatron._id,
                        }
                    },
                    {
                        $unwind: '$checkoutItem'
                    },
                    {
                        $match: {
                            'checkoutItem.checkoutStatus': true
                        }
                    },
                    {
                        $lookup: {
                            from: 'catalogue',
                            localField: 'checkoutItem.bookId',
                            foreignField: '_id',
                            as: 'checkoutItemsDetails'
                        }
                    }, {
                        $unwind: '$checkoutItemsDetails'
                    },
                    {
                        $group: {
                            _id: {
                                date: '$checkoutItem.date',
                                book_name: '$checkoutItemsDetails.book_name',
                                barcode: '$checkoutItemsDetails.barcode',
                                call_number: '$checkoutItemsDetails.call_number',
                                item_type: '$checkoutItemsDetails.item_type',
                                author: '$checkoutItemsDetails.author',
                                collection: '$checkoutItemsDetails.collection'
                            }
                        }
                    }
                ]).toArray()
                if (searchPatronCirculationDetails) {
                    resolve({ patronDetails: searchPatron, isCheckouts: true, checkoutItems: searchPatronCirculationDetails })
                } else {
                    resolve({ patronDetails: searchPatron, isCheckouts: false, msg: 'No Checkouts'})
                }
            } else {
                resolve("This patron is not available")
            }
        })
    }
}