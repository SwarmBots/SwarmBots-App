
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , rem = require('rem')
  , path = require('path');


var MongoClient = require('mongodb').MongoClient;

var fb = rem.connect('facebook.com').configure({
  'key': process.env.FB_SWARMBOTS_ID,
  'secret': process.env.FB_SWARMBOTS_SECRET
});


var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
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

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Create the OAuth interface.
var oauth = rem.oauth(fb, "http://swarmbots.herokuapp.com/oauth/callback/");

// oauth.middleware intercepts the callback url that we set when we
// created the oauth middleware.
app.use(oauth.middleware(function (req, res, next) {
  console.log("User is now authenticated.");
  res.redirect('/');
}));



app.get('/', function (req, res) {
  var user = oauth.session(req);
  console.log(user);
  bots = ["bot1": {"name": "charles", "users": [{"name":"Evan"}, {"name": "Slater"}]}]
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
app.get('/test', function(){ 
    fb('evan.simpson15').get(function (err, json) {
      console.log('My profile:', json);
  });
});

app.get('/login/', oauth.login());

// Logout URL clears the user's session.
app.get('/logout/', oauth.logout(function (req, res) {
  res.redirect('/');
}));


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
