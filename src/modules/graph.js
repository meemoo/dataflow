(function(Dataflow) {
 
  var Graph = Dataflow.prototype.module("graph");

  // Dependencies
  var Node = Dataflow.prototype.module("node");
  var Edge = Dataflow.prototype.module("edge");

  Graph.Model = Backbone.Model.extend({
    defaults: {
      nodes: [],
      edges: [],
      panX: 0,
      panY: 0,
      zoom: 1
    },
    initialize: function() {
      this.dataflow = this.get("dataflow");

      var i;

      // Set up nodes 
      var nodes = this.nodes = new Node.Collection();
      nodes.parentGraph = this;
      // Node events
      nodes.on("all", function(){
        this.trigger("change");
      }, this);
      nodes.on("add", function(node){
        this.dataflow.trigger("node:add", this, node);
      }, this);
      nodes.on("remove", function(node){
        // Remove related edges and unload running processes if defined
        node.remove();
        this.dataflow.trigger("node:remove", this, node);
      }, this);
      // Convert nodes array to backbone collection
      var nodesArray = this.get("nodes");
      for(i=0; i<nodesArray.length; i++) {
        var node = nodesArray[i];
        node.parentGraph = this;
        if (node.type && this.dataflow.nodes[node.type]) {
          node = new this.dataflow.nodes[node.type].Model(node);
          nodes.add(node);
        } else {
          this.dataflow.log("node "+node.id+" not added: node type ("+node.type+") not found", node);
        }
      }

      // Set up edges
      var edges = this.edges = new Edge.Collection();
      edges.parentGraph = this;
      // Edge events
      edges.on("all", function(){
        this.trigger("change");
      }, this);
      edges.on("add", function(edge){
        this.dataflow.trigger("edge:add", this, edge);
      }, this);
      edges.on("remove", function(edge){
        this.dataflow.trigger("edge:remove", this, edge);
      }, this);
      // Convert edges array to backbone collection
      var edgesArray = this.get("edges");
      for(i=0; i<edgesArray.length; i++) {
        var edge = edgesArray[i];
        edge.parentGraph = this;
        edge.id = edge.source.node+":"+edge.source.port+"::"+edge.target.node+":"+edge.target.port;
        // Check that nodes and ports exist
        var sourceNode = nodes.get(edge.source.node);
        var targetNode = nodes.get(edge.target.node);
        if (sourceNode && targetNode && sourceNode.outputs.get(edge.source.port) && targetNode.inputs.get(edge.target.port)) {
          edge = new Edge.Model(edge);
          edges.add(edge);
        } else {
          this.dataflow.log("edge "+edge.id+" not added: node or port not found", edge);
        }
      }
      // Attach collections to graph
      this.set({
        nodes: nodes,
        edges: edges
      });

      // Listen for un/select
      this.on("selectionChanged", this.selectionChanged, this);
      this.on("select:node", this.selectNode, this);
      this.on("select:edge", this.selectEdge, this);

      // Pass graph change events up to dataflow
      this.on("change", function(){
        this.dataflow.trigger("change", this);
      }, this);
    },
    selectNode: function (node) {
      this.dataflow.trigger("select:node", this, node);
    },
    selectEdge: function (edge) {
      this.dataflow.trigger("select:edge", this, edge);
    },
    selectionChanged: function () {
      var selectedNodes = this.nodes.where({selected:true});
      var selectedEdges = this.edges.where({selected:true});
      this.dataflow.changeContext(selectedNodes, selectedEdges);
    },
    remove: function(){
      while(this.nodes.length > 0){
        this.nodes.remove(this.nodes.at(this.nodes.length-1));
      }
    },
    toJSON: function(){
      return {
        nodes: this.nodes,
        edges: this.edges
      };
    }
  });

}(Dataflow));
