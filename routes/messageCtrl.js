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
    },
    listMessagesForUser: function(req, res){

        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        var otherUserId = parseInt(req.query.otherUserId); 
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
                    where: { id: userId }
                }).then(function (user) {
                    done(null, user);
                }).catch(function (err) {
                    return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
                });
            },
            function(user, done){
                if(user){
                    models.User.findOne({
                        where: { id: otherUserId }
                    }).then(function (otherUser) {
                        done(null, otherUser);
                    }).catch(function (err) {
                        return res.status(400).json({ 'error': 'Impossible de trouver l\'tilisateur recherché' });
                    });
                }else{
                    return res.status(400).json({ 'error': 'Recherche impossible'});
                }
            },
            function(otherUser, done){
                if (otherUser) {
                    models.Message.findAll({
                        where: {userid: otherUserId},
                        order: [(order != null) ? order.split(':') : ['title', 'ASC']],
                        attributes: (fields !== '*' && fields != null) ? fields.split(',') : null,
                        limit: (!isNaN(limit)) ? limit : null,
                        offset: (!isNaN(offset)) ? offset : null
                    }).then(function(messages){
                        done(null, messages);
                    }).catch(function(err){
                        return res.status(500).json({ 'error': 'Messages non trouvés'});
                    });
                } else {
                    return res.status(401).json({ 'error': 'L\'utilisateur concerné non trouvé'});
                }
            },
            function(messages, done){
                if(messages){
                    res.status(200).json(messages);
                }else{
                    return res.status(500).json({ 'error': 'Messages indisponibles'});
                }
            }
        ]);
    },
    deleteMessage: function(req, res){

        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        var messageId = parseInt(req.query.messageId);

        if (userId < 0) {
            return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
        }

        asyncLib.waterfall([
            function(done) {
                models.User.findOne({
                    where: {id: userId}
                }).then(function(user) {
                    done(null, user);
                }).catch(function(err) {
                    return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
                });
            },
            function (user, done) {
                models.Message.findOne({
                    where: {
                        id: messageId,
                        userId: user.id
                    }
                }).then(function (message) {
                    done(null, message);
                }).catch(function (err) {
                    return res.status(401).json({ 'error': 'Message indisponible' });
                });
            },
            function(message, done){
                models.Like.findAll({
                    where: {
                        messageId: message.id
                    }
                }).then(function(likes){
                    done(null, likes, message);
                }).catch(function(err){
                    console.log(err);
                    return res.status(500).json({'error': 'Impossible de trouver les réactions à ce message'});
                });
            },
            function(likes,message, done){
                likes.forEach(like => {
                    like.destroy();
                });
                done(null, message);
            },
            function(message, done){
                if(message){
                    message.destroy()
                    .then(function(isSupMessage){
                        done(null,isSupMessage);
                    }).catch(function(err){
                        return res.status(500).json({'error': 'Impossible de supprimer le message'});
                    });
                }
            },
            function(isSupMessage){
                if (isSupMessage) {
                    return res.status(200).json({'success': 'Message supprimé avec succès'});
                }else{
                    return res.status(500).json({'error': 'Problème avec la suppression du message'});
                }
            }
        ]);
    }
}