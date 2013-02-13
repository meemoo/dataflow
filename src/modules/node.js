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
      type: "test",
      x: 200,
      y: 100,
      state: {}
    },
    initialize: function() {
      this.parentGraph = this.get("parentGraph");
      this.type = this.get("type");

      // Default label to type
      if (this.get("label")===""){
        this.set({
          "label": this.get("type")
        });
      }

      // Convert inputs array to backbone collection
      var inputArray = this.inputs;
      this.inputs = new Input.Collection();
      this.inputs.parentNode = this;
      for(var i=0; i<inputArray.length; i++) {
        var input = inputArray[i];

        // Save defaults to state
        var state = this.get("state");
        if (input.value !== undefined && state[input.id] === undefined) {
          state[input.id] = input.value;
        }

        input.parentNode = this;
        input = new Input.Model(input);
        this.inputs.add(input);
      }

      // Convert outputs array to backbone collection
      var outputArray = this.outputs;
      this.outputs = new Output.Collection();
      this.outputs.parentNode = this;
      for(i=0; i<outputArray.length; i++) {
        var output = outputArray[i];
        output.parentNode = this;
        output = new Output.Model(output);
        this.outputs.add(output);
      }

    },
    setState: function(name, value){
      var state = this.get("state");
      state[name] = value;
      if (this["input"+name]){
        this["input"+name](value);
      }
      this.trigger("change:state:"+name); //TODO: design this
    },
    setBang: function(name){
      if (this["input"+name]){
        this["input"+name]();
      }
    },
    send: function(name, value){
      // This isn't the only way that values are sent, see dataflow-webaudio
      // Values sent here will not be `set()` on the recieving node
      // Send value to connected nodes
      var output = this.outputs.get(name);
      if (output) {
        output.send(value);
      }
    },
    remove: function(){
      // Node removed from graph's nodes collection
      // Remove related edges
      // while(this.inputs.length>0) {
      //   this.inputs.at(0).remove();
      // }
      // while(this.outputs.length>0) {
      //   this.outputs.at(0).remove();
      // }
      this.inputs.each(function(input){
        input.remove();
      });
      this.outputs.each(function(output){
        output.remove();
      });
      // var relatedEdges = this.parentGraph.edges.filter(function(edge){
      //   // Find connected edges
      //   return edge.isConnectedToNode(this);
      // }, this);
      // for (var i=0; i<relatedEdges.length; i++) {
      //   // Remove connected edges
      //   var edge = relatedEdges[i];
      //   edge.remove();
      // }
      this.unload();
      this.collection.remove(this);
    },
    unload: function(){
      // Stop any processes that need to be stopped
    },
    toString: function(){
      return this.id + " ("+this.type+")";
    },
    toJSON: function(){
      return {
        id: this.get("id"),
        label: this.get("label"),
        type: this.get("type"),
        x: this.get("x"),
        y: this.get("y"),
        state: this.get("state")
      };
    },
    inputs:[
      // {
      //   id: "input",
      //   type: "all"
      // }
    ],
    outputs:[
      // {
      //   id:"output",
      //   type: "all"
      // }
    ]
  });

  Node.Collection = Backbone.Collection.extend({
    model: Node.Model,
    comparator: function(node) {
      // Sort nodes by x position
      return node.get("x");
    }
  });

}(Dataflow.module("node")) );
