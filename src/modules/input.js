( function(Input) {
 
  Input.Model = Backbone.Model.extend({
    initialize: function() {
    }
  });

  Input.Collection = Backbone.Collection.extend({
    model: Input.Model
  });

}(Dataflow.module("input")) );
