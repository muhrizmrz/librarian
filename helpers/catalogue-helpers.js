const db = require('../config/connection')
const bcrypt = require('bcrypt')
const collection = require('../config/collection')
const { ObjectId } = require('bson')
const { resolve, reject } = require('promise')

module.exports = {
    addBook: (library_id, bookDetails) => {
        return new Promise(async (resolve, reject) => {
            // CHECKING DUPLICATE BARCODE
            let isBarcodeAvailable = await db.get().collection(collection.CATALOGUE).findOne(
                { $and: [
                        { library: ObjectId(library_id)},
                        { barcode: parseInt(bookDetails.barcode, 10) }
                    ] }
            )

            //IF DUPLICATE BARCODE
            if (isBarcodeAvailable) {
                resolve({status:true})
            } else { // IF NOT ADD BOOK
                bookDetails.barcode = parseInt(bookDetails.barcode, 10) //converting string into integer
                bookDetails.library = ObjectId(library_id)  // add library id
                var checkedOutdate = new Date()
                bookDetails.date = checkedOutdate.toLocaleDateString() // added date
                bookDetails.checkoutStatus = false  // checkout status
                //DATABASE ADDEING
                db.get().collection(collection.CATALOGUE).insertOne(bookDetails).then((data) => {
                    resolve(data)
                }) 
            } 
        })
    },
    checkDuplicateBarcode:(details)=>{
        return new Promise(async(resolve,reject)=>{
            let checkingDuplicateBarcode = await db.get().collection(collection.CATALOGUE).findOne(
                { $and: [
                        { library: ObjectId(details.library)},
                        { barcode: parseInt(details.barcodeTyped,10)}
                    ] }
            )
            if(checkingDuplicateBarcode){
                resolve({status:true})
            }else{
                resolve({status:false})
            }
        })
    },
    catalogueReports:(library_id,catagory)=>{
        return new Promise(async(resolve,reject)=>{
            let catalogueReports = await db.get().collection(catagory).find({library:ObjectId(library_id)}).toArray()
            resolve(catalogueReports)
        })
    }
}