( function(Output) {
 
  Output.Model = Backbone.Model.extend({
    initialize: function() {
    }
  });

  Output.Collection = Backbone.Collection.extend({
    model: Output.Model
  });

}(Dataflow.module("output")) );
