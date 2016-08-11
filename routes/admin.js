var router = require('express').Router();
var Category = require('../model/category');

router.get('/add-category', function(req,res, next) {
  res.render('admin/add-category', {message: req.flash('success')});
});

router.post('/add-category', function(req,res,next) {
  var category = new Category();
  category.name = req.body.name;

  category.save(function(err) {
    if (err) {throw err;}
    req.flash('success', "new category successfully created");
    return res.redirect('/add-category');
  });
});

module.exports = router;
