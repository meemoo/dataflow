( function(Edge) {
 
  // Dependencies

  Edge.Model = Backbone.Model.extend({
    initialize: function() {
    }
  });

  Edge.Collection = Backbone.Collection.extend({
    model: Edge.Model
  });

}(Dataflow.module("edge")) );
