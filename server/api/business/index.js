'use strict';

var express = require('express');
var controller = require('./business.controller');

var router = express.Router();

/**
* GET
*/
router.get('/', controller.index);
router.get('/:id', controller.showByIdReq);
router.get('/:id/history', controller.showHistory);
router.get('/:id/nearby', controller.showNearBy);


/**
* POST
*/
router.post('/', controller.createReq);
router.post('/request', controller.request);


/**
* PUT/PATCH
*/
router.put('/:id', controller.updateReqById);
router.patch('/:id', controller.updateReqById);

/**
* DELETE
*/
router.delete('/:id', controller.destroyReqById);

module.exports = router;