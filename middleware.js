var Client = require('./models').Client
  , Image = require('./models').Image
  , error = require('./utils').error
  , toArray = require('./utils').toArray
  , format = require('./utils').format
  , exec = require('child_process').exec
  , path = require('path');

/**
 * Client query map
 */

var queries = {
    sort     : 'sort'
  , page     : 'page'
  , search   : 'search'
};

/**
 * Valid sort order values
 */

var sortOrder = ['asc', 'desc'];

/**
 * Valid client input
 */

var validAttrs = Object.keys(Client.attrs);

/**
 * No more than 50 clients per page
 */

var perPageLimit = 50;

/**
 * Validation messages
 */

var errors = {
    page    : 'Invalid page value: %s. Use a number >= 1'
  , perPage : 'Invalid perPage value: %s. Use a number <= ' + perPageLimit
  , attr    : 'Invalid attribute: %s. Valid attributes: ' + validAttrs.join('|')
  , sort    : 'Invalid sort key: %s. Valid keys: ' + validAttrs.join('|')
  , order   : 'Invalid sort order value: %s. Valid values: ' + sortOrder.join('|')
  , filter  : 'Invalid filter: %s. Valid filters: ' + validAttrs.join('|')
};

/**
 * Middleware for getting an image from db
 * and copying it from tmp location to public
 * location.
 */

function getImage(req, res, next) {
  var imageId = req.body.imageId;
  delete req.body.imageId;
  if (imageId == null)  return next();
  Image.get(imageId, function(err, image) {
    if (err) return next(error(500, 'Server error'));
    if (!image) return next(error(404, 'Image not found'));

    var imageName = path.basename(image.path)
       ,newPath = __dirname + '/public/img/clients/' + imageName;

    exec('cp -rf ' + image.path + ' ' + newPath, function(err, stdin, stdout){
      if (err) return next(error(500, 'Server error'));
      req.image = {
          src: '/img/clients/' + imageName
        , mime: image.mime
        , size: image.size
      };
      next();
    });
  });
}

/**
 * Middleware for checking client attributes 
 */

function checkAttrs(req, res, next) {
  var attrs = validAttrs.concat('imageId');
  Object.keys(req.body).forEach(function(a) {
    check(a, attrs, format(errors.attr, a));
  });
  next();
}

/**
 * Middleware for collecting client search, sort, pagination and filters queries
 * Expose req.clientQueries to next middlewares
 *
 * Search query:
 *  ?search=term
 *
 * Sort query (default order is asc):
 *  ?sort=title,dateOfBirth:desc,company:asc
 *
 * Pagination query (default perPage is 50):
 *  ?page=1:50
 *  ?page=2
 *
 * Filter queries (based on Client attributes):
 *  ?title=sometitle&company=somecompany
 *
 * All queries are checked for valid values otherwise a 400 error will be thrown.
 *
 * RARE CASE SCENARIOUS:
 * In case you have filter names that conflict with 'sort', 'search', or 'page'
 * you can prepend them with _.  This shouldn't occur too often though 
 * but it's a nice feature to have.
 *
 * ?sort=title&search=term&_sort=value&_search=value
 *
 * where _sort and _search are actually the filters sort and search.
 *
 * In the rarest case possible, if you have a filter named _sort, just prepend it
 * with _ and it will look like __sort. :)
 *
 */

function getQueries(req, res, next) {
  var query = req.query;
  req.clientQueries = {
    sort: parseSort(query[queries.sort]),
    page: parsePaginate(query[queries.page]),
    search: query[queries.search],
    filters: parseFilters(query)
  };
  next();
}

/**
 * Parse sort query to key the sort keys and their order.
 * ?sort=key:order,key:order ... and so on
 * 
 * By default order is asc so you can skip the order key.
 * ?sort=key,key ... and so on
 *
 * @param {String} str
 * @return {Array}
 */

function parseSort(str) {
  // sort by _id desc to return last n
  if (!str) return [['_id', 'desc']];
  var result = {};
  str.split(',').forEach(function(s) {
    kv = parseKeyValue(s, 'asc');
    var attr = kv.key
      , order = kv.value;
    check(attr, validAttrs, format(errors.sort, attr));
    check(order, sortOrder, format(errors.order, order));
    result[attr] = order;
  });
  return toArray(result);
}

/**
 * Parse page query
 *
 * @param {String} str
 * @return {Object}
 */

function parsePaginate(str) {
  var page = 1
    , perPage = perPageLimit
    , kv;

  if (!str) return {page: page, perPage: perPage};

  kv = parseKeyValue(str, perPage);
  page = parseInt(kv.key, 10);
  perPage = parseInt(kv.value, 10);

  var isPageValid = function(v) { return !isNaN(v) && v >= 1; }
    , isPerPageValid = function(v) { return !isNaN(v) && v <= perPageLimit; };

  check(page, isPageValid, format(errors.page, kv.key));
  check(perPage, isPerPageValid, format(errors.perPage, kv.value));
  return {page: page, perPage: perPage};
}

/**
 * Get all filters
 *
 * @param {Object} query
 * @return {Object}
 */

function parseFilters(query) {
  var filters = {}
    , skip = Object.keys(queries);

  Object.keys(query).forEach(function(q) {
    if (~skip.indexOf(q)) return;
    var attr = q.replace(/^_/, '');
    check(attr, validAttrs, format(errors.filter, attr));
    filters[attr] = query[q];
  });
  return filters;
}

/**
 * Parse key:value strings 
 * return {key:key, value: value} object
 *
 * Ex.
 *  parseKeyValue('title:asc', 'asc')
 *  //=> {key: 'title', value: 'asc'}
 *
 *  parseKeyValue('title', 'asc')
 *  //=> {key: 'title', value: 'asc'}
 *
 * @param {String} str
 * @param {String} defaultValue
 * @param {String} sep
 * @return {Object}
 */

function parseKeyValue(str, defaultValue, sep) {
  var key = str
    , value = defaultValue
    , sep = sep || ':'
    , sepIdx = str.lastIndexOf(':');

  if (~sepIdx) {
    key = str.substr(0, sepIdx);
    value = str.substr(sepIdx + 1);
  }
  return {key: key, value: value};
}

/**
 * Check if a value is valid. Throw an error if it isn't.
 *
 * @param {String|Number} val
 * @param {Array|Function} against
 * @param {String} msg
 */

function check(val, against, msg) {
  if (Array.isArray(against) && ~against.indexOf(val)) return;
  if (typeof against == 'function' && against.call(this, val)) return;
  throw error(400, msg);
}


exports.getQueries = getQueries;
exports.checkAttrs = getQueries;
exports.getImage = getImage;
