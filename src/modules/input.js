( function(Input) {
 
  Input.Model = Backbone.Model.extend({
    defaults: {
      id: "output",
      type: "all"
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
    }
  });

  Input.Collection = Backbone.Collection.extend({
    model: Input.Model
  });

}(Dataflow.module("input")) );
