var Validator = require('validator').Validator;


/**
 * Client ctor
 * Use ctor methods to find or remove clients
 * Use instances to validate and create/update clients
 *
 * @param {Object} attrs
 * @param {String} id
 * @return {Client}
 * @api public
 */

var Client = exports.Client = function(attrs, id) {
  this.id = id;
  this.attrs = attrs;
  this.validator = new Validator();
  this.errors = {};
}


/*
 * Valid input
 */

Client.attrs = {
    title: 'title'
  , email: 'email'
  , dateOfBirth: 'dateOfBirth'
  , company: 'company'
};


/**
 * Find clients
 *
 * @param {Object} options
 * @param {Function} cb
 * @return {Array}
 * @api public
 */

Client.find = function(options, cb) {
  var filters = options.filters
    , sort = options.sort
    , search = options.search
    , paginate = options.page
    , limit = paginate.perPage
    , skip = (paginate.page-1) * limit
    , re;

  // best WORST ideea ever-don't do that in prod
  // not safe to get a user text and make it a regex
  // Better ideea is to use a _keyword key populated
  // with all the words from selected attributes and 
  // search by word, but what the hack...it works for now.
  // Best ideea is to use a full-text-search module.
  if (search != null) {
    re = new RegExp(search);
    filters.$or = [{title: re}, {email: re}, {company: re}];
  }
  this.collection.find(filters, {sort: sort, skip: skip, limit: limit}).toArray(cb);
};

/**
 * Find one client
 *
 * @param {String} id
 * @param {Function} cb
 * @return {Object}
 * @api public
 */

Client.get = function(id, cb) {
  var id = this.collection.id(id);
  this.collection.findOne({_id: id}, cb);
};


/**
 * Get clients count
 *
 * @param {Function} cb
 * @return {Object}
 * @api public
 */

Client.count = function(cb) {
  this.collection.count(function(err, result){
    cb.call(this, err, {count: result});
  });
};


/**
 * Remove a client and returns it
 *
 * @param {String} id
 * @param {Function} cb
 * @return {Object}
 */

Client.remove = function(id, cb) {
  var id = this.collection.id(id);
  this.collection.findAndRemove({_id: id}, [], {safe: true}, cb);
};


/**
 * Validate the client
 *
 * @return {Boolean}
 */

Client.prototype.validate = function() {
  var attrs = Client.attrs
    , email = attrs.email
    , title = attrs.title
    , dateOfBirth = attrs.dateOfBirth
    , company = attrs.company;

  this.check(title, 'Title is required').notEmpty();
  email in this.attrs && this.check(email).isEmail();
  dateOfBirth in this.attrs && this.check(dateOfBirth).isDate();
  company in this.attrs && this.check(company).notEmpty();
  if (this.hasErrors()) return false;
  return true;
};


/**
 * Validate a client's attribute
 *
 * @param {String} attr
 * @param {String} msg
 * @return {Validator}
 */

Client.prototype.check = function(attr, msg) {
  var self = this; 
  this.validator.error = function(msg) { self.errors[attr] = msg; return this; }
  return this.validator.check(this.attrs[attr], msg);
};


/**
 * Save the client
 * If there's no id create the client, 
 * otherwise find the client by id and update it
 *
 * @param {Function} cb
 * @return {Object}
 */

Client.prototype.save = function(cb) { 
  if (!this.id) return Client.collection.save(this.attrs, {safe: true}, cb);
  var id = Client.collection.id(this.id);
  Client.collection.findAndModify({_id: id}, [], {$set: this.attrs}, {new: true}, cb);
};


/**
 * Check for validation errors
 *
 * @return {Boolean}
 */

Client.prototype.hasErrors = function() {
  return !! Object.keys(this.errors).length;
};

/**
 * Image ctor
 * 
 * @param {Object} attrs
 * @return {Image}
 */

var Image = exports.Image = function(attrs) {
  this.attrs = attrs;
}

/**
 * Save an image
 *
 * @param {Function} cb
 * @return {Object}
 */

Image.prototype.save = function(cb) { 
  if (!this.id) {
    return Image.collection.insert(this.attrs, {safe: true}, function(err, img) {
      img = img[0];
      delete img.path;
      cb.call(this, err, img);
    });
  }
};

/**
 * Find one image
 *
 * @param {String} id
 * @param {Function} cb
 * @return {Object}
 */

Image.get = function(id, cb) {
  var id = this.collection.id(id);
  this.collection.findOne({_id: id}, cb);
};
