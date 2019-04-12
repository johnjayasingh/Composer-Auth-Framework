const mongoose = require('./connection');

const UserSchema = new mongoose.Schema({
    'username': {
        type: String,
        required: true,
        unique: true,
    },
    'password': {
        type: String,
        required: true,
    },
    'card_name': {
        type: String,
        required: true,
    },
    'user_type': {
        type: String,
        required: true,
    },
    'session_id': {
        type: String,
        default: '',
    },
    'token': {
        type: String,
        default: '',
    },
    'user_created_on': {
        type: Date,
        default: new Date(),
    },
    'last_login_on': {
        type: Date,
        default: new Date(),
    },
});

module.exports = mongoose.model('User', UserSchema);
