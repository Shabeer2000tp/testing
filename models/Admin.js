// models/Admin.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adminSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;