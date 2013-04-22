( function(Dataflow) {

  var Port = Dataflow.prototype.module("port");
 
  Port.Model = Backbone.Model.extend({
    initialize: function() {
    }
  });

  Port.Collection = Backbone.Collection.extend({
    model: Port.Model
  });

}(Dataflow) );
