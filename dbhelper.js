
var get = function (collection, uid, callback){
  var args = Array.prototype.slice.call(arguments, 1);
  callback = typeof args[args.length - 1] == 'function' ? args.pop() : null;
  if (typeof uid != 'string'){
    collection.findOne({_id: uid}, callback);
  }else{
    collection.findOne({sid: uid}, callback);
  }
}

var getAll = function(collection, callback){
  collection.find().toArray(callback);
}

var update = function (collection, doc, callback){
  if (doc.id != null){
    collection.update({"_id": doc.id}, doc, {upsert: true}, callback);
  }else{
    collection.update({sid: doc.sid}, doc, {upsert: true}, callback);
  }
}

exports.updateQueue = function(db, uid, callback){
  var collection = db.collection('queue');
  update(collection, {"_id:uid"}, callback);
}

exports.getQueue = function(db, callback){
  var collection = db.collection('queue');
  getAll(collection, callback);
}

exports.updateTest = function (db, doc, callback){
  var collection = db.collection('test');
  update(collection, doc, callback);
}

exports.getTest = function (db, uid, callback){
  var collection = db.collection('test');
  get(collection, uid, callback);
}

exports.getUser = function (db, uid, callback){
  var collection = db.collection('users');
  get(collection, uid, callback);
}

exports.updateUser = function (db, userDoc, callback){
  var collection = db.collection('users');
  update(collection, userDoc, callback);
}

exports.getSwarmBot = function (db, uid, callback){
  var collection = db.collection('bots');
  get(collection, uid, callback);
}

exports.updateSwarmBot = function(db, swarmDoc, callback){
  var collection = db.collection('bots');
  update(collection, swarmDoc, callback);
}

exports.getSwarmBots = function(db, callback){
  var collection = db.collection('bots');
  getAll(collection, callback);
}




