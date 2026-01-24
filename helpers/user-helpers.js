const { ObjectId } = require('mongodb');
const db   = require('../config/connection');
const bcrypt =  require('bcrypt');

module.exports = {
    doSignup:(userData)=>{
        return new Promise(async(resolve, reject)=>{
            userData.Password = await bcrypt.hash(userData.Password, 10);


            db.get().collection('user').insertOne(userData).then((data)=>{
                resolve(data)
            })
        })
    },


    doLogin:(userData)=>{
        return new Promise(async(resolve, reject)=>{

            let response = {}

            let user = await db.get().collection('user').findOne({Email: userData.Email })
            if(user){
                bcrypt.compare(userData.Password, user.Password).then((status)=>{
                    if(status){
                        response.user = user
                        response.status = true
                        resolve(response)

                }else{
                    console.log('login failed ')
                    resolve({status: false})
                }
            })
            }else{
                console.log('user not found')
                resolve({status: false})
            }

        })
    },

    getUserDetails:(userId)=>{
        return new Promise(async(resolve, reject)=>{
            let stats = {}

             stats.listed = await db.get().collection('assets').countDocuments({ownerId: userId})
             stats.rented = await db.get().collection('rentals').countDocuments({user: new ObjectId(userId)})
            resolve(stats)
        })
    }

    


}