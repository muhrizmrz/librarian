const db = require('../config/connection')
const bcrypt = require('bcrypt')
const collection = require('../config/collection')

module.exports = {
    addBook: (library_id, bookDetails) => {
        return new Promise(async (resolve, reject) => {
            bookDetails.arcode
            let libraryCatalogue = await db.get().collection(collection.CATALOGUE).findOne({ library: library_id })
            bookDetails.barcode = parseInt(bookDetails.barcode,10)
            if (libraryCatalogue) {
                let barcode = libraryCatalogue.books.findIndex(book => book.barcode == bookDetails.barcode)
                console.log(barcode)
                if (barcode != -1) {
                    resolve({ status:true })
                } else {
                    db.get().collection(collection.CATALOGUE).
                        updateOne({ library: library_id }, {
                            $push: { books: bookDetails }
                        }).then((recordedBook) => {
                            resolve({status:false})
                        })
                }

            } else {
                let catalogue = {
                    library: library_id,
                    books: [bookDetails]
                }
                db.get().collection(collection.CATALOGUE).insertOne(catalogue).then((recordedBook) => {
                    resolve(recordedBook)
                })
            }
        })
    }
}