/*! dataflow.js - v0.0.1 - 2012-10-19
* https://github.com/meemoo/dataflow
* Copyright (c) 2012 Forrest Oliphant; Licensed MIT, GPL */

// Structure with guidance from http://weblog.bocoup.com/organizing-your-backbone-js-application-with-modules/

(function(){
  var App = Backbone.Model.extend({
    // Create the object to contain the modules
    modules: {},
    module: function(name) {
      // Create a new module reference scaffold or load an existing module.
      // If this module has already been created, return it.
      if (this.modules[name]) {
        return this.modules[name];
      }
      // Create a module and save it under this name
      return this.modules[name] = { Views: {} };
    },
    // Create the object to contain the nodes
    nodes: {},
    node: function(name) {
      // Create a new node reference scaffold or load an existing node.
      // If this node has already been created, return it.
      if (this.nodes[name]) {
        return this.nodes[name];
      }
      // Create a node and save it under this name
      return this.nodes[name] = { Views: {} };
    },
    loadGraph: function(source) {
      if (this.graph) {
        this.graph.remove();
      }
      var Graph = this.module("graph");
      var newGraph = new Graph.Model(source);
      newGraph.view = new Graph.Views.Main({model: newGraph});
      $("#app").html(newGraph.view.render().el);

      // For debugging
      this.graph = newGraph;

      return newGraph;
    }
  });

  // Our global
  window.Dataflow = new App();
}());

// All code has been downloaded and evaluated and is ready to be initialized.
jQuery(function($) {

  // Router
  var DataflowRouter = Backbone.Router.extend({
    routes: {
      "": "index"
    },
    index: function() {

    }
  });
  Dataflow.router = new DataflowRouter();
  Backbone.history.start();

});

(function(Graph) {
 
  // Dependencies
  var Node = Dataflow.module("node");
  var Edge = Dataflow.module("edge");

  Graph.Model = Backbone.Model.extend({
    initialize: function() {
      var i;

      // Set up nodes 
      var nodes = this.nodes = new Node.Collection();
      nodes.graph = this;
      // Node events
      nodes.on("all", function(){
        this.trigger("change");
      }, this);
      nodes.on("add", function(node){
        Dataflow.trigger("node:add", this, node);
      }, this);
      nodes.on("remove", function(node){
        // Remove related edges and unload running processes if defined
        node.remove();
        Dataflow.trigger("node:remove", this, node);
      }, this);
      // Convert nodes array to backbone collection
      var nodesArray = this.get("nodes");
      for(i=0; i<nodesArray.length; i++) {
        var node = nodesArray[i];
        node.graph = this;
        node = new Node.Model(node);
        nodes.add(node);
      }

      // Set up edges
      var edges = this.edges = new Edge.Collection();
      edges.graph = this;
      // Edge events
      edges.on("all", function(){
        this.trigger("change");
      }, this);
      edges.on("add", function(edge){
        Dataflow.trigger("edge:add", this, edge);
      }, this);
      edges.on("remove", function(edge){
        Dataflow.trigger("edge:remove", this, edge);
      }, this);
      // Convert edges array to backbone collection
      var edgesArray = this.get("edges");
      for(i=0; i<edgesArray.length; i++) {
        var edge = edgesArray[i];
        edge.graph = this;
        edge.id = edge.source.node+":"+edge.source.port+"→"+edge.target.node+":"+edge.target.port;
        edge = new Edge.Model(edge);
        edges.add(edge);
      }
      // Attach collections to graph
      this.set({
        nodes: nodes,
        edges: edges
      });

      // Pass events up to Dataflow global
      this.on("change", function(){
        Dataflow.trigger("change", this);
      }, this);
    },
    remove: function(){
      while(this.nodes.length > 0){
        this.nodes.remove(this.nodes.at(0));
      }
    }
  });

}(Dataflow.module("graph")) );

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
      y: 100
    },
    initialize: function() {
      this.graph = this.get("graph");
      this.type = this.get("type");

      // Convert inputs array to backbone collection
      var inputArray = this.inputs;
      this.inputs = new Input.Collection();
      this.inputs.node = this;
      for(var i=0; i<inputArray.length; i++) {
        var input = inputArray[i];
        input.node = this;
        input = new Input.Model(input);
        this.inputs.add(input);
      }

      // Convert outputs array to backbone collection
      var outputArray = this.outputs;
      this.outputs = new Input.Collection();
      this.outputs.node = this;
      for(i=0; i<outputArray.length; i++) {
        var output = outputArray[i];
        output.node = this;
        output = new Input.Model(output);
        this.outputs.add(output);
      }

    },
    remove: function(){
      // Node removed from graph's nodes collection
      // Remove related edges
      var relatedEdges = this.graph.edges.filter(function(edge){
        // Find connected edges
        return edge.isConnectedToNode(this);
      }, this);
      for (var i=0; i<relatedEdges.length; i++) {
        // Remove connected edges
        var edge = relatedEdges[i];
        edge.collection.remove(edge);
      }
      this.unload();
    },
    unload: function(){
      // Stop any processes that need to be stopped
    },
    toString: function(){
      return this.id;
    },
    toJSON: function(){
      return {
        id: this.get("id"),
        label: this.get("label"),
        type: this.get("type"),
        x: this.get("x"),
        y: this.get("y")
      };
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
      // Sort nodes by x position
      return node.get("x");
    }
  });

}(Dataflow.module("node")) );

( function(Input) {
 
  Input.Model = Backbone.Model.extend({
    defaults: {
      id: "output",
      type: "all"
    },
    initialize: function() {
      this.node = this.get("node");
    }
  });

  Input.Collection = Backbone.Collection.extend({
    model: Input.Model
  });

}(Dataflow.module("input")) );

( function(Output) {
 
  Output.Model = Backbone.Model.extend({
    defaults: {
      id: "output",
      type: "all"
    },
    initialize: function() {
      this.node = this.get("node");
    }
  });

  Output.Collection = Backbone.Collection.extend({
    model: Output.Model
  });

}(Dataflow.module("output")) );

( function(Edge) {
 
  // Dependencies

  Edge.Model = Backbone.Model.extend({
    initialize: function() {
      var nodes;
      var preview = this.get("preview");
      if (preview) {
        // Preview edge
        nodes = this.get("graph").nodes;
        var source = this.get("source");
        var target = this.get("target");
        if (source) {
          this.source = nodes.get(this.get("source").node).outputs.get(this.get("source").port);
        }
        if (target) {
          this.target = nodes.get(this.get("target").node).inputs.get(this.get("target").port);
        }
      } else {
        // Real edge
        this.graph = this.get("graph");
        nodes = this.graph.nodes;
        this.source = nodes.get(this.get("source").node).outputs.get(this.get("source").port);
        this.target = nodes.get(this.get("target").node).inputs.get(this.get("target").port);
      }
    },
    isConnectedToNode: function(node) {
      return ( this.source.node === node || this.target.node === node );
    },
    toString: function(){
      return this.get("source").node+":"+this.get("source").port+"→"+this.get("target").node+":"+this.get("target").port;
    },
    toJSON: function(){
      return {
        source: this.get("source"),
        target: this.get("target")
      };
    }
  });

  Edge.Collection = Backbone.Collection.extend({
    model: Edge.Model
  });

}(Dataflow.module("edge")) );

(function(Graph) {
 
  var template = 
    '<div class="edges">'+
      '<svg class="svg-edges" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="800" height="800">'+
        // '<defs>'+  
        //   '<filter id="drop-shadow" >'+ // FIXME Crops the edge when there is no slope
        //     '<feOffset in="SourceAlpha" result="the-shadow" dx="1" dy="1"/>'+
        //     '<feBlend in="SourceGraphic" in2="the-shadow" mode="normal" />'+
        //   '</filter>'+
        // '</defs>'+
      '</svg>'+
    '</div>'+
    '<div class="nodes" />';

  // Dependencies
  var Node = Dataflow.module("node");
  var Edge = Dataflow.module("edge");

  Graph.Views.Main = Backbone.View.extend({
    template: _.template(template),
    className: "graph",
    initialize: function() {
      var nodes = this.model.get("nodes");
      var edges = this.model.get("edges");

      // Initialize nodes
      this.nodes = nodes.view = new Node.Views.Collection({
        collection: nodes
      });
      // Initialize edges
      this.edges = edges.view = new Edge.Views.Collection({
        collection: edges
      });
    },
    render: function() {
      // Graph container
      this.$el.html(this.template(this.model.toJSON()));

      // Render nodes
      var nodes = this.model.get("nodes");
      nodes.view.render();
      nodes.view.renderAllItems();
      this.$(".nodes").html(nodes.view.el);

      // Render edges
      var edges = this.model.get("edges");
      edges.view.render();
      edges.view.renderAllItems();
      // Edge SVG path is appended in edge view initialize

      // HACK to get them to show correct positions on load
      var self = this;
      _.defer(function(){
        self.rerenderEdges();
      }, this);

      return this;
    },
    rerenderEdges: function(){
      _.each(this.edges.viewsByCid, function(edgeView){
        edgeView.render();
      }, this);
    }
  });

}(Dataflow.module("graph")) );

( function(Node) {

  var template = 
    '<h1><%= id %>: <%= label %></h1>'+
    '<div class="controls">'+
      '<button class="delete">delete</button>'+
    '</div>'+
    // '<button class="edit">edit</button>'+
    '<div class="ports ins" />'+
    '<div class="ports outs" />';

  // Dependencies
  var Input = Dataflow.module("input");
  var Output = Dataflow.module("output");
 
  Node.Views.Main = Backbone.View.extend({
    template: _.template(template),
    className: "node",
    events: {
      "click .delete": "deleteMe",
      "dragstop":      "dragStop"
    },
    initialize: function() {
      // Initial position
      this.$el.css({
        left: this.model.get("x"),
        top: this.model.get("y")
      });

      // Initialize i/o views
      this.model.inputs.view = new Input.Views.Collection({
        collection: this.model.inputs
      });
      this.model.inputs.view.render();
      this.model.inputs.view.renderAllItems();
      this.inputs = this.model.inputs.view;
      // Outs
      this.model.outputs.view = new Output.Views.Collection({
        collection: this.model.outputs
      });
      this.model.outputs.view.render();
      this.model.outputs.view.renderAllItems();
      this.outputs = this.model.outputs.view;

      var self = this;
      this.$el.draggable({
        helper: function(){
          var node = self.$el;
          var width = node.width();
          var height = node.height();
          return $('<div class="node helper" style="width:'+width+'px; height:'+height+'px">');
        }
      });
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));

      this.$(".ins").html(this.inputs.el);
      this.$(".outs").html(this.outputs.el);

      return this;
    },
    dragStop: function(event, ui){
      var x = parseInt(ui.position.left, 10);
      var y = parseInt(ui.position.top, 10);
      this.$el.css({
        left: x,
        top: y
      });
      this.model.set({
        x: x,
        y: y
      });
      this.model.collection.sort({silent: true});
      this.model.trigger("move", this.model);
    },
    deleteMe: function(){
      this.model.collection.remove(this.model);
    }
  });

  Node.Views.Collection = Backbone.CollectionView.extend({
    itemView: Node.Views.Main
  }); 

}(Dataflow.module("node")) );

( function(Input) {

  var Edge = Dataflow.module("edge");

  var template = 
    '<span class="plug in" title="drag to edit wire"></span>'+ //i18n
    '<span class="hole in" title="drag to make new wire"></span>'+ //i18n
    '<span class="label in"><%= id %></span>';
 
  Input.Views.Main = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "port in",
    events: {
      "dragstart .hole":  "newEdgeStart",
      "drag      .hole":  "newEdgeDrag",
      "dragstop  .hole":  "newEdgeStop",
      "click     .plug":  "highlightEdge",
      "dragstart .plug":  "changeEdgeStart",
      "drag      .plug":  "changeEdgeDrag",
      "dragstop  .plug":  "changeEdgeStop",
      "drop":             "connectEdge"
    },
    initialize: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.addClass(this.model.get("type"));
      var self = this;
      this.$(".plug").draggable({
        helper: function(){
          return $('<span class="plug in helper" />');
        },
        disabled: true
      });
      this.$(".hole").draggable({
        helper: function(){
          return $('<span class="plug out helper" />')
            .data({port: self.model});
        }
      });
      this.$el.droppable({
        accept: ".plug.in, .hole.out",
        activeClassType: "droppable-hover"
      });
    },
    render: function(){
    },
    newEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdgeNew = new Edge.Model({
        target: {
          node: this.model.node.id,
          port: this.model.id
        },
        graph: this.model.node.graph,
        preview: true
      });
      this.previewEdgeNewView = new Edge.Views.Main({
        model: this.previewEdgeNew
      });
      var graphSVGElement = this.model.node.graph.view.$('.svg-edges')[0];
      graphSVGElement.appendChild(this.previewEdgeNewView.el);
    },
    newEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdgeNewView.render(ui.offset);
      this.model.node.graph.edges.view.sizeSvg();
    },
    newEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      this.previewEdgeNewView.remove();
      delete this.previewEdgeNew;
      delete this.previewEdgeNewView;
    },
    highlightEdge: function() {
      if (this.isConnected){
      }
    },
    changeEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      if (this.isConnected){
        var changeEdge = this.model.node.graph.edges.find(function(edge){
          return edge.target === this.model;
        }, this);
        if (changeEdge){
          this.changeEdge = changeEdge;
          ui.helper.data({
            port: changeEdge.source
          });
          this.previewEdgeChange = new Edge.Model({
            source: changeEdge.get("source"),
            graph: this.model.node.graph,
            preview: true
          });
          this.previewEdgeChangeView = new Edge.Views.Main({
            model: this.previewEdgeChange
          });
          var graphSVGElement = this.model.node.graph.view.$('.svg-edges')[0];
          graphSVGElement.appendChild(this.previewEdgeChangeView.el);
        }
      }
    },
    changeEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      
      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.render(ui.offset);
        this.model.node.graph.edges.view.sizeSvg();
      }
    },
    changeEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.remove();
        if (this.changeEdge) {
          if (ui.helper.data("removeChangeEdge")){
            this.changeEdge.collection.remove(this.changeEdge);
          }
          this.changeEdge = null;
        }
        delete this.previewEdgeChange;
        delete this.previewEdgeChangeView;
      }
    },
    connectEdge: function(event, ui) {
      // Dropped to this el
      var otherPort = ui.helper.data("port");
      var oldLength = this.model.node.graph.edges.length;
      this.model.node.graph.edges.add({
        id: otherPort.node.id+":"+otherPort.id+"→"+this.model.node.id+":"+this.model.id,
        graph: this.model.node.graph,
        source: {
          node: otherPort.node.id,
          port: otherPort.id
        },
        target: {
          node: this.model.node.id,
          port: this.model.id
        }
      });
      // Tells changeEdgeStop to remove to old edge
      ui.helper.data("removeChangeEdge", (oldLength < this.model.node.graph.edges.length));
    },
    holePosition: function(){
      return this.$(".hole").offset();
    },
    isConnected: false,
    plugSetActive: function(){
      this.$(".plug").draggable("enable");
      this.$(".plug").addClass("active");
      this.isConnected = true;
    },
    plugCheckActive: function(){
      var isConnected = this.model.node.graph.edges.some(function(edge){
        return (edge.target === this.model);
      }, this);
      if (!isConnected) {
        this.$(".plug").draggable("disable");
        this.$(".plug").removeClass("active");
        this.isConnected = false;
      }
    }
  });

  Input.Views.Collection = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Input.Views.Main
  }); 

}(Dataflow.module("input")) );

( function(Output) {

  var Edge = Dataflow.module("edge");
 
  var template = 
    '<span class="label out"><%= id %></span>'+
    '<span class="hole out" title="drag to make new wire"></span>'+
    '<span class="plug out" title="drag to edit wire"></span>';

  Output.Views.Main = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "port out",
    events: {
      "dragstart .hole":  "newEdgeStart",
      "drag .hole":       "newEdgeDrag",
      "dragstop .hole":   "newEdgeStop",
      "dragstart .plug":  "changeEdgeStart",
      "drag .plug":       "changeEdgeDrag",
      "dragstop .plug":   "changeEdgeStop",
      "drop":             "connectEdge"
    },
    initialize: function () {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.addClass(this.model.get("type"));
      var self = this;
      this.$(".plug").draggable({
        helper: function(){
          return $('<span class="plug out helper" />');
        },
        disabled: true
      });
      this.$(".hole").draggable({
        helper: function(){
          return $('<span class="plug in helper" />')
            .data({port: self.model});
        }
      });
      this.$el.droppable({
        accept: ".plug.out, .hole.in",
        activeClassType: "droppable-hover"
      });
    },
    render: function () {
    },
    newEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdge = new Edge.Model({
        source: {
          node: this.model.node.id,
          port: this.model.id
        },
        graph: this.model.node.graph,
        preview: true
      });
      this.previewEdgeView = new Edge.Views.Main({
        model: this.previewEdge
      });
      var graphSVGElement = this.model.node.graph.view.$('.svg-edges')[0];
      graphSVGElement.appendChild(this.previewEdgeView.el);
    },
    newEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdgeView.render(ui.offset);
      this.model.node.graph.edges.view.sizeSvg();
    },
    newEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      this.previewEdgeView.remove();
      delete this.previewEdge;
      delete this.previewEdgeView;
    },
    changeEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      if (this.isConnected){
        var changeEdge = this.model.node.graph.edges.find(function(edge){
          return edge.source === this.model;
        }, this);
        if (changeEdge){
          this.changeEdge = changeEdge;
          ui.helper.data({
            port: changeEdge.target
          });
          this.previewEdgeChange = new Edge.Model({
            target: changeEdge.get("target"),
            graph: this.model.node.graph,
            preview: true
          });
          this.previewEdgeChangeView = new Edge.Views.Main({
            model: this.previewEdgeChange
          });
          var graphSVGElement = this.model.node.graph.view.$('.svg-edges')[0];
          graphSVGElement.appendChild(this.previewEdgeChangeView.el);
        }
      }
    },
    changeEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.render(ui.offset);
        this.model.node.graph.edges.view.sizeSvg();
      }
    },
    changeEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.remove();
        if (this.changeEdge) {
          if (ui.helper.data("removeChangeEdge")){
            this.changeEdge.collection.remove(this.changeEdge);
          }
          this.changeEdge = null;
        }
        delete this.previewEdgeChange;
        delete this.previewEdgeChangeView;
      }
    },
    connectEdge: function(event, ui) {
      // Dropped to this el
      var otherPort = ui.helper.data("port");
      var oldLength = this.model.node.graph.edges.length;
      this.model.node.graph.edges.add({
        id: this.model.node.id+":"+this.model.id+"→"+otherPort.node.id+":"+otherPort.id,
        graph: this.model.node.graph,
        source: {
          node: this.model.node.id,
          port: this.model.id
        },
        target: {
          node: otherPort.node.id,
          port: otherPort.id
        }
      });
      // Tells changeEdgeStop to remove to old edge
      ui.helper.data("removeChangeEdge", (oldLength < this.model.node.graph.edges.length));
    },
    holePosition: function () {
      return this.$(".hole").offset();
    },
    plugSetActive: function(){
      this.$(".plug").draggable("enable");
      this.$(".plug").addClass("active");
      this.isConnected = true;
    },
    plugCheckActive: function(){
      var isConnected = this.model.node.graph.edges.some(function(edge){
        return (edge.source === this.model);
      }, this);
      if (!isConnected) {
        this.$(".plug").draggable("disable");
        this.$(".plug").removeClass("active");
        this.isConnected = false;
      }
    }
  });

  Output.Views.Collection = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Output.Views.Main
  }); 

}(Dataflow.module("output")) );

( function(Edge) {

  // Thanks bobince http://stackoverflow.com/a/3642265/592125
  var makeSVG = function(tag, attrs) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
      if (k === "xlink:href") {
        // Pssh namespaces...
        svg.setAttributeNS('http://www.w3.org/1999/xlink','href', attrs[k]);
      } else {
        svg.setAttribute(k, attrs[k]);
      }
    }
    return svg;
  };
  
  Edge.Views.Main = Backbone.View.extend({
    tagName: "div",
    className: "edge",
    positions: null,
    initialize: function() {
      this.positions = {
        from: null, 
        to: null
      };
      // Render on source/target view move
      if (this.model.source) {
        this.model.source.node.on("move", this.render, this);
      }
      if (this.model.target) {
        this.model.target.node.on("move", this.render, this);
      }
      // Set port plug active
      if (this.model.source) {
        this.model.source.view.plugSetActive();
      }
      if (this.model.target) {
        this.model.target.view.plugSetActive();
      }
      // Made SVG elements
      this.el = makeSVG("path", {
        // "filter": "url(#drop-shadow)"
      });
      this.$el = $(this.el);
      // Add el to SVG
      if (this.model.graph) {
        var self = this;
        _.defer(function(){
          self.model.graph.view.$('.svg-edges')[0].appendChild(self.el);
        }, this);
      }
    },
    render: function(previewPosition){
      if (this.model.source) {
        this.positions.from = this.model.source.view.holePosition();
      }
      else {
        // Preview 
        this.positions.from = previewPosition;
      }
      if (this.model.target) {
        this.positions.to = this.model.target.view.holePosition();
      } else {
        // Preview
        this.positions.to = previewPosition;
      }
      this.el.setAttribute("d", this.edgePath(this.positions));
      // Bounding box
      if (this.model.collection) {
        this.model.collection.view.sizeSvg();
      }
    },
    edgePath: function(positions){
      return "M " + positions.from.left + " " + positions.from.top + 
        " L " + (positions.from.left+50) + " " + positions.from.top +
        " L " + (positions.to.left-50) + " " + positions.to.top +
        " L " + positions.to.left + " " + positions.to.top;
    },
    remove: function(){
      // Remove listeners
      if (this.model.source) {
        this.model.source.node.off("move", this.render, this);
      }
      if (this.model.target) {
        this.model.target.node.off("move", this.render, this);
      }
      // Check if port plug is still active
      if (this.model.source) {
        this.model.source.view.plugCheckActive();
      }
      if (this.model.target) {
        this.model.target.view.plugCheckActive();
      }
      // Remove element
      this.$el.remove();
    }
  });

  Edge.Views.Collection = Backbone.CollectionView.extend({
    itemView: Edge.Views.Main,
    sizeSvg: function(){
      // TODO timeout to not do this with many edge resizes at once
      try{
        var svg = this.collection.graph.view.$('.svg-edges')[0];
        var rect = svg.getBBox();
        svg.setAttribute("width", Math.round(rect.x+rect.width+50));
        svg.setAttribute("height", Math.round(rect.y+rect.height+50));
      } catch (error) {}
    }
  }); 

}(Dataflow.module("edge")) );
