'use strict';

var _ = require('lodash');
var Business = require('./business.model');
var Request = require('../request/request.model');
var Trucks = require('../truck/truck.controller');
var kd = require('kdtree');

var company_tree = new kd.KDTree(2);
Business.find({}, function(err, businesses){
  for (var i = 0; i < businesses.length; ++i) {
    company_tree.insert(businesses[i].location.lat, businesses[i].location.lng, businesses[i]._id);
  }
  console.log('Successfully inserted businesses in kdtree');
});

/**
 * Middleware functions
*/
Business.schema.pre('save', function (next, done) {
  next();
});

Business.schema.pre('remove', function (next, done) {
  next();
});

/*
Internal functions
*/
// Creates an object
exports.create = function(params, callback) {
  Business.create(params, callback);
}

// Finds an object by its id
exports.findById = function(id, callback) {
  Business.findById(id, callback);
}

exports.findDifference = function(params, callback) {
  var ids = {};
  if (params.old) {
    ids = idsDifference(params);
  } else {
    ids.add = idsByRange(params.new);
    ids.remove = [];
  }
  Business.find({'_id': {$in: ids.add}}).populate('_request').exec(function(err, businesses_add){
    if (err) { return callback(err); }
    Business.find({'_id': {$in: ids.remove}}, function(err, businesses_remove){
      if (err) { return callback(err); }
      return callback(null, {'add' : businesses_add, 'remove' : businesses_remove});
    });
  });
}

// Updates an object given the object and new parameters
exports.update = function(business, params ,callback) {
  if(params._id) { delete params._id; }
  var updated = _.merge(business, params);
  updated.save(function (err) {
    if (err) { return callback(err); }
    return callback(null, business);
  });
}

//Deletes an object
exports.destroy = function(business, callback) {
  business.remove(function(err) {
    if(err) { return callback(err); }
    return callback(null);
  });
}

/*
* API functions
*/
// Get list of businesss
exports.index = function(req, res) {
  Business.find(function (err, businesss) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(businesss);
  });
};

// Get a single business
exports.showByIdReq = function(req, res) {
  Business.findById(req.params.id, function (err, business) {
    if(err) { return handleError(res, err); }
    if(!business) { return res.status(404).send('Not Found'); }
    return res.json(business);
  });
};

// Get a single business
exports.showHistory = function(req, res) {
  Business.findById(req.params.id, function (err, business) {
    if(err) { return handleError(res, err); }
    if(!business) { return res.status(404).send('Not Found'); }
    Request.find({'_business' : business._id, 'closed' : true}).populate('_truck').exec(function (err, requests){
      return res.json(requests);
    });
  });
};

// Get a single business
exports.showNearBy = function(req, res) {
  Business.findById(req.params.id, function (err, business) {
    if(err) { return handleError(res, err); }
    if(!business) { return res.status(404).send('Not Found'); }
    Trucks.findClosest(business.location, function (err, trucks) {
      return res.json(trucks);
    });
  });
};

exports.request = function(req, res) {
  Business.findById(req.body._business, function (err, business) {
    if(err) { return handleError(res, err); }
    if(!business) { return res.status(404).send('Not Found'); }
    Request.create(req.body, function(err, request) {
      if(err) { return handleError(res, err); }
      exports.update(business, {'_request' : request._id}, function(err, business){
        if(err) { return handleError(res, err); }
        return res.status(201).json(request);
      });
    });
  });
};


// Creates a new business in the DB.
exports.createReq = function(req, res) {
  exports.create(req.body, function(err, business) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(business);
  });
};

// Updates an existing business in the DB.
exports.updateReqById = function(req, res) {
  exports.findById(req.params.id, function (err, business) {
    if (err) { return handleError(res, err); }
    if(!business) { return res.status(404).send('Not Found'); }
    exports.update(business, req.body, function(err, business){
      if (err) { return handleError(res, err); }
      return res.status(200).json(business);
    });
  });
};

// Deletes a business from the DB.
exports.destroyReqById = function(req, res) {
  exports.findById(req.params.id, function (err, business) {
    if(err) { return handleError(res, err); }
    if(!business) { return res.status(404).send('Not Found'); }
    exports.destroy(business, function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

/**
* Helper functions
*/

function idsDifference(params) {
  var old_set = idsByRange(params.old);
  var new_set = idsByRange(params.new);
  var data = {};
  data.add = _.difference(new_set, old_set);
  data.remove = _.difference(old_set, new_set);
  return data;
}

function idsByRange(params) {
  var centerLat = (params.ne.lat + params.sw.lat) / 2
  var centerLng = ((params.ne.lng + params.sw.lng + 360 * (params.ne.lng < params.sw.lng)) / 2 + 180) % 360 - 180;

  var range = Math.sqrt(Math.pow(params.ne.lat - params.sw.lat, 2) + Math.pow((360 * (params.ne.lng < params.sw.lng) + params.ne.lng - params.sw.lng) % 360 || 360, 2));

  var res = company_tree.nearestRange(centerLat, centerLng, range);
  var ids = _.map(res, function(data){
    return data[2];
  });
  return ids
}

function handleError(res, err) {
  return res.status(500).send(err);
}