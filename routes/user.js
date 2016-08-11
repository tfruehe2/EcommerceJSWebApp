var router = require('express').Router();
var User = require('../model/user');
var Cart = require('../model/cart');
var async = require('async');
var passport = require('passport');
var passportConfig = require('../config/passport');

router.get('/login', function(req, res) {
  if (req.user) {return res.redirect('/'); }
  res.render('accounts/login', { message: req.flash('message')});
});

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/profile', passportConfig.isAuthenticated, function(req, res, next) {
  User
    .findOne({_id: req.user._id})
    .populate('history.item')
    .exec(function(err, user) {
      if (err) {throw err;}
      res.render('accounts/profile');
    });
  });

router.get('/signup', function(req,res,next) {
  res.render('accounts/signup', {
    errors: req.flash('errors')
  });
});

router.post("/signup", function(req,res,next) {

  async.waterfall([
    function(callback) {
      var user = new User();
      user.profile.name = req.body.name;
      user.profile.image = user.gravatarFunction();
      user.email = req.body.email;
      user.password = req.body.password;

       User.findOne({ email: req.body.email }, function(err, existingUser) {
         if (existingUser) {
           req.flash('errors', 'account with this email address already exists');
           return res.redirect('/signup');
         } else {
            user.save(function(err, user) {
              if (err) {throw err;}
              callback(null, user);
            });
         }
       });
    },

    function(user) {
      var cart = new Cart();
      cart.owner = user._id;
      cart.save(function(err) {

        if (err) {throw err;}
        req.logIn(user, function(err) {
          if (err) {throw err;}
          res.redirect('/profile');
        });
      });
    }
  ]);
});

router.get("/logout", function(req, res, next) {
  req.logout();
  res.redirect('/');
});

router.get('/edit-profile', function(req, res, next) {
  res.render('accounts/edit-profile',{ message: req.flash('success')});
});

router.post('/edit-profile', function(req, res, next) {
  User.findOne({ _id: req.user._id }, function(err,user) {
    if (err) {throw err;}
    if (req.body.name) {user.profile.name = req.body.name;}
    if (req.body.address) {user.address = req.body.address;}

    user.save(function(err) {
      if (err) {throw err;}
      req.flash('success',"Successfully edited your profile");
      return res.redirect('/edit-profile');
    })
  })
})
module.exports = router;
