( function(Node) {
 
  // Dependencies
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");

  Node.Model = Backbone.Model.extend({
    defaults: {
      x: 200,
      y: 100
    },
    initialize: function() {
      // Add i/o collections
      this.inputs = new Input.Collection(this.inputs);
      this.inputs.each(function(input){
        input.node = this;
      }, this);
      this.outputs = new Output.Collection(this.outputs);
      this.outputs.each(function(output){
        output.node = this;
      }, this);
    },
    inputs:[
      {
        label: "input"
      }
    ],
    outputs:[
      {
        label:"output"
      }
    ]
  });

  Node.Collection = Backbone.Collection.extend({
    model: Node.Model
  });

}(Dataflow.module("node")) );
