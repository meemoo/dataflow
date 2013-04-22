( function(Dataflow) {

  var Input = Dataflow.prototype.module("input");
  var Output = Dataflow.prototype.module("output");
 
  // Output extends input
  Output.Model = Input.Model.extend({
    defaults: {
      id: "output",
      label: "",
      type: "all",
      description: ""
    }
  });

  Output.Collection = Backbone.Collection.extend({
    model: Output.Model
  });

}(Dataflow) );
