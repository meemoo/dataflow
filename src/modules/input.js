( function(Input) {
 
  Input.Model = Backbone.Model.extend({
    defaults: {
      label: "output",
      type: "all"
    },
    initialize: function() {
    }
  });

  Input.Collection = Backbone.Collection.extend({
    model: Input.Model
  });

}(Dataflow.module("input")) );
