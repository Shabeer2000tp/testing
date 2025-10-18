const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const domainSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
});

const Domain = mongoose.model('Domain', domainSchema);

module.exports = Domain;