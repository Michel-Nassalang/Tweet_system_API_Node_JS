var jwtUtils = require('../utils/jwt.utils');
var uploadFile = require('../stockage/upload');
var models = require('../models');

const upload = async function(req, res) {
    try {
        await uploadFile(req, res);
        if(req.file == undefined){
            return res.status(400).send({'error': 'Fichier non chargé'});
        }else{
            res.status(200).send({'Fichier:': 'nom (' + req.file.originalname});
        }
    } catch (err) {
        return res.status(500).send({'error': 'Impossible de transférer le fichier'});
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
        res.download(directoryPath + fileName, fileName, (err) => {
            if (err) {
                res.status(500).send({ 'error': 'fichier indisponible' });
            }
        });
    }).catch(function (err){
        return res.status(400).send({ 'error': 'Non autorisé à télécharger'})
    });
}

module.exports = {
    upload,
    download
}