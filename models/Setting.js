const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const settingSchema = new Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: String,
        required: true
    }
});

const Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;