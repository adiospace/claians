var express = require('express')
  , http = require('http')
  , mongo = require('mongoskin');
  
var app = express()
  , db =  mongo.db('localhost:27017/claians');

var public = __dirname + '/public'
   , uploadDir = public + '/tmp';

app.set('db', db);
app.set('port', process.env.PORT || 3000);

app.use(express.logger('dev'));
app.use(express.bodyParser({uploadDir: uploadDir, keepExtensions: true}));
app.use(app.router);
app.use(express.static(public));
app.use(notFound);
app.use(errorHandler);
app.use(express.errorHandler()); 

require('./routes')(app);

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

function notFound(req, res) {
  res.send(404, { message: 'Not Found' });                                                 
}

function errorHandler(err, req, res, next){
  var response = {message: err.message};
  err.errors && (response.errors = err.errors);
  res.send(err.status || 500, response);
}
