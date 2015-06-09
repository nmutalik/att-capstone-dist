/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Business = require('./business.model');
var BusinessController = require('./business.controller');

exports.register = function(socket) {
  socket.on('connection', function(s){

    s.on('business:diff', function(data){
      onDiff(s, data);
    });
    s.on('business:error', function(data){
      onError(s, data);
    });
    s.on('business:deploy', function(data){
      onDeploy(s, data);
    });
  });

  Business.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Business.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onDiff(socket, data) {
  var data;
  BusinessController.findDifference(data, function (err, businesses){
    if (err) {
      console.log('err', err);  
      return;
    }
    socket.emit('business:diff', businesses);
  });
  
}

function onError(socket, data) {
  console.log('error', data);
}

function onDeploy(socket) {
  console.log('deploy', data);
}

function onSave(socket, doc, cb) {
  socket.emit('business:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('business:remove', doc);
}