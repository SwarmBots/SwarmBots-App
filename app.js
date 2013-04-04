
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

var fb = rem.connect('facebook.com').configure({
  'key': process.env.FB_SWARMBOTS_ID,
  'secret': process.env.FB_SWARMBOTS_SECRET
});

var tw = rem.connect('twitter.com', 1.0).configure({
  'key': process.env.TW_SWARMBOTS_KEY,
  'secret': process.env.TW_SWARMBOTS_SECRET
});

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

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Create the OAuth interface.
var oauth = rem.oauth(fb, "http://swarmbots.herokuapp.com/oauth/callback/");
var twoauth = rem.oauth(tw, "http://swarmbots.herokuapp.com/oauth/callback/")

// oauth.middleware intercepts the callback url that we set when we
// created the oauth middleware.
app.use(oauth.middleware(function (req, res, next) {
  console.log("User is now authenticated.");
  res.redirect('/');
}));
app.use(twoauth.middleware(function (req, res, next){
  console.log("Twauthenticated.")
  res.redirect('/');
}));

// Save the user session as req.user.
app.all('/*', function (req, res, next) {
  req.twitter = twoauth.session(req);
  req.facebook = oauth.session(req);
  console.log('app.all - req.facebook: ', req.facebook)
  console.log('app.all - req.twitter: ', req.twitter)
  next();
});


app.get('/', function (req, res) {
  var user = oauth.session(req);
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
app.get('/test', function(){ 
    fb('evan.simpson15').get(function (err, json) {
      console.log('My profile:', json);
  });
});

app.get('/stream', function (req, res){
  var user = twoauth.session(req);
  user.stream('statuses/filter').get({track:"#SwarmBots"},function(err, stream, three) {
    carrier.carry(stream, function(line){
      var line = JSON.parse(line);
      //Filter DELETE requests from stream
      if (!line.delete){
        console.log(line.text);
      }
    });
  });
});


app.get('/login/', oauth.login());
app.get('/twoauth/', twoauth.login());

// Logout URL clears the user's session.
app.get('/logout/', oauth.logout(function (req, res) {
  res.redirect('/');
}));


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
