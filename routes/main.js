var router = require('express').Router();
var Product = require('../model/product');
var User = require('../model/user');
var Cart = require('../model/cart');
var stripe = require('stripe')('sk_test_s7Rf7N0mzYnGwpP9bY9dp9E1');
var async = require('async');

var paginate = function(req,res,next) {
    var perPage = 9;
    var page = req.params.page;
    Product
      .find()
      .skip( perPage * (page - 1) )
      .limit( perPage )
      .populate('category')
      .exec(function(err, products) {
        if (err) {throw err;}
        Product.count().exec(function(err, count) {
          if (err) throw err;
          res.render('main/product-main', {
            products: products,
            pages: count / perPage
          });
        });
      });
};

Product.createMapping(function(err, mapping) {
  if (err) {throw err;}
  console.log("mapping completed");
  console.log(mapping);
});

var stream = Product.synchronize();
var count = 0;

stream.on('data', function(){
  count++;
});
stream.on('close', function(){
  console.log("indexed " + count)
});
stream.on('error', function(err){
  console.log(err);
});

router.get('/cart', function(req,res,next) {
  Cart
    .findOne({owner: req.user._id})
    .populate('items.item')
    .exec(function(err, foundCart) {
      if (err) {throw err;}
      res.render('main/cart', {
        foundCart: foundCart,
        message: req.flash('remove')
      });
    });
});

router.post('/product/:product_id', function(req,res,next) {
  Cart.findOne({ owner: req.user._id}, function(err, cart) {
    cart.items.push({
      item: req.body.product_id,
      price: parseFloat(req.body.priceValue),
      quantity: parseInt(req.body.quantity)
    });

    cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2)

    cart.save(function(err) {
      if (err) {throw err;}
      res.redirect('/cart');
    });
  });
});

router.post("/remove", function(req,res,next) {
  Cart.findOne({ owner: req.user._id}, function(err, foundCart) {
    if (err) {throw err;}
    foundCart.items.pull(String(req.body.item));
    foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);
    foundCart.save(function(err) {
      if (err) {throw err;}
      req.flash('remove', "Successfully removed item(s)");
      res.redirect('/cart');
    });
  });
});

router.post("/search", function(req,res,next) {
  res.redirect('/search?q=' + req.body.q);
});

router.get("/search", function(req,res,next) {
  if (req.query.q) {
    Product.search({
      query_string: {query: req.query.q }
    }, function(err, results) {
      if (err) {throw err;}
      var data = results.hits.hits.map(function(hit) {
        console.log(hit);
        return hit;
      });
      res.render('main/search-result', {
        query: req.query.q,
        data: data
      });
    });
  }
});

router.get("/", function(req, res, next) {
  if(req.user) {
    paginate(req, res, next);
  } else {
    res.render('main/home');
  }
});

router.get("/page/:page", function(req, res, next) {
  paginate(req,res,next);
});

router.get("/about", function(req, res) {
  res.render('main/about');
});

router.get("/products/:id", function(req, res, next) {
  Product
      .find({ category: req.params.id})
      .populate('category')
      .exec(function(err, products) {
        if (err) {throw err;}
        res.render('main/category', {products: products});
      });
});

router.get('/product/:id', function(req,res, next) {
  Product.findById({_id: req.params.id }, function(err, product) {
    if (err) {throw err;}
    res.render('main/product', { product: product});
  });
});

router.post('/payment', function(req,res,next) {
  var stripeToken = req.body.stripeToken;
  var currentBill = Math.round(req.body.stripeCharges * 100);
  stripe.customers.create({
    source: stripeToken,
  }).then(function(customer) {
    return stripe.charges.create({
      amount: currentBill,
      currency: 'usd',
      customer: customer.id
    });
  }).then(function(charge) {
    async.waterfall([
      function(callback) {
        Cart.findOne({ owner: req.user._id}, function(err, cart) {
          callback(err, cart);
        });
      },
      function(cart, callback) {
        User.findOne({ _id: req.user._id }, function(err, user) {
          if (user) {
            for( var i = 0; i < cart.items.length; i++) {
              user.history.push({
                item: cart.items[i].item,
                paid: cart.items[i].price
              });
            }
            user.save(function(err, user) {
              if (err) {throw err;}
              callback(err, user);
            });
          }
        });
      },
      function(user) {
        Cart.update({owner: user._id }, { $set:{ items: [], total: 0}}, function(err, update) {
          if (update) {
            res.redirect('/profile')
          }
        });
      }
    ]);
  });
});

module.exports = router;
