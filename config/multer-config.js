// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Set up storage engine
// const storage = multer.diskStorage({
//     destination: './uploads/',
//     filename: function(req, file, cb) {
//         // Create a unique filename: fieldname-timestamp.extension
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     }
// });

// // Initialize upload variable
// const upload = multer({
//     storage: storage,
//     limits: { fileSize: 5000000 }, // Set a file size limit (e.g., 5MB)
//     fileFilter: function(req, file, cb) {
//         checkFileType(file, cb);
//     }
// }).single('deliverableFile'); // 'deliverableFile' is the name of the input field in our form


// // Check File Type function
// function checkFileType(file, cb) {
//     // Allowed extensions
//     const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|zip|rar/;
//     // Check extension
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//     // Check mime type
//     const mimetype = filetypes.test(file.mimetype);

//     if (mimetype && extname) {
//         return cb(null, true);
//     } else {
//         cb('Error: You can only upload certain file types (images, pdf, docs, zip)!');
//     }
// }

// // NEW: Storage configuration for notification attachments
// const notificationStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const dir = path.join(__dirname, '../uploads/notifications');
//         fs.mkdirSync(dir, { recursive: true });
//         cb(null, dir);
//     },
//     filename: (req, file, cb) => {
//         cb(null, `${Date.now()}-${file.originalname}`);
//     }
// });

// exports.uploadDeliverable = multer({ storage: deliverableStorage });
// // NEW EXPORT
// exports.uploadAttachment = multer({ storage: notificationStorage });

// module.exports = upload;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// RE-ADD THIS: Storage configuration for student deliverables
const deliverableStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/deliverables');
        // Create the directory if it doesn't exist
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Prepend a timestamp to the original filename to ensure it's unique
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Storage configuration for notification attachments
const notificationStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/notifications');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Export both multer instances
exports.uploadDeliverable = multer({ storage: deliverableStorage });
exports.uploadAttachment = multer({ storage: notificationStorage });