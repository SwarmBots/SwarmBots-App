
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
  , path = require('path');
var MongoClient = require('mongodb').MongoClient;
var app = express();

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
  'secret': process.env.FB_SWARMBOTS_SECRET
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

// Save the user session as req.user.
app.all('/*', function (req, res, next) {
  req.facebook = fboauth.session(req);
  next();
});


app.get('/', function (req, res) {
  var user = fboauth.session(req);
  console.log(user);
  bots = [{"name": "Bot 1", "queue": [{"name":"Evan"}, {"name": "Slater"}]},{"name":"Bot 2", "queue":[{"name":"Adela"},{"name":"Dara"}]}]
  if (!user) {
    res.render('home', {name: null, loggedin: "false", title: "SwarmBots Home"});
    return;
  }
  user('me').get(function (err, json) {
    console.log(json);
    res.render('home', {name: json.name, loggedin: "true", title: "SwarmBots Home"});
  });
});



app.get('/users', user.list);


// Logout URL clears the user's session.
app.get('/logout/', fboauth.logout(function (req, res) {
  res.redirect('/');
}));


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on http://"+app.get('host'));
});
