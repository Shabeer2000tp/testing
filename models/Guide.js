const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const guideSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    }
    // You can add more guide-specific fields here later
});

const Guide = mongoose.model('Guide', guideSchema);

module.exports = Guide;