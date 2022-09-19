var jwtUtils = require('../utils/jwt.utils');
var uploadFile = require('../stockage/upload');
var models = require('../models');
var fs = require('fs');


const upload = async function(req, res) {
    try {
        await uploadFile(req, res);
        if(req.file == undefined){
            return res.status(400).send({'error': 'Fichier non chargé'});
        }else{
            res.status(200).send({'Fichier': req.file.originalname + ' est transféré avec succès'});
        }
    } catch (err) {
        if(err.code == "LIMIT_FILE_SIZE"){
            return res.status(500).send({'error': 'Impossible de transferer un fichier de plus de 2MB'});
        }else{
            return res.status(500).send({ 'error': 'Impossible de transférer le fichier' });
        }
    }
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

    var directoryPath = __basedir + '/ressources/assets/';

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
        console.log(err);
        return res.status(400).send({ 'error': 'Accès interdit' });
    });
}

module.exports = {
    upload,
    download,
    listFiles
};