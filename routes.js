var path = require('path')
  , Client = require('./models').Client
  , Image = require('./models').Image
  , getQueries = require('./middleware').getQueries
  , checkAttrs = require('./middleware').checkAttrs
  , getImage = require('./middleware').getImage
  , error = require('./utils').error
  , merge = require('./utils').merge;

module.exports = function(app) {
  app.get('/clients/count', countClients);
  app.get('/clients', getQueries, listClients);
  app.post('/clients', checkAttrs, getImage, createClient);
  app.put('/clients/:id', checkAttrs, getImage, updateClient);
  app.get('/clients/:id', showClient);
  app.del('/clients/:id', removeClient);
  app.post('/images', uploadTempImage);

  Client.collection = app.get('db').collection('clients');
  Image.collection  = app.get('db').collection('images');
}

function countClients(req, res, next) {
  Client.count(send(res, next));
}

function listClients(req, res, next) {
  Client.find(req.clientQueries, send(res, next));
}

function showClient(req, res, next){
  Client.get(req.params.id, send(res, next));
}

function createClient(req, res, next) {
  var attrs = merge({}, req.body);
  if (req.image) attrs = merge(attrs, {image: req.image});
  var client = new Client(attrs);
  if (!client.validate()) return next(error(400, 'Validation failed', client.errors));
  client.save(send(res, next));
}

function updateClient(req, res, next) {
  var attrs = merge({}, req.body);
  if (req.image) attrs = merge(attrs, {image: req.image});
  var client = new Client(attrs, req.params.id);
  if (!client.validate()) return next(error(400, 'Validation failed', client.errors));
  client.save(send(res, next));
}

function removeClient(req, res, next) {
  Client.remove(req.params.id, send(res, next));
}

function uploadTempImage(req, res, next) {
  var image = req.files.image;
  if (image == null) return next(error(400, 'No image'));
  if (Array.isArray(image)) image = image[0];
  var img = new Image({
      path: image.path
    , src : '/tmp/' + image.path
    , name: image.filename
    , mime: image.mime
    , size: image.length
  });
  img.save(send(res, next));
}

/**
* Create a new function that knows how to handle a response
*/

function send(res, next) {
  return function(err, result) {
    if (err) return next(error(500, 'Server error'));
    if (!result) return next();
    res.send(result);
  }
}
