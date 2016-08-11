var express = require('express');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var ejsMate = require('ejs-mate');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');
var MongoStore = require('connect-mongo/es5')(session);
var passport = require('passport');
var cartMiddleware = require('./middleware/middleware');
//Schemas
var User = require('./model/user');
var Category = require('./model/category');
//Routes
var mainRoutes = require('./routes/main');
var userRoutes = require('./routes/user');
var adminRoutes = require('./routes/admin');
var apiRoutes = require('./api/api');

var secret = require('./config/secret');


var app = express();
mongoose.connect(secret.database, function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log('connected to DB')
  }
});

//middleware
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:true }));
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secret.secretKey,
  store: new MongoStore({ url: secret.database, autoReconnect: true })
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res,next) {
  res.locals.user = req.user;
  next();
});
app.use(cartMiddleware);
app.use(function(req,res,next) {
  Category.find({}, function(err, categories) {
    if (err) {throw err;}
    res.locals.categories = categories;
    next();
  });
});
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.use(mainRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use('/api',apiRoutes)



app.listen(secret.port, function(err){
  if (err) {throw err;}
  console.log("server is running");
});
