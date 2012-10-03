( function(Node) {
 
  // Dependencies
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");

  Node.Model = Backbone.Model.extend({
    initialize: function() {
      // Add i/o collections
      this.inputs = new Input.Collection(this.inputs);
      this.outputs = new Output.Collection(this.outputs);
    },
    inputs:[
      {label:"input"}
    ],
    outputs:[
      {label:"output"}
    ]
  });

  Node.Collection = Backbone.Collection.extend({
    model: Node.Model
  });

}(Dataflow.module("node")) );
