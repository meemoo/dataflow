/*
*   NOTE: this node.js has nothing to do with server-side Node.js
*/

( function(Dataflow) {

  var Node = Dataflow.prototype.module("node");
 
  // Dependencies
  var Input = Dataflow.prototype.module("input");
  var Output = Dataflow.prototype.module("output");

  Node.Model = Backbone.Model.extend({
    defaults: function () {
      return {
        label: "",
        description: "",
        icon: "",
        type: "test",
        x: 200,
        y: 100,
        state: {},
        selected: false
      };
    },
    getIcon: function () {
      if (this.get('icon')) {
        return this.get('icon');
      }
      var node = this.parentGraph.dataflow.node(this.get('type'));
      if (!node || !node.icon) {
        return '';
      }
      return node.icon;
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

      // Selection event
      this.on("change:selected", this.changeSelected, this);

    },
    changeSelected: function() {
      if (this.get("selected")){
        this.parentGraph.trigger("select:node", this);
      }
    },
    setState: function (name, value) {
      var state = this.get("state");
      if (state[name] === value) {
        return;
      }
      state[name] = value;
      if (this["input"+name]){
        this["input"+name](value);
      }
      this.trigger("change:state", name, value); //TODO: design this
    },
    setBang: function (name) {
      if (this["input"+name]){
        this["input"+name]();
      }
      this.trigger("bang", name);
    },
    send: function (name, value) {
      // This isn't the only way that values are sent, see github.com/forresto/dataflow-webaudio
      // Values sent here will not be `set()` on the recieving node
      // The listener is set up in Edge/initialize

      // To make this synchronous
      // this.trigger("send:"+name, value);

      // Otherwise, to make this safe for infinite loops
      var self = this;
      _.defer(function(){
        self.trigger("send:"+name, value);
      });
    },
    recieve: function (name, value) {
      // The listener is set up in Edge/initialize
      if ( typeof this["input"+name] === "function" ) {
        this["input"+name](value);
      } else {
        this["_"+name] = value;
      }
    },
    remove: function(){
      // Node removed from graph's nodes collection
      this.inputs.each(function(input){
        input.remove();
      });
      this.outputs.each(function(output){
        output.remove();
      });
      this.unload();
      this.collection.remove(this);
      this.trigger('remove');
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

}(Dataflow) );
