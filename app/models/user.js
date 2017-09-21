var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,

  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      console.log('user: ', model.get('username'));
      console.log('password: ', model.get('password'));

    });
  },
});

module.exports = User;
