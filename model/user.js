const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const passportLocalMongoose = require('passport-local-mongoose');
const validate = require('mongoose-validator');

var passwordValidator = [
  validate({
    validator: 'isLength',
    arguments: [6, 64],
    message: 'El password debe ser de una longitud mayor a 6 carácteres'
  })
]

var UserSchema = mongoose.Schema({
    username: {type: String, required: true}, // USERNAME
    password: {type: String, required: true, validate: passwordValidator}, // PASSWORD
    email: {type: String, required: true}, // USER EMAIL
    status: {verified:{type: Boolean, default: false}, token: String}, // VERIFY EMAIL
    resetPasswordToken: {type: String},
    resetPasswordExpires: {type: Date},
    name: {type: String},
    lastname: {type: String},
    created_at: {type: Date, default: Date.now}
});
var User = module.exports = mongoose.model('User', UserSchema);

//User.plugin(passportLocalMongoose);
module.exports.create = function(newUser, callback) {
  bcrypt.genSalt(8, function(err, salt) {
    console.log('genSalt', salt, err)
    bcrypt.hash(newUser.password, salt, null, function(err, hash) {
      console.log("Entre modelo");
      newUser.password = hash;
      newUser.save(callback);
    });
  });
};

module.exports.updateInfo = function(user, params, callback){
  var u = user.user;
  var p = params.params;
  if(u.username !== p.username){
    u.username = p.username;
  } if(u.name !== p.name){
    u.name = p.name;
  } if(u.lastname !== p.lastname){
    u.lastname = p.lastname;
  } if(u.email !== p.email){
    u.email = p.email;
    u.estatus = {token: userHelper.generateToken(), verified: false};
  }
  User.findOne({username: u.username}, function(data){
    u.save(callback);
  });
};

module.exports.updatePassword = function(user,newPassword, callback){
  bcrypt.genSalt(8, function(err, salt){
    bcrypt.hash(newPassword, salt, null, function(err,hash){
      if(err){
        console.log("Error en hash of new password");
        callback(null, err);
      } else {
        user.password = hash;
        user.save(callback);
      }
    })
  })
}

module.exports.getUserByUsername = function(username, callback){
  var query = {username: username};
  User.findOne(query,callback);
};

module.exports.getUserByEmail = function(email,callback){
  var query = {email: email};
  User.findOne(query, callback);
};

module.exports.getUserById = function(id,callback){
  User.findById(id, callback);
};

module.exports.comparePasswords = function(password, hash, callback){
  bcrypt.compare(password,hash,function(err,isMatch){
    if (err) {
      callback(null, null);
      console.log("Error comparando password");
    } else {
      callback(null, isMatch);
    }
  });
};
module.exports.createPasswordToken = function(user, callback){
  User.findById(user._id, function(err, user){
    if (err) return console.log("Error createPasswordToken: " + err);
    if(user){
      crypto.randomBytes(20, function(err, buf){
        var token = buf.toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        user.save();
        callback(user);
      });
    }
  });
}

module.exports.verifyPasswordToken = function(resetPasswordToken, callback){
  var query = {resetPasswordToken: resetPasswordToken, resetPasswordExpires:{$gt: Date.now()}}
  User.findOne(query, function(err, user){
    if(err) return callback(err,null);
    if(user){
      callback(null, user);
    }
  });
}

module.exports.changeStatus = function(user, callback) {
  var query = {username: user.username};
  User.findOne(query, function(err, user) {
    if (err) return err;
    user.estatus.verified = true;
    user.save();
    callback(user);
  });
};
