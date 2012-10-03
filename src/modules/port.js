( function(Port) {
 
  // Dependencies

  Port.Model = Backbone.Model.extend({
    initialize: function() {
    }
  });

  Port.Collection = Backbone.Collection.extend({
    model: Port.Model
  });

}(Dataflow.module("port")) );
