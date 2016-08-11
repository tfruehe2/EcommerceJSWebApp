var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var Schema = mongoose.Schema;


var UserSchema = new Schema({
  email:{type: String, unique: true, lowercase: true},
  password: String,

  profile: {
    name: {type: String, default: ''},
    image: {type: String, default: ''}
  },
  address: String,
  history:[{
    date: {type: Date, default: Date.now() },
    paid: {type: Number, default: 0},
    item: {type: Schema.Types.ObjectId, ref: 'Product'}
  }]
});

UserSchema.pre('save', function(next){
  var user = this;
  if(!user.isModified('password')) return next();

  bcrypt.genSalt(10, function(err, salt) {
    if (err) {throw err};
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) {throw err};
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function(password) {
  return bcrypt.compareSync(password, this.password);
}

UserSchema.methods.gravatarFunction = function(size) {
  if (!this.size) {size = 200;}
  if (!this.email) {return "https://gravatar.com/avatar/?s" + size + "&d=retro";}

  var md5 = cryto.createHash('md5').update(this.email).digest('hex');
  return "https://gravatar,com/avatar/" + md5 + "?s=" + size + "&d=retro";
}

module.exports = mongoose.model('User', UserSchema);
