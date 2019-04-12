// Bring Mongoose into the app
const mongoose = require('mongoose');
const config = require('config');
mongoose.Promise = global.Promise;

// Build the connection string
const dbURI = config.get('app.mongoose_db');

// Create the database connection
mongoose.connect(dbURI, {
});

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', () => {
    console.log('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on('error', (err) => {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console
            .log(`Mongoose default connection disconnected`);
        process.exit(0);
    });
});

module.exports = mongoose;
