var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: "users",
  hasTimestamps: true,

  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      console.log('user: ', model.get('username'));
      console.log('password: ', model.get('password'));
      // var shasum = crypto.createHash('sha1');
      // shasum.update(model.get('password'));
      // model.set('code', shasum.digest('hex').slice(0, 10));
    });
  }
});

module.exports = User;
