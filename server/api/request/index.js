'use strict';

var express = require('express');
var controller = require('./request.controller');

var router = express.Router();

/**
* GET
*/
router.get('/', controller.index);
router.get('/open', controller.showOpen);
router.get('/:id', controller.showByIdReq);
/**
* POST
*/
router.post('/', controller.createReq);
router.post('/dispatch', controller.dispatch);

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