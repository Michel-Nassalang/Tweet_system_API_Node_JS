var models = require('../models');
var asyncLib = require('async'); 
var jwtUtils = require('../utils/jwt.utils');

module.exports = {
    likePost: function(req, res){

        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        var messageId = parseInt(req.query.messageId);

        if (userId < 0) {
            return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
        }
        if (messageId <= 0) {
            return res.status(400).json({ 'error': 'Paramètres d\'entrées invalides' });
        }
        asyncLib.waterfall([
            function (done) {
                models.Message.findOne({
                    where: {id: messageId}
                }).then(function (message){
                    done(null, message);
                }).catch(function (err) {
                    console.log(err);
                    return res.status(400).json({ 'error': 'Message non trouvé...'});
                });
            },
            function(message, done){
                if(message){
                    models.User.findOne({
                        where: {id: userId}
                    }).then(function(user){
                        done(null, user, message);
                    }).catch(function (err) {
                        return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
                    });
                } else {
                    return res.status(500).json({ 'error': 'Message indisponible' });
                }
            },
            function(user, message, done) {
                if(user && message){
                    models.Like.findOne({
                        where: {userId: userId,
                            messageId: messageId}
                    }).then(function(likeAct){
                        done(null, likeAct, user, message);
                    }).catch(function(err){
                        return res.status(401).json({ 'error': 'Absence de réactions'});
                    });
                }else{
                    return res.status(404).json({ 'error': 'Impossible d\'agir...'});
                }
            },
            function(likeAct, user, message, done){
                if(!likeAct){
                    message.addUser(user)
                    .then(function(isLikeAct){
                        done(null, message, isLikeAct);
                    }).catch(function(err){
                        return res.status(500).json({ 'error':'Réaction impossible...'});
                    });
                }else{
                    return res.status(409).json({ 'error':'Message  déja liké...'});
                }
            },
            function(message, isLikeAct, done){
                message.update({
                    like: message.like + 1
                }).then(function(){
                    done(message);
                }).catch(function(err){
                    console.log(err);
                    return res.status(500).json({ 'error':'Impossible de liker le message'});
                })
            }
        ],
        function(message){
            if(message){
                res.status(201).json(message);
            }else{
                return res.status(500).json({'error': 'Impossible de mettre à jour le message'});
            }
        });
    },
    dislikePost: function(req, res){

        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        var messageId = parseInt(req.query.messageId);

        if (userId < 0) {
            return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
        }
        if (messageId <= 0) {
            return res.status(400).json({ 'error': 'Paramètres d\'entrées invalides' });
        }
        asyncLib.waterfall([
            function (done) {
                models.Message.findOne({
                    where: { id: messageId }
                }).then(function (message) {
                    done(null, message);
                }).catch(function (err) {
                    console.log(err);
                    return res.status(400).json({ 'error': 'Message non trouvé...' });
                });
            },
            function (message, done) {
                if (message) {
                    models.User.findOne({
                        where: { id: userId }
                    }).then(function (user) {
                        done(null, user, message);
                    }).catch(function (err) {
                        return res.status(400).json({ 'error': 'Aucune session d\'utilisateur' });
                    });
                } else {
                    return res.status(500).json({ 'error': 'Message indisponible' });
                }
            },
            function (user, message, done) {
                if (user && message) {
                    models.Like.findOne({
                        where: {
                            userId: userId,
                            messageId: messageId
                        }
                    }).then(function (likeAct) {
                        done(null, likeAct, user, message);
                    }).catch(function (err) {
                        return res.status(401).json({ 'error': 'Absence de réaction' });
                    });
                } else {
                    return res.status(404).json({ 'error': 'Impossible d\'agir...' });
                }
            },
            function (likeAct, user, message, done) {
                if (likeAct) {
                    likeAct.destroy()
                        .then(function (isNotLikeAct) {
                            done(null, message, isNotLikeAct);
                        }).catch(function (err) {
                            console.log(err);
                            return res.status(500).json({ 'error': 'Réaction impossible...' });
                        });
                } else {
                    return res.status(409).json({ 'error': 'Impossible de disliker le message' });
                }
            },
            function (message, isNotLikeAct, done) {
                message.update({
                    like: message.like - 1
                }).then(function () {
                    done(message);
                }).catch(function (err) {
                    console.log(err);
                    return res.status(500).json({ 'error': 'Impossible de disliker le message' });
                })
            }
        ],
            function (message) {
                if (message) {
                    res.status(201).json(message);
                } else {
                    return res.status(500).json({ 'error': 'Impossible de mettre à jour le message' });
                }
            }
        );
    }
}