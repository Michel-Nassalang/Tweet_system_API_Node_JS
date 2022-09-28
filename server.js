// Importations 
var express = require('express');
var bodyParser = require('body-parser'); 
var apiRouter = require('./apiRouter').router;

// Initialisations
var server = express();
global.__basedir = __dirname;

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

// Configuration de routes
server.get('/', function(req, res){
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send("<h1>Bonjour je suis le serveur en écoute...</h1>");
});

server.use('/api/',apiRouter);

server.listen(3000, function(){
    console.log("Serveur en marche :)");
});