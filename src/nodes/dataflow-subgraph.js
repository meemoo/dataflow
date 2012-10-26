( function(Dataflow) {
 
  // Dependencies
  var BaseResizable = Dataflow.node("base-resizable");
  var DataflowSubgraph = Dataflow.node("dataflow-subgraph");

  var Graph = Dataflow.module("graph");
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");

  DataflowSubgraph.Model = BaseResizable.Model.extend({
    defaults: {
      label: "subgraph",
      type: "dataflow-subgraph",
      x: 200,
      y: 100,
      graph: {}
    },
    initialize: function() {
      BaseResizable.Model.prototype.initialize.call(this);

      var graph = this.get("graph");
      graph.parentNode = this;
      this.graph = new Graph.Model(graph);

      // Initialize i/o from subgraph
      var inputs = this.graph.nodes.filter(function(node){
        return (node.type === "dataflow-input");
      });
      for (var i=0; i<inputs.length; i++){
        var input = inputs[i];
        var newInput = new Input.Model({
          id: input.get("label"),
          type: input.get("input-type"),
          parentNode: this
        });
        this.inputs.add(newInput);
      }
      var outputs = this.graph.nodes.filter(function(node){
        return (node.type === "dataflow-output");
      });
      for (i=0; i<outputs.length; i++){
        var output = outputs[i];
        var newOutput = new Output.Model({
          id: output.get("label"),
          type: output.get("output-type"),
          parentNode: this
        });
        this.outputs.add(newOutput);
      }
    },
    toJSON: function(){
      var json = BaseResizable.Model.prototype.toJSON.call(this);
      json.graph = this.graph;
      return json;
    },
    remove: function(){
      this.graph.remove();
    },
    inputs:[
    ],
    outputs:[
    ]
  });

  DataflowSubgraph.View = BaseResizable.View.extend({
    initialize: function() {
      BaseResizable.View.prototype.initialize.call(this);
      this.model.graph.view = new Graph.View({model:this.model.graph});

      var self = this;
      var editButton = $("<button>edit subgraph</button>")
        .click(function(){
          self.editSubgraph();
        });
      this.$(".inner").append(editButton);
    },
    editSubgraph: function(){
      // Hide parent
      this.model.parentGraph.view.$el.detach();
      // var currentView = this.model.parentGraph.view.el;
      // currentView.parentNode.removeChild(currentView);
      // Show sub
      $("#app").append(this.model.graph.view.el);

      var self = this;
      var closeButton = $("<button>close subgraph</button>")
        .click(function(){
          self.closeSubgraph();
        });
      this.model.graph.view.$(".graph-controls")
        .empty()
        .append(closeButton);
      
      this.model.graph.view.render();
    },
    closeSubgraph: function(){
      // Hide subgraph
      this.model.graph.view.$el.detach();
      // Show parent
      $("#app").append(this.model.parentGraph.view.el);
    }
  });

}(Dataflow) );
