var jwtUtils = require('../utils/jwt.utils');
var asyncLib = require('async');
var models = require('../models');

module.exports = {
    createMessage: function(req, res){

        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        var title = req.body.title;
        var content = req.body.content;

        if(userId < 0) {
            return res.status(400).json({ 'error': 'Aucune session d\'utilisateur'});
        }
        if(title == null || content == null) {
            return res.status(400).json({ 'error': 'Message vide impossible à envoyer'});
        }
        if (title.length <= 2 || content.length <= 3){
            return res.status(400).json({ 'error': 'Message invalide...'});
        }

        asyncLib.waterfall([
            function (done){
                models.User.findOne({
                    where: {id: userId}
                }).then(function (user) {
                    done(null, user);
                }).catch(function (err) {
                    return res.status(500).json({ 'error': 'Impossible de vérifier l\'utilisateur'});
                });
            },
            function(user, done) {
                if(user){
                    models.Message.create({
                        title: title,
                        content: content,
                        like: 0,
                        UserId: user.id
                    }).then(function(newMessage){
                        done(newMessage);
                    }).catch(function(err){
                        return res.status(500).json({'error': 'Message impossible à envoyer'});
                    });
                }else{
                    return res.status(404).json({ 'error': 'Utilisateur non trouvé'});
                }
            }
        ], function(newMessage){
            if(newMessage){
                return res.status(201).json(newMessage);
            }else{
                return res.status(500).json({'error': 'Message non envoyé'});
            }
        })
    },
    listMessages: function(req, res){

        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        var fields = req.query.fields;
        var limit = parseInt(req.query.limit);
        var offset = parseInt(req.query.offset);
        var order = req.query.order;

        if (userId < 0) {
            return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
        }
        
        asyncLib.waterfall([
            function (done) {
                models.User.findOne({
                    where: {id: userId}
                }).then(function (user) {
                    done(null, user);
                }).catch(function (err) {
                    return res.status(500).json({ 'error': 'Impossible de vérifier l\'utilisateur' });
                });
            },
            function(user, done) {
                models.Message.findAll({
                    order: [(order != null) ? order.split(':') : ['title', 'ASC']],
                    attributes: (fields !== '*' && fields != null) ? fields.split(',') : null,
                    limit: (!isNaN(limit)) ? limit : null,
                    offset: (!isNaN(offset)) ? offset : null,
                    include: [{
                        model: models.User,
                        attributes: ['username']
                    }]
                }).then(function(messages){
                    done(null, user, messages);
                }).catch(function(err){
                    return res.status(500).json({'error': 'Attributs demandés invalides...'});
                });
            },
            function(user, messages) {
                if(user){
                    res.status(200).json(messages);
                }else{
                    return res.status(401).json({'error': 'Connexion d\'utilisateur obligé pour voir les messages'});
                }
            }
        ])
    }
}