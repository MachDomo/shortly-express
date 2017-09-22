var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
//added cookie parser and session
// app.use(express.cookieParser());
app.use(session({
  secret: 'shaken not stirred',
  resave: false,
  saveUninitialized: true
}));




let checkUser = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access Denied';
    res.redirect('/login');
  }
};




app.get('/', checkUser, function(req, res) {
  res.render('index');
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/create', checkUser,
  function(req, res) {
    res.render('index');
  });

app.get('/links', checkUser,
  function(req, res) {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  });

app.get('/signup',
  function(req, res) {
    res.render('signup');
  });

app.post('/login',
  function(req, res) {
    //console.log('req body ******* ', req.body);
    var username = req.body.username;
    var password = req.body.password;


    new User({ username: username }).fetch().then(function(model) {
      if (model) {


        bcrypt.compare(password, model.get('password'), function(err, correctPass) {
          if (err) {
            console.log('wrong password');
          }

          if (correctPass) {
            req.session.regenerate(function() {
              req.session.user = username;
              res.redirect('/');
            });
          } else {
            console.log('invalid password');
            res.redirect('/login');
          }
        });


        // .then(function(err, res) {
        //   if (res) {
        //     req.session.regenerate(function() {
        //       req.session.user = username;
        //       res.redirect('/');
        //     });
        //   } else {
        //     console.log('invalid password');
        //     res.redirect('/login');
        //   }
        // });
      } else {
        console.log('invalid username or password');
        res.redirect('/login');
      }
    });
  });

app.post('/links',
  function(req, res) {
    var uri = req.body.url;

    if (!util.isValidUrl(uri)) {
      console.log('Not a valid url: ', uri);
      return res.sendStatus(404);
    }

    new Link({ url: uri }).fetch().then(function(found) {
      if (found) {
        res.status(200).send(found.attributes);
      } else {
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.sendStatus(404);
          }

          Links.create({
            url: uri,
            title: title,
            baseUrl: req.headers.origin
          })
            .then(function(newLink) {
              res.status(200).send(newLink);
            });
        });
      }
    });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup',
  function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    bcrypt.genSalt(4, function(err, salt) {
      bcrypt.hash(password, salt, null, function(err, hash) {
        if (err) {
          throw err;
        }

        password = hash;


        new User({ username: username })
          .fetch()
          .then(function(user) {
            if (!user) {
              new User({ username: username, password: password }).save()
                .then(function(user) {
                  req.session.regenerate(function() {
                    req.session.user = username;
                    res.redirect('/');
                  });

                });
            } else {
              console.log('Account already exists');
              console.log(user);
              res.redirect('/signup');
            }
          });
      });
    });
  });






app.get('/logout',
  function(req, res) {
    req.session.destroy(function(err) {
      if (err) {
        throw (err);
      }

    });
    res.redirect('/login');
  });


// req.session.destroy(function (err) {
//   if (err) return next(err)
//   res.redirect('/blah')
// })

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
