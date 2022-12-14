var util = require("util");
var path = require("path"); 
var jwtUtils = require('./jwt.utils');
var multer = require('multer');
const maxSize = 2* 1024 * 1024;


// --------------Simple file
let storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, __basedir + '/ressources/assets/files');
    },
    filename: (req, file, cb) =>{
        cb(null, file.originalname);
    }
});

let uploadFile = multer({
    storage: storage,
    limits: {fileSize: maxSize}
}).single('file');


// ----------------- Message
let storageMessage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __basedir + '/ressources/assets/files');
    },
    filename: (req, file, cb) => {
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth); 
        cb(null,  userId + '_' + Date.now() + path.extname(file.originalname));
    }
});

let uploadMessage = multer({
    storage: storageMessage,
    limits: { fileSize: maxSize }
}).single('fileMessage');


// ------------------ Profil
let storageProfil = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __basedir + '/ressources/assets/profils');
    },
    filename: (req, file, cb) => {
        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);
        cb(null, userId + path.extname(file.originalname));
    }
});

let uploadProfil = multer({
    storage: storageProfil,
    limits: { fileSize: maxSize },
    fileFilter: function (req, file, cb) {
        const extension = path.extname(file.originalname).toLowerCase();
        const mimetyp = file.mimetype;
        if(extension == '.jpg' || extension == '.jpeg' || extension == '.png' ||
        mimetyp =="image/jpg" || mimetyp =="image/jpeg" || mimetyp =="image/png"){
            cb(null, true);
        }else{
            cb('ERROR_TYPE_FILE', false);
        }
    }
}).single('profil');

let uploadProfilMiddleware = util.promisify(uploadProfil);
let uploadMessageMiddleware = util.promisify(uploadMessage);
let uploadFileMiddleware = util.promisify(uploadFile);

module.exports = {
    uploadFileMiddleware,
    uploadProfilMiddleware,
    uploadMessageMiddleware
};