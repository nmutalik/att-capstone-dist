'use strict';

var _ = require('lodash');
var Request = require('./request.model');
var TruckController = require('../truck/truck.controller');
var BusinessController = require('../business/business.controller');
var Business = require('../business/business.model');



/**
 * Middleware functions
*/
Request.schema.pre('save', function (next, done) {
  next();
});

Request.schema.pre('remove', function (next, done) {
  next();
});

/*
Internal functions
*/
// Creates an object
exports.create = function(params, callback) {
  Request.create(params, callback);
}

// Finds an object by its id
exports.findById = function(id, callback) {
  Request.findById(id, callback);
}

exports.find = function(params, callback) {
  Request.find(params, callback);
}

// Updates an object given the object and new parameters
exports.update = function(request, params ,callback) {
  if(params._id) { delete params._id; }
  var updated = _.merge(request, params);
  updated.save(function (err) {
    if (err) { return callback(err); }
    return callback(null, request);
  });
}

//Deletes an object
exports.destroy = function(request, callback) {
  request.remove(function(err) {
    if(err) { return callback(err); }
    return callback(null);
  });
}

/*
* API functions
*/
// Get list of requests
exports.index = function(req, res) {
  Request.find(function (err, requests) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(requests);
  });
};

// Get a single request
exports.showByIdReq = function(req, res) {
  Request.findById(req.params.id, function (err, request) {
    if(err) { return handleError(res, err); }
    if(!request) { return res.status(404).send('Not Found'); }
    return res.json(request);
  });
};

// Get a single request
exports.dispatch = function(req, res) {
  Request.findOne({'_business' : req.body._business}, function (err, request) {
    if(err) { return handleError(res, err); }
    if(!request) { return res.status(404).send('Not Found'); }
    exports.update(request, {'_truck' : req.body._truck, 'dispatched' : true}, function (err, request){
      if(err) { return handleError(res, err); }
      Request.populate(request ,'_truck _business', function (err, request) {
        TruckController.dispatch(request, function(err) {
          exports.update(request, {'closed' : true, 'dispatched' : false}, function (err, request){
            Business.findById(request._business, function(err, business){
              business._request = undefined;
              business.save(function(err, business){
                console.log('done');
              });
            })
          });
        });
        return res.json(request);
      });
    });
  });
};

exports.showOpen = function(req, res) {
  Request.find({'closed': false}).populate({'path':'_business'}).exec(function (err, request) {
    if(err) { return handleError(res, err); }
    if(!request) { return res.status(404).send('Not Found'); }
    return res.json(request);
  });
};

// Creates a new request in the DB.
exports.createReq = function(req, res) {
  exports.create(req.body, function(err, request) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(request);
  });
};

// Updates an existing request in the DB.
exports.updateReqById = function(req, res) {
  exports.findById(req.params.id, function (err, request) {
    if (err) { return handleError(res, err); }
    if(!request) { return res.status(404).send('Not Found'); }
    exports.update(request, req.body, function(err, request){
      if (err) { return handleError(res, err); }
      return res.status(200).json(request);
    });
  });
};

// Deletes a request from the DB.
exports.destroyReqById = function(req, res) {
  exports.findById(req.params.id, function (err, request) {
    if(err) { return handleError(res, err); }
    if(!request) { return res.status(404).send('Not Found'); }
    exports.destroy(request, function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

/**
* Helper functions
*/

function handleError(res, err) {
  return res.status(500).send(err);
}