/*
*   NOTE: this has nothing to do with server-side Node.js (so far at least)
*/

( function(Node) {
 
  // Dependencies
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");

  Node.Model = Backbone.Model.extend({
    defaults: {
      label: "",
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
        id: "input"
      }
    ],
    outputs:[
      {
        id:"output"
      }
    ]
  });

  Node.Collection = Backbone.Collection.extend({
    model: Node.Model,
    comparator: function(node) {
      return node.get("x");
    }
  });

}(Dataflow.module("node")) );
