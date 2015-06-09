/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Truck = require('./truck.model');
var TruckController = require('./truck.controller');

exports.register = function(socket) {
  socket.on('connection', function(s){
    s.on('truck:diff', function(data){
      onDiff(s, data);
    });
  });

  Truck.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Truck.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onDiff(socket, data) {
  TruckController.findDifference(data, function (err, trucks){
    if (err) {
      console.log('err', err);  
      return;
    }
    socket.emit('truck:diff', trucks);
  });
  
}

function onSave(socket, doc, cb) {
  socket.emit('truck:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('truck:remove', doc);
}