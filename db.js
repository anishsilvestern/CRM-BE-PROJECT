const mongoose = require('mongoose');
const env = require("dotenv").config();


// to connect to mondoDB
const connectDb = async () => {

    const mondoDBUrl = process.env.MONGO_URL

    try {
        const mondoDBUrl = process.env.MONGO_URL;

        await mongoose.connect(mondoDBUrl)

        if(mongoose.connection.readyState === 1){
            console.log("Connected to database")
        }
    } catch (error) {
        console.log("Error connecting to database")
    }
}

module.exports = {
    connectDb,
    mongoose
}