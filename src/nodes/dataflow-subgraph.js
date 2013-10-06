( function(Dataflow) {
 
  // Dependencies
  var BaseResizable = Dataflow.prototype.node("base-resizable");
  var DataflowSubgraph = Dataflow.prototype.node("dataflow-subgraph");

  var Graph = Dataflow.prototype.module("graph");
  var Input = Dataflow.prototype.module("input");
  var Output = Dataflow.prototype.module("output");

  DataflowSubgraph.icon = 'sitemap';

  DataflowSubgraph.Model = BaseResizable.Model.extend({
    defaults: function(){
      var defaults = BaseResizable.Model.prototype.defaults.call(this);
      defaults.label = "subgraph";
      defaults.icon = DataflowSubgraph.icon;
      defaults.type = "dataflow-subgraph";
      defaults.graph = {
        nodes:[
          {id: "1", label: "in", type:"dataflow-input",  x:180, y: 15},
          {id:"99", label:"out", type:"dataflow-output", x:975, y:500}
        ]
      };
      return defaults;
    },
    initialize: function() {
      BaseResizable.Model.prototype.initialize.call(this);

      var graph = this.get("graph");
      graph.parentNode = this;
      graph.dataflow = this.parentGraph.dataflow;
      this.graph = new Graph.Model(graph);

      // Initialize i/o from subgraph
      var inputs = this.graph.nodes.filter(function(node){
        return (node.type === "dataflow-input");
      });
      _.each(inputs, this.addInput, this);
      var outputs = this.graph.nodes.filter(function(node){
        return (node.type === "dataflow-output");
      });
      _.each(outputs, this.addOutput, this);

      // Listen for new i/o
      this.graph.nodes.on("add", function(node){
        if (node.type === "dataflow-input") {
          this.addInput(node);
        } else if (node.type === "dataflow-output") {
          this.addOutput(node);
        }
      }, this);

      // Listen for removing i/o
      this.graph.nodes.on("remove", function(node){
        if (node.type === "dataflow-input") {
          this.removeInput(node);
        } else if (node.type === "dataflow-output") {
          this.removeOutput(node);
        }
      }, this);
    },
    addInput: function(input){
      var newInput = new Input.Model({
        id: input.id,
        label: input.get("label"),
        type: input.get("input-type"),
        parentNode: this,
        inputNode: input
      });
      this.inputs.add(newInput);
    },
    recieve: function (name, value) {
      // Forward data to subgraph
      var inputNode = this.inputs.get(name).get("inputNode");
      if (inputNode) {
        inputNode.send("data", value);
      }
    },
    addOutput: function(output){
      var newOutput = new Output.Model({
        id: output.id,
        label: output.get("label"),
        type: output.get("output-type"),
        parentNode: this,
        outputNode: output
      });
      this.outputs.add(newOutput);
      output.set("parentNode", this);
    },
    removeInput: function(node){
      var input = this.inputs.get(node.id);
      input.remove();
      this.inputs.remove(input);
    },
    removeOutput: function(node){
      var output = this.outputs.get(node.id);
      output.remove();
      this.outputs.remove(output);
    },
    toJSON: function(){
      var json = BaseResizable.Model.prototype.toJSON.call(this);
      json.graph = this.graph;
      return json;
    },
    remove: function(){
      BaseResizable.Model.prototype.remove.call(this);
      this.graph.remove();
    },
    inputs:[
    ],
    outputs:[
    ]
  });

  var innerTemplate = '<button class="show-subgraph">edit subgraph</button>';

  DataflowSubgraph.View = BaseResizable.View.extend({
    events: function(){
      var events = BaseResizable.View.prototype.events.call(this);
      events["click .show-subgraph"] = "showSubgraph";
      return events;
    },
    innerTemplate: _.template(innerTemplate),
    initialize: function(options) {
      BaseResizable.View.prototype.initialize.call(this, options);
      this.model.graph.view = new Graph.View({model:this.model.graph});

      // Listen for label changes
      this.model.inputs.each(this.addInput, this);
      this.model.inputs.on("add", this.addInput, this);
      this.model.outputs.each(this.addOutput, this);
      this.model.outputs.on("add", this.addOutput, this);
    },
    addInput: function(input){
      // Listen for label changes
      if (!input.get('inputNode')) {
        return;
      }
      input.get("inputNode").on("change:label", function(i){
        input.view.$(".label").text(i.get("label"));
      }, this);
    },
    addOutput: function(output){
      // Listen for label changes
      if (!output.get('outputNode')) {
        return;
      }
      output.get("outputNode").on("change:label", function(o){
        output.view.$(".label").text(o.get("label"));
      }, this);
    },
    showSubgraph: function(){
      this.model.graph.dataflow.showGraph(this.model.graph);
    }
  });

}(Dataflow) );
