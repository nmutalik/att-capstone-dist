'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var RequestSchema = new Schema({
  _user: {type: Schema.Types.ObjectId, ref: 'User', require:false},
  _business: {type: Schema.Types.ObjectId, ref: 'Business', require:false},
  _truck: {type: Schema.Types.ObjectId, ref: 'Truck', require:false},
  type: {type: String, require:false, trim:true},
  date: {type: Date, default: Date.now},
  dispatched: {type: Boolean, default:false},
  closed: {type: Boolean, default:false}
});

// /**
//  * Virtuals
//  */
// // Displays Thing's activity
// RequestSchema
//   .virtual('activity')
//   .get(function() {
//     return {
//       'name': this.name,
//       'active': this.active
//     };
//   });

// /**
//  * Validations
// */
// // Validate empty name
// RequestSchema
//   .path('name')
//   .validate(function(name) {
//     return name.length;
//   }, 'Name cannot be blank');

// /**
//  * Methods
//  */
// RequestSchema.methods = {
//   /**
//    * has_name - returns if the user name is set
//    *
//    * @param
//    * @return {Boolean}
//    */
//   has_name: function() {
//     return this.name !== 'Unnamed Thing';
//   }
// };

module.exports = mongoose.model('Request', RequestSchema);