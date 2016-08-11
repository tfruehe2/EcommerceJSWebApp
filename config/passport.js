var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');
var User = require('../model/user');

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err,user);
  });
});

passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqCallback: true
}, function(email, password, done) {
  console.log(email);
  User.findOne( { email: email }, function(err, user) {
    if (!user) {
      return done(null, false, {message: 'A user with this email does not exist.'});
    }

    if (!user.comparePassword(password)) {
      return done(null, false, {message: 'Oops! the username and password do not match.'});
    }
    return done(null, user);
  });
}));

exports.isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login');
};
