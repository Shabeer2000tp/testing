const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const loginSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true, // Removes whitespace from both ends
        lowercase: true // Stores the email in lowercase
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['student', 'guide', 'admin'] // Role must be one of these values
    },
    profileId: {
        type: Schema.Types.ObjectId,
        required: true,
        // This will reference either a Student or Guide model based on the role
        refPath: 'roleRef' 
    },
    roleRef: {
        type: String,
        required: true,
        enum: ['Student', 'Guide', 'Admin'] // Mongoose model names
    },
     // Add this new field
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

const Login = mongoose.model('Login', loginSchema);

module.exports = Login;