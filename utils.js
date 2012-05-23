/**
 * Create an error
 *
 * @param {Number} status
 * @param {String} msg
 * @param {Object} errors
 * @return {Error}
 * @api private
 */

exports.error = function (status, msg, errors) {
  var err = new Error(msg);
  err.status = status;
  err.errors = errors;
  return err;
}

/**
 * Make a double array from a simple object
 *
 *     utils.toArray({title: 'asc', company: 'desc'}) 
 *     // => [['title', 'desc'], ['company', 'desc']]
 *
 * @param {Object} o
 * @return {Array}
 * @api private
 */

exports.toArray = function(o) {
  return Object.keys(o).map(function(k) { return [k, o[k]]});
}

/**
 * Replace %s in msg with value
 *
 *     utils.format('what %s say?', 'you');
 *     // => 'what you say?'
 *
 * @param {String} msg
 * @param {String} value
 * @return {String}
 * @api private
 */

exports.format = function(msg, value) { return msg.replace('%s', value); }

/**
 * Merge object b with object a.
 * (From Connect source)
 *
 *     var a = { foo: 'bar' }
 *       , b = { bar: 'baz' };
 *     
 *     utils.merge(a, b);
 *     // => { foo: 'bar', bar: 'baz' }
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object}
 * @api private
 */

exports.merge = function(a, b){
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};
