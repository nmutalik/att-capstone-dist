'use strict';

var _ = require('lodash');
var Truck = require('./truck.model');
var Request = require('../request/request.model');
var kd = require('kdtree');

var truck_tree = new kd.KDTree(2);
Truck.find({}, function(err, trucks){
  for (var i = 0; i < trucks.length; ++i) {
    truck_tree.insert(trucks[i].location.lat, trucks[i].location.lng, trucks[i]._id);
  }
  console.log('Successfully inserted trucks in kdtree');
});

/**
 * Middleware functions
*/
Truck.schema.pre('save', function (next, done) {
  next();
});

Truck.schema.pre('remove', function (next, done) {
  next();
});

/*
Internal functions
*/
// Creates an object
exports.create = function(params, callback) {
  Truck.create(params, callback);
}

// Finds an object by its id
exports.findById = function(id, callback) {
  Truck.findById(id, callback);
}

exports.findClosest = function(params, callback) {
  var id = truck_tree.nearest(params.lat, params.lng)[2];
  Truck.findById(id, callback);
}

exports.dispatch = function(params, callback) {
  // var input = {"a": {"lat": 40.99, "lng": -96.14}, "b": {"lat": 40.81, "lng": -96.64}};

  var spawn = require('child_process').spawn;
  var child = spawn('coffee', ['server/components/dire/dire.coffee']);
  console.log('hey');
  var input = {
    a : params._truck.location,
    b : params._business.location
  }

  Truck.findById(params._truck._id, function(err, truck){

    console.log(input);
    child.stdin.write(JSON.stringify(input));
    child.stdin.destroy();

    // callback(null);
    child.stdout.on('data', function (data) {
        truck.location = JSON.parse(data);
        truck.save(function(){
          console.log(JSON.parse(data));
        });
    });

    child.stderr.on('data', function (data) {
        callback("Error");
        console.log('There was an error: ' + data);
    });
  });


}

exports.findDifference = function(params, callback) {
  var ids = {};
  if (params.old) {
    ids = idsDifference(params);
  } else {
    ids.add = idsByRange(params.new);
    ids.remove = [];
  }
  Truck.find({'_id': {$in: ids.add}}, function(err, trucks_add){
    if (err) { return callback(err); }
    Truck.find({'_id': {$in: ids.remove}}, function(err, trucks_remove){
      if (err) { return callback(err); }
      return callback(null, {'add' : trucks_add, 'remove' : trucks_remove});
    });
  });
}

// Updates an object given the object and new parameters
exports.update = function(truck, params ,callback) {
  if(params._id) { delete params._id; }
  var updated = _.merge(truck, params);
  updated.save(function (err) {
    if (err) { return callback(err); }
    return callback(null, truck);
  });
}

//Deletes an object
exports.destroy = function(truck, callback) {
  truck.remove(function(err) {
    if(err) { return callback(err); }
    return callback(null);
  });
}

/*
* API functions
*/
// Get list of trucks
exports.index = function(req, res) {
  Truck.find(function (err, trucks) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(trucks);
  });
};

// Get a single truck
exports.showByIdReq = function(req, res) {
  Truck.findById(req.params.id, function (err, truck) {
    if(err) { return handleError(res, err); }
    if(!truck) { return res.status(404).send('Not Found'); }
    return res.json(truck);
  });
};


// Get a single business
exports.showHistory = function(req, res) {
  Truck.findById(req.params.id, function (err, truck) {
    if(err) { return handleError(res, err); }
    if(!truck) { return res.status(404).send('Not Found'); }
    Request.find({'_truck' : truck._id, 'closed' : true}).populate('_business').exec(function (err, requests){
      return res.json(requests);
    });
  });
};

// Creates a new truck in the DB.
exports.createReq = function(req, res) {
  exports.create(req.body, function(err, truck) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(truck);
  });
};

// Updates an existing truck in the DB.
exports.updateReqById = function(req, res) {
  exports.findById(req.params.id, function (err, truck) {
    if (err) { return handleError(res, err); }
    if(!truck) { return res.status(404).send('Not Found'); }
    exports.update(truck, req.body, function(err, truck){
      if (err) { return handleError(res, err); }
      return res.status(200).json(truck);
    });
  });
};

// Deletes a truck from the DB.
exports.destroyReqById = function(req, res) {
  exports.findById(req.params.id, function (err, truck) {
    if(err) { return handleError(res, err); }
    if(!truck) { return res.status(404).send('Not Found'); }
    exports.destroy(truck, function(err) {
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
  var res = truck_tree.nearestRange(centerLat, centerLng, range);
  var ids = _.map(res, function(data){
    return data[2];
  });
  return ids;
}

function handleError(res, err) {
  return res.status(500).send(err);
}