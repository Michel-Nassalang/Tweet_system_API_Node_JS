var express = require('express');
var userCtrl = require('./routes/userCtrl');
var messageCtrl = require('./routes/messageCtrl');
var likeCtrl = require('./routes/likeCtrl');

exports.router = (function(){
    var apiRouter = express.Router();

    // Users routes
    apiRouter.route('/users/register/').post(userCtrl.register);
    apiRouter.route('/users/login/').post(userCtrl.login);
    apiRouter.route('/users/compte/').get(userCtrl.getUserProfile);
    apiRouter.route('/users/update/').put(userCtrl.updateUserProfile);
    
    // Messages routes
    apiRouter.route('/messages/post/').post(messageCtrl.createMessage);
    apiRouter.route('/messages/list/').get(messageCtrl.listMessages);
    apiRouter.route('/messages/delete/').delete(messageCtrl.deleteMessage);
    apiRouter.route('/messages/user/').get(messageCtrl.listMessagesForUser);
    
    // Likes routes
    apiRouter.route('/message/vote/like/').post(likeCtrl.likePost);
    apiRouter.route('/message/vote/dislike/').post(likeCtrl.dislikePost);

    return apiRouter;
})();