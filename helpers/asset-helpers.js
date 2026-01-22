const db   = require('../config/connection');
const { ObjectId } = require('mongodb');

module.exports = {
   
 addAsset:(asset, userId)=>{
        return new Promise((resolve, reject)=>{
            asset.ownerId = userId
            asset.status = 'available'
            asset.date = new Date().toDateString()

            db.get().collection('assets').insertOne(asset).then((data)=>{
                resolve(data.insertedId)
            })
        })
    },

    getAllAssets:()=>{
        return new Promise(async(resolve, reject)=>{
            let assets = await db.get().collection('assets').find().toArray()
            resolve(assets)
        })
    },


    getProductDetails:(productId)=>{
        return new Promise(async(resolve, reject)=>{

           db.get().collection('assets').findOne({_id: new ObjectId(productId)}).then((product)=>{
                resolve(product)
            })

            }
        )
    },

    placeRequest:(productId, userId)=>{
        return new Promise(async(resolve, reject)=>{

            let product =  await db.get().collection('assets').findOne({_id : new ObjectId(productId)})

            let requestObj={
                item: new ObjectId(productId),
                user: new ObjectId(userId),//borrower
                owner: new ObjectId(product.ownerId),
                itemName: product.Name,
                price: product.Price,
                date: new Date().toDateString(),
                status: 'pending'

            }

            db.get().collection('rentals').insertOne(requestObj).then((response)=>{
                resolve(response)
            })
        })
    },

    getUserRentals:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            let rentals =  await db.get().collection('rentals').aggregate([
                { $match: {user: new ObjectId(userId)}},
                {
                    $lookup: {
                        from: 'assets',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'itemDetails'
                    }
                },
                { $unwind: '$itemDetails' }
            ]).toArray()

            resolve(rentals)
        })
    },

    getOwnerRequests:(ownerId)=>{
        return new Promise(async(resolve, reject)=>{
            let requests = await db.get().collection('rentals').aggregate([
                { $match: { owner: new ObjectId(ownerId)}},
                {
                    $lookup:{
                        from: 'assets',
                        localField: 'item',
                        foreignField: '_id',
                        as: 'itemDetails'
                    }
                },
                { $unwind: '$itemDetails' }
            ]).toArray()
            resolve(requests)
        })
    },


    updateRequestStatus:(requestId, newStatus)=>{
        return new Promise(async(resolve, reject)=>{
            db.get().collection('rentals').updateOne(
                {_id: new ObjectId(requestId)},
                { $set: { status: newStatus} }
            ).then((response)=>{
                resolve()
            })
        })
    },
    updateProduct:(productId, productDetails)=>{
        return new Promise((resolve, reject)=>{
            db.get().collection('assets').updateOne(
                {_id: new ObjectId(productId)},
                {
                    $set:{
                        Name: productDetails.Name,
                        Description: productDetails.Description,
                        Price: productDetails.Price,
                        Category: productDetails.Category,
                        subCategory: productDetails.subCategory,
                        Deposit: productDetails.Deposit,
                        Location: productDetails.Location

                    }
                }
            ).then((response)=>{
                resolve()
            })
        })
    }




}