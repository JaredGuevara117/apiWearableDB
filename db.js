const { MongoClient } = require('mongodb');

let dbConnection;

const connectToDB = (cb) => {
    MongoClient.connect(process.env.MONGODB_URI)
        .then(client => {
            dbConnection = client.db();
            return cb();
        })
        .catch(err => {
            console.log('Error connecting to MongoDB:', err);
            return cb(err);
        });
};

const getDB = () => dbConnection;

module.exports = { connectToDB, getDB };