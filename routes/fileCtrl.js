var jwtUtils = require('../utils/jwt.utils');
var uploadFile = require('../utils/upload');
var models = require('../models');
var fs = require('fs');


const upload = async function(req, res) {
    try {
        await uploadFile.uploadFileMiddleware(req, res);
        if(req.file == undefined){
            res.status(400).send({'error': 'Fichier non chargé'});
        }else{
            res.status(200).send({'Fichier': req.file.originalname + ' est transféré avec succès'});
        }
    } catch (err) {
        if(err.code == "LIMIT_FILE_SIZE"){
            return res.status(500).send({'error': 'Impossible de transferer un fichier de plus de 2MB'});
        }else if (err == "ERROR_TYPE_FILE") {
            return res.status(500).send({ 'error': 'Type de fichier non accepté' });
        }
        else{
            return res.status(500).send({ 'error': 'Impossible de transférer le fichier' });
        }
    };
}
const uploadForMessage = async function (req, res, next) {

    var headerAuth = req.headers['authorization'];
    var userId = jwtUtils.getUserId(headerAuth); 
    if (userId < 0) {
        return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
    }
    models.User.findOne({
        where: { id: userId }
    }).then(async function (user) {
        if(user){
            try {
                await uploadFile.uploadMessageMiddleware(req, res);
                if (req.file == undefined) {
                    next();
                } else {
                    next();
                }
            } catch (err) {
                if (err.code == "LIMIT_FILE_SIZE") {
                    return res.status(500).send({ 'error': 'Impossible de transferer un fichier de plus de 2MB' });
                } else if (err == "ERROR_TYPE_FILE") {
                    return res.status(500).send({ 'error': 'Type de fichier non accepté' });
                }
                else {
                    console.log(err);
                    return res.status(500).send({ 'error': 'Impossible de transférer le fichier' });
                }
            };
        }
    }).catch(function (err) {
        return res.status(500).json({ 'error': 'Impossible de vérifier l\'utilisateur' });
    });
}
const uploadProfil = async function (req, res, next) {

    var headerAuth = req.headers['authorization'];
    var userId = jwtUtils.getUserId(headerAuth);
    if (userId < 0) {
        return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
    }
    models.User.findOne({
        where: { id: userId }
    }).then(async function (user) {
        if (user) {
            try {
                await uploadFile.uploadProfilMiddleware(req, res);
                if (req.file == undefined) {
                    next();
                } else {
                    next();
                }
            } catch (err) {
                if (err.code == "LIMIT_FILE_SIZE") {
                    return res.status(500).send({ 'error': 'Impossible de transferer un fichier de plus de 2MB' });
                } else if (err == "ERROR_TYPE_FILE") {
                    return res.status(500).send({ 'error': 'Type de fichier non accepté' });
                }
                else {
                    console.log(err);
                    return res.status(500).send({ 'error': 'Impossible de transférer le fichier' });
                }
            };
        }
    }).catch(function (err) {
        return res.status(500).json({ 'error': 'Impossible de vérifier l\'utilisateur' });
    });
}

const download = function(req, res) {

    var headerAuth = req.headers['authorization'];
    var userId = jwtUtils.getUserId(headerAuth);

    var fileName = req.params.name;
    var directoryPath = __basedir + '/ressources/assets/';

    if (userId < 0) {
        return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
    }

    models.User.findOne({
        where: { id: userId}
    }).then(function (user) {
        if(user){
            res.download(directoryPath + fileName, fileName, (err) => {
                if (err) {
                    res.status(500).send({ 'error': 'fichier indisponible' });
                }
            });
        }else{
            return res.status(401).send({ 'error': 'Autorisation non accordée'});
        }
    }).catch(function (err){
        return res.status(400).send({ 'error': 'Non autorisé à télécharger'})
    });
}

const listFiles = function (req, res) {

    var headerAuth = req.headers['authorization'];
    var userId = jwtUtils.getUserId(headerAuth);

    var directoryPath = __basedir + '/ressources/assets/files';

    if (userId < 0) {
        return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
    }

    models.User.findOne({
        where: { id: userId }
    }).then(function (user) {
        if(user){
            fs.readdir(directoryPath, function (err, files) {
                if (err) {
                    res.status(500).send({ 'error': 'Fichiers introuvables' });
                } else {
                    let fileInfos = [];

                    files.forEach((file) => {
                        fileInfos.push({
                            name: file,
                            url: directoryPath + file
                        });
                    });

                    res.status(200).json(fileInfos);
                }
            });
        } else {
            return res.status(401).send({ 'error': 'Autorisation non accordée' });
        }
    }).catch(function (err) {
        return res.status(400).send({ 'error': 'Accès interdit' });
    });
}

module.exports = {
    upload,
    uploadForMessage,
    uploadProfil,
    download,
    listFiles
};