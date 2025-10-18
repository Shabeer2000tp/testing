const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    studentIdNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    }
    // You can add more student-specific fields here later
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;