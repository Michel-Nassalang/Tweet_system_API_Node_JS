var bcrypt = require('bcrypt');
var jwtUtils = require('../utils/jwt.utils');
var models = require('../models');
var asyncLib = require('async');

const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const PASSWORD_REGEX = /^[a-zA-Z]\w{3,14}$/;

module.exports = {
    register: function(req, res){

        var email = req.body.email;
        var username = req.body.username;
        var password = req.body.password;
        var bio = req.body.bio;

        if(email == null || username == null || password == null){
            return res.status(400).json({'error': 'paramètres manquants'});
        }
        if(!EMAIL_REGEX.test(email)){
            return res.status(400).json({'error': 'Adresse Mail invalide...'})
        }
        if(!PASSWORD_REGEX.test(password)){
            return res.status(400).json({'error': 'Format de Password invalide...'})
        }

        asyncLib.waterfall([
            function(done){
                models.User.findOne({
                    attributes: ['email'],
                    where: { email: email }
                }).then(function(userFound){
                    done(null, userFound);
                }).catch(function (err) {
                    return res.status(500).json({ 'error': 'On ne peut pas déterminer si l\'utilisateur existe. ' });
                });
            },
            function(userFound, done){
                if(!userFound){
                    bcrypt.hash(password, 5, function(err, bcryptedPassword){
                        done(null, userFound, bcryptedPassword);
                    })
                } else {
                    return res.status(409).json({ 'error': 'L\'utilisateur existe.' })
                }
            },
            function(userFound, bcryptedPassword, done){
                models.User.create({
                    email: email,
                    username: username,
                    password: bcryptedPassword,
                    bio: bio,
                    isAdmin: 0
                }).then(function (newUser) {
                    done(null, newUser);
                }).catch(function (err) {
                    return res.status(500).json({ 'error': 'On ne peut pas ajouter cet utilisateur.' });
                })
            },
            function(newUser){
                if(newUser){
                    return res.status(201).json({
                        'userId': newUser.id,
                        'email': newUser.email
                    })
                }else{
                    return res.status(500).json({ 'error': 'On ne peut pas ajouter cet utilisateur.' });
                }
            }
        ])
    },
    
    login: function(req, res){

        var email = req.body.email;
        var password = req.body.password;

        if(email == null || password == null){
            return res.status(400).json({ 'error': 'paramètres manquants' });
        }

        asyncLib.waterfall([
            function(done) {
                models.User.findOne({
                    where: { email: email }
                }).then(function (userFound) {
                    done(null, userFound);
                }).catch(function (err) {
                    return res.status(500).json({ 'error': 'Impossible de vérifier l\'utilisateur.' });
                })
            },
            function(userFound, done){
                if(userFound){
                    bcrypt.compare(password, userFound.password, function(errBycrypt,resBycrypt){
                        done(null, userFound, resBycrypt);
                    })
                } else {
                    return res.status(404).json({ 'error': 'Il n\'existe pas d\'utilisateur avec cet identifiant' });
                }
            },
            function(userFound, resBycrypt){
                if(resBycrypt){
                    return res.status(200).json({
                        'userId': userFound.id,
                        'email': userFound.email,
                        'token': jwtUtils.generateTokenForUser(userFound)
                    });
                } else {
                    return res.status(403).json({ 'error': 'Password invalide' });
                }
            }
        ])
    },
    getUserProfile: function(req, res){
        var headerAuth = req.headers['authorization'];
        var userId     = jwtUtils.getUserId(headerAuth);

        if(userId < 0 ){
            return res.status(400).json({ 'error':'Problème avec le token...'});
        }
        asyncLib.waterfall([
            function(done){
                models.User.findOne({
                    attributes: ['id', 'email', 'username', 'bio'],
                    where: {id: userId},
                }).then(function(user){
                    done(null, user);
                }).catch(function(err){
                    return res.status(500).json({ 'error': 'Utilisateur introuvable...'});
                })
            },
            function(user){
                if(user){
                    res.status(200).json(user);
                }else{
                    return res.status(404).json({ 'error': 'Utilisateur non trouvé ...'});
                }
            }
        ])
    },
    updateUserProfile: function(req, res){

        var headerAuth = req.headers['authorization'];
        var userId = jwtUtils.getUserId(headerAuth);

        var username = req.body.username;
        var bio = req.body.bio;

        if (userId < 0) {
            return res.status(400).json({ 'error': 'Problème avec le token...' });
        }

        asyncLib.waterfall([
            function (done) {
                models.User.findOne({
                    attributes: ['id', 'username', 'bio'],
                    where: {id: userId}
                }).then(function (user) {
                    done(null, user);
                }).catch(function (err) {
                    return res.status(500).json({ 'error': 'Utilisateur introuvable...' });
                })
            },
            function (user, done) {
                if(user){
                    user.update({
                        username: (username ? username : user.username),
                        bio: (bio ? bio : user.bio)
                    }).then(function (user){
                        done(null, user);
                    }).catch(function (err){
                        return res.status(500).json({ 'error': 'Erreur dans la mise à jour...'});
                    })
                } else {
                    return res.status(404).json({ 'error': 'Utilisateur non trouvé ...' });
                }
            },
            function (user){
                if (user) {
                    res.status(201).json(user);
                } else {
                    return res.status(500).json({ 'error': 'On ne peut pas mettre à jour l\'utilisateur ...' });
                }
            }
        ])
    }
}