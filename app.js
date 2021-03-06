
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , rem = require('rem')
  , clarinet = require('clarinet')
  , carrier = require('carrier')
  , mongo = require('./dbhelper')
  , path = require('path');
var MongoClient = require('mongodb').MongoClient;
var app = express();

MongoClient.connect(process.env.SWARMBOTS_MONGO_URI, function (err, db){ 

  app.configure(function(){
    app.set('port', process.env.PORT || 4000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
  });

  app.configure('development', function () {
    app.set('host', 'localhost:' + app.get('port'));
    app.use(express.errorHandler());
  });

  app.configure('production', function () {
    app.set('host', process.env.HOST);
  });

  var fb = rem.connect('facebook.com').configure({
    'key': process.env.FB_SWARMBOTS_ID,
    'secret': process.env.FB_SWARMBOTS_SECRET,
    'scope': ["user_location","friends_location"]
  });

  // Create the OAuth interface.
  var fboauth = rem.oauth(fb, "http://"+ app.get('host') +"/oauth/callback/");

  app.get('/login/', fboauth.login());

  // oauth.middleware intercepts the callback url that we set when we
  // created the oauth middleware.
  app.use(fboauth.middleware(function (req, res, next) {
    console.log("User is now authenticated.");
    res.redirect('/');
  }));


  app.get('/', function (req, res) {
    var user = fboauth.session(req);
    mongo.getQueue(db, function (err, queue) {
      console.log(queue.meta);
      if (!user) {
        res.render('home', {name: null, loggedin: "false", title: "SwarmBots Home", users:queue.meta.reverse()});
        return;
      }
      user('me').get({'fields':'id,name,picture,location'}, function (err, json) {
        json['sid'] = json.id;
        json['type'] = 'fb';
        console.log(json);
        console.log(err);
        mongo.updateUser(db, json, function(){
          res.render('home', {name: json.name, loggedin: "true", title: "SwarmBots Home", users:queue.meta.reverse()});
        });     
      });
    });
  });

  // Logout URL clears the user's session.
  app.get('/logout/', fboauth.logout(function (req, res) {
    res.redirect('/');
  }));

  app.post('/submit', function (req, res){
    var user = fboauth.session(req);
    user('me').get({'fields':'id,name,picture,location'}, function (err, json){
      console.log(err, json);

      mongo.getQueue(db, function (err, queue){
        if(queue.people.indexOf(json.id) > -1){
          mongo.getSwarmBots(db, function (err, bots){
            res.render('includes/queue', {users:queue.meta.reverse()});
          });
        }else{
          queue.people.push(json.id);
          queue.meta.push({name: json.name, photo: json.picture.data.url, location: (json.location||{}).name, sid:json.id})
          mongo.updateQueue(db, queue, function (){
            res.render('includes/queue', {users:queue.meta.reverse()});
          });;
        }
      });
    });
  });

  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on http://"+app.get('host'));
  });
});