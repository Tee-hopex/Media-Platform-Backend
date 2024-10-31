const mongoose= require("mongoose");
require("dotenv").config()


mongoose.connect(process.env.MONGO_URI)
    .catch(error => console.log('DB Connection error: ' +error));
const con = mongoose.connection;
// handle error when opening db
con.on('open', error => {
    if (!error)
        console.log('DB Connection Successful');
    else
        console.log('Error Connecting to DB: ${error}');
});

// handle mongoose disconnect from mongodb
con.on('disconnected', error => {
    console.log(`Mongoose lost connection with MongoDB:
    ${error}`);
});


const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json'); // Path to the generated Swagger file
const swaggerAutogen = require('./swagger'); // Import your autogen config

const express = require("express");
const app = express();
const PORT = process.env.PORT;
const cors = require("cors")



app.use(cors())
app.use(express.json());

app.use('/auth', require('./routes/auth'))
app.use('/media', require('./routes/media'))


// Generate Swagger docs before starting the server
// swaggerAutogen(); // This will create or update the swagger-output.json

// Setup Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});