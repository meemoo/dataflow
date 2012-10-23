( function(Output) {
 
  Output.Model = Backbone.Model.extend({
    defaults: {
      id: "output",
      type: "all"
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
    }
  });

  Output.Collection = Backbone.Collection.extend({
    model: Output.Model
  });

}(Dataflow.module("output")) );
