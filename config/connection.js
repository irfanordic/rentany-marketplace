const MongoClient = require('mongodb').MongoClient;

const state = { db: null };

module.exports.connect = async function(done) {
    const url = process.env.MONGO_URI || 'mongodb://localhost:27017';
    const dbname = 'circular-community';

    try {
        const client = await MongoClient.connect(url);
        state.db = client.db(dbname);
        done();
    } catch (err) {
        done(err);
    }
};

module.exports.get = function() {
    return state.db;
};