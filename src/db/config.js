const mongoose = require("mongoose");

const URL = process.env.MONGODB_URL;

mongoose
    .connect(URL, { autoIndex: true })
    .then(() => {
        console.log("Databse connection Established successfully.");
    })
    .catch((e) => {
        console.log(e);
    });
