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
    },

    saveMessage:(data)=>{
        return new Promise(async(resolve, reject)=>{


            let participants = [new ObjectId(data.senderId), new ObjectId(data.recieverId)].sort()

                    let msgObj = {
                        senderId: new ObjectId(data.senderId),
                        message: data.message,
                        timeStamp: new Date(),
                        
                    }
            
                  await db.get().collection('conversations').updateOne(
                    { participants: participants, itemName: data.item},
                    {
                        $set:{ lastMessage: data.message, updatedAt: new Date()},
                        $push: { messages: msgObj}
                    },
                    { upsert: true}
                  )

                  resolve()

        })
        },

        getConversations:(userId)=>{
            return new Promise(async(resolve, reject)=>{
                let conversations =  await db.get().collection('conversations').find({
                    participants: {$in: [new ObjectId(userId)]}
                }).sort({ updatedAt: -1}).toArray() 

               conversations.forEach(convo=>{
                  convo.partnerId = convo.participants.find(p=> p.toString() !== userId.toString())
               })

                  resolve(conversations)   
                 })
        },

        getChatHistory:(myId, partnerId, itemName)=>{
            return new Promise(async(resolve, reject)=>{
               if(!partnerId || !itemName) resolve([])

                let participants = [new ObjectId(myId), new ObjectId(partnerId)].sort()

                let conversation = await db.get().collection('conversations').findOne({
                    participants: participants,
                    itemName: itemName
                })

                resolve(conversation? conversation.messages : [])
            })
        }





    


}