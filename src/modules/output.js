( function(Output) {
 
  Output.Model = Backbone.Model.extend({
    defaults: {
      id: "output",
      label: "",
      type: "all"
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
      if (this.get("label")===""){
        this.set({label: this.id});
      }
    }
  });

  Output.Collection = Backbone.Collection.extend({
    model: Output.Model
  });

}(Dataflow.module("output")) );
