/*! dataflow.js - v0.0.7 - 2013-10-06 (7:24:40 PM GMT+0200)
* Copyright (c) 2013 Forrest Oliphant; Licensed MIT, GPL */
// Thanks bobnice http://stackoverflow.com/a/1583281/592125

// Circular buffer storage. Externally-apparent 'length' increases indefinitely
// while any items with indexes below length-n will be forgotten (undefined
// will be returned if you try to get them, trying to set is an exception).
// n represents the initial length of the array, not a maximum

function CircularBuffer(n) {
  this._array= new Array(n);
  this.length= 0;
}
CircularBuffer.prototype.toString= function() {
  return '[object CircularBuffer('+this._array.length+') length '+this.length+']';
};
CircularBuffer.prototype.get= function(i) {
  if (i<0 || i<this.length-this._array.length)
    return undefined;
  return this._array[i%this._array.length];
};
CircularBuffer.prototype.set = function(i, v) {
  if (i<0 || i<this.length-this._array.length)
    throw CircularBuffer.IndexError;
  while (i>this.length) {
    this._array[this.length%this._array.length] = undefined;
    this.length++;
  }
  this._array[i%this._array.length] = v;
  if (i==this.length)
    this.length++;
};
CircularBuffer.prototype.push = function(v) {
  this._array[this.length%this._array.length] = v;
  this.length++;
};
CircularBuffer.IndexError= {};

(function(){
  var App = Backbone.Model.extend({
    "$": function(query) {
      return this.$el.find(query);
    },
    initialize: function(q){
      this.el = document.createElement("div");
      this.el.className = "dataflow";
      this.$el = $(this.el);

      // Make available in console
      this.$el.data("dataflow", this);

      // Setup cards
      var Card = Dataflow.prototype.module("card");
      this.shownCards = new Card.Collection();
      this.shownCards.view = new Card.CollectionView({
        collection: this.shownCards
      });
      this.$el.append(this.shownCards.view.$el);

      // Debug mode
      this.debug = this.get("debug");

      // Show controls?
      this.controls = this.get("controls");
      if (this.controls !== false) {
        // Default to true
        this.controls = true;
      }

      if (this.controls) {
        // Add plugins
        for (var name in this.plugins) {
          if (this.plugins[name].initialize) {
            this.plugins[name].initialize(this);
          }
        }
      }

      // Show form fields on inputs?
      this.inputs = this.get("inputs");
      if (this.inputs !== false) {
        // Default to true
        this.inputs = true;
      }

      // Wires and names editable?
      this.editable = this.get("editable");
      if (this.editable !== false) {
        // Default to true
        this.editable = true;
      }

      // Add the main element to the page
      var appendTo = this.get("appendTo");
      appendTo = appendTo ? appendTo : "body";
      if (appendTo==="body") {
        // Fill whole page
        $("html, body").css({
          margin: "0px",
          padding: "0px",
          width: "100%",
          height: "100%"
        });
      }
      $(appendTo).append(this.el);

      if (!this.id) {
        this.id = $(appendTo).attr('id');
      }

      // Initialize state
      this.loadState();
    },
    
    // Create the object to contain the modules
    modules: {},
    module: function(name) {
      // Create a new module reference scaffold or load an existing module.
      // If this module has already been created, return it.
      if (this.modules[name]) {
        return this.modules[name];
      }
      // Create a module scaffold and save it under this name
      this.modules[name] = {};
      return this.modules[name];
    },
    // Create the object to contain the nodes
    nodes: {},
    node: function(name) {
      // Create a new node reference scaffold or load an existing node.
      // If this node has already been created, return it.
      if (this.nodes[name]) {
        return this.nodes[name];
      }
      // Create a node scaffold and save it under this name
      this.nodes[name] = {
        description: ''
      };
      return this.nodes[name];
    },
    plugins: {},
    plugin: function(name) {
      if (this.plugins[name]) {
        return this.plugins[name];
      }
      this.plugins[name] = {};
      return this.plugins[name];
    },
    addCard: function (card, leaveUnpinned) {
      if (!leaveUnpinned) {
        // Clear unpinned
        this.hideCards();
      }
      if (this.shownCards.get(card)) {
        // Bring to top
        this.shownCards.view.bringToTop(card);
      } else {
        // Add to collection
        this.shownCards.add(card);
      }
    },
    removeCard: function (card) {
      this.shownCards.remove(card);
    },
    hideCards: function () {
      // Clear unpinned
      var unpinned = this.shownCards.where({pinned:false});
      this.shownCards.remove(unpinned);
    },
    addPlugin: function (info) {
      var plugin = this.plugins[info.id];
      if (!plugin) {
        this.plugins[info.id] = plugin = {};
      }
      plugin.info = info;
      plugin.enabled = true;

      if (info.menu) {
        var Card = Dataflow.prototype.module("card");
        var card = new Card.Model({
          dataflow: this,
          card: {el:info.menu}, // HACK since plugins are not bb views
          pinned: (info.pinned ? true : false)
        });

        plugin.card = card;

        this.plugins.menu.addPlugin({
          id: info.id,
          icon: info.icon,
          label: info.label,
          showLabel: false
        });
      }
    },
    showPlugin: function (name) {
      if (this.plugins[name] && this.plugins[name].card) {
        this.addCard(this.plugins[name].card);
        if (typeof this.plugins[name].onShow === 'function') {
          // Let the plugin know it has been shown
          this.plugins[name].onShow();
        }
      }
    },
    enablePlugin: function (name) {
      var plugin = this.plugins[name];
      if (plugin) {
        this.addPlugin(plugin.info);
      }
    },
    disablePlugin: function (name) {
      this.plugins.menu.disablePlugin(name);
    },
    showContextBar: function () {
      this.contextBar.view.$el.show();
    },
    hideContextBar: function () {
      this.contextBar.view.$el.hide();
    },
    contexts: {},
    prepareContext: function (ctx) {
      if (this.contexts[ctx]) {
        return this.contexts[ctx];
      }

      var MenuCard = this.module('menucard');
      this.contexts[ctx] = new MenuCard.Model({
        id: 'context-' + ctx,
        dataflow: this,
        pinned: true
      });
      this.contexts[ctx].view = new MenuCard.View({
        model: this.contexts[ctx]
      });
      return this.contexts[ctx];
    },
    addContext: function (info) {
      _.each(info.contexts, function (ctx) {
        var context = this.prepareContext(ctx);
        context.menu.add(info);
      }, this);
    },
    changeContext: function (selectedNodes, selectedEdges) {
      var add = function (ctx, label) {
        if (!this.contexts[ctx]) {
          return;
        }
        this.contexts[ctx].set('label', label);
        if (!this.shownCards.get('context-' + ctx)) {
          this.shownCards.add(this.contexts[ctx]);
        }
      }.bind(this);
      var remove = function (ctx) {
        if (!this.shownCards.get('context-' + ctx)) {
          return;
        }
        this.shownCards.remove('context-' + ctx);
      }.bind(this);
      if (selectedNodes.length > 1) {
        add('nodes', selectedNodes.length + ' nodes');
        remove('node');
      } else if (selectedNodes.length === 1) {
        add('node', selectedNodes[0].get('label'));
        remove('nodes');
      } else {
        remove('node');
        remove('nodes');
      }
      if (selectedEdges.length > 1) {
        add('edges', selectedEdges.length + ' edges');
        remove('edge');
      } else if (selectedEdges.length === 1) {
        add('edge', selectedEdges[0].id);
        remove('edges');
      } else {
        remove('edge');
        remove('edges');
      }
    },
    loadGraph: function (source) {
      if (this.graph) {
        if (this.currentGraph.view) {
          this.currentGraph.view.remove();
        }
        if (this.graph.view) {
          this.graph.view.remove();
        }
        this.graph.remove();
      }
      var Graph = this.module("graph");

      source.dataflow = this;
      var newGraph = new Graph.Model(source);
      newGraph.view = new Graph.View({model: newGraph});
      this.$el.append(newGraph.view.render().el);

      // For debugging
      this.graph = this.currentGraph = newGraph;

      return newGraph;
    },
    showGraph: function(graph){
      // Hide current
      this.currentGraph.view.$el.detach();
      // Show new
      this.$el.append(graph.view.el);
      graph.view.render();
      this.currentGraph = graph;
    },
    debug: false,
    log: function(message) {
      this.trigger("log", message, arguments);
      if (this.debug) {
        console.log("Dataflow: ", arguments);
      }
    },
    types: [
      "all",
      "canvas:2d",
      "canvas:webgl",
      "string",
      "number",
      "int",
      "object",
      "array"
    ]
  });

  // Our global
  window.Dataflow = App;
  if (typeof exports === 'object') {
    // CommonJS export
    exports.Dataflow = App;
  }

  // Backbone hacks
  // Discussed here http://stackoverflow.com/a/13075845/592125
  Backbone.View.prototype.addEvents = function(events) {
    this.delegateEvents( _.extend(_.clone(this.events), events) );
  };

  // Simple collection view
  Backbone.CollectionView = Backbone.Model.extend({
    // this.tagName and this.itemView should be set
    prepend: false,
    initialize: function(options){
      if (options.tagName) {
        this.tagName = options.tagName;
      }
      if (options.className) {
        this.className = options.className;
      }
      if (options.itemView) {
        this.itemView = options.itemView;
      }
      this.el = document.createElement(this.tagName);
      this.el.className = this.className;
      this.$el = $(this.el);
      this.parent = options.parent;
      var collection = this.collection = this.get("collection");
      collection.each(this.addItem, this);
      collection.on("add", this.addItem, this);
      collection.on("remove", this.removeItem, this);
    },
    addItem: function(item){
      if (!item.view) {
        item.view = new this.itemView({
          model:item,
          parent: this.parent
        });
        item.view.render();
      }
      if (this.prepend) {
        this.$el.prepend(item.view.el);
      } else {
        this.$el.append(item.view.el);
      }
    },
    removeItem: function(item){
      item.view.remove();
    }
  });
}());

// All code has been downloaded and evaluated and app is ready to be initialized.
// jQuery(function($) {

//   // Router
//   var DataflowRouter = Backbone.Router.extend({
//     routes: {
//       "": "index"
//     },
//     index: function() {

//     }
//   });
//   Dataflow.router = new DataflowRouter();
//   Backbone.history.start();

// });

(function(Dataflow) {
  var StateModel = Backbone.Model.extend({});

  Dataflow.prototype.loadState = function () {
    // Initialize State with localStorage
    var stateKey = 'dataflow-' + (this.id ? this.id : this.cid);
    var stateData = JSON.parse(window.localStorage.getItem(stateKey));
    if (!stateData) {
      stateData = {};
    }

    var state = new StateModel(stateData);
    this.set('state', state);

    // Set up persistence
    state.on('change', function (stateInstance) {
      window.localStorage.setItem(stateKey, JSON.stringify(stateInstance.toJSON()));
    });
  };

}(Dataflow));

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

( function(Dataflow) {

  var Input = Dataflow.prototype.module("input");
 
  Input.Model = Backbone.Model.extend({
    defaults: {
      id: "input",
      description: "",
      label: "",
      type: "all",
      multiple: true
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
      if (this.get("label")===""){
        this.set({label: this.id});
      }
      this.connected = [];
    },
    canConnect: function (edge) {
      if (!this.get('multiple') && this.connected.length) {
        // This port doesn't allow multiple connections and
        // there is a connection already, decline
        return false;
      }
      return true;
    },
    connect: function(edge){
      if (!this.canConnect(edge)) {
        return;
      }
      this.connected.push(edge);
      this.connected = _.uniq(this.connected);
      this.trigger('connected');
    },
    disconnect: function(edge){
      this.connected = _.without(this.connected, edge);
      if (this.connected.length === 0) {
        this.trigger('disconnected');
      }
    },
    remove: function(){
      // Port removed from node's inputs collection
      // Remove related edges
      while (this.connected.length > 0) {
        this.connected[0].remove();
      }
    }

  });

  Input.Collection = Backbone.Collection.extend({
    model: Input.Model
  });

}(Dataflow) );

( function(Dataflow) {

  var Input = Dataflow.prototype.module("input");
  var Output = Dataflow.prototype.module("output");
 
  // Output extends input
  Output.Model = Input.Model.extend({
    defaults: {
      id: "output",
      label: "",
      type: "all",
      description: "",
      multiple: true
    }
  });

  Output.Collection = Backbone.Collection.extend({
    model: Output.Model
  });

}(Dataflow) );

( function(Dataflow) {

  var Edge = Dataflow.prototype.module("edge");

  Edge.Model = Backbone.Model.extend({
    defaults: {
      "z": 0,
      "route": 0,
      "selected": false,
      "log": null
    },
    initialize: function() {
      var nodes, sourceNode, targetNode;
      var preview = this.get("preview");
      this.parentGraph = this.get("parentGraph");
      this.attributes.log = new CircularBuffer(50);
      if (preview) {
        // Preview edge
        nodes = this.get("parentGraph").nodes;
        var source = this.get("source");
        var target = this.get("target");
        if (source) {
          sourceNode = nodes.get( this.get("source").node );
          this.source = sourceNode.outputs.get( this.get("source").port );
        } else if (target) {
          targetNode = nodes.get( this.get("target").node );
          this.target = targetNode.inputs.get( this.get("target").port );
        }
      } else {
        // Real edge
        // this.parentGraph = this.get("parentGraph");
        nodes = this.parentGraph.nodes;
        try{
          sourceNode = nodes.get( this.get("source").node );
          this.source = sourceNode.outputs.get( this.get("source").port );
          targetNode = nodes.get( this.get("target").node );
          this.target = targetNode.inputs.get( this.get("target").port );
        }catch(e){
          // Dataflow.log("node or port not found for edge", this);
        }

        this.source.connect(this);
        this.target.connect(this);

        // Set up listener
        sourceNode.on("send:"+this.source.id, this.send, this);

        this.bringToTop();

        // Selection event
        this.on("select", this.select, this);
      }
    },
    select: function() {
      this.parentGraph.trigger("select:edge", this);
    },
    send: function (value) {
      this.target.parentNode.recieve( this.target.id, value );
    },
    isConnectedToPort: function(port) {
      return ( this.source === port || this.target === port );
    },
    isConnectedToNode: function(node) {
      return ( this.source.parentNode === node || this.target.parentNode === node );
    },
    toString: function(){
      if (this.id) {
        return this.id;
      }
      return this.get("source").node+":"+this.get("source").port+"::"+this.get("target").node+":"+this.get("target").port;
    },
    toJSON: function(){
      return {
        source: this.get("source"),
        target: this.get("target"),
        route: this.get("route")
      };
    },
    bringToTop: function(){
      var topZ = 0;
      this.parentGraph.edges.each(function(edge){
        if (edge !== this) {
          var thisZ = edge.get("z");
          if (thisZ > topZ) {
            topZ = thisZ;
          }
          if (edge.view){
            edge.view.unhighlight();
          }
        }
      }, this);
      this.set("z", topZ+1);
    },
    remove: function(){
      this.source.disconnect(this);
      this.target.disconnect(this);
      if (this.collection) {
        this.collection.remove(this);
      }
      // Remove listener
      this.source.parentNode.off("send:"+this.source.id, this.send, this);
      this.trigger('remove');
    }
  });

  Edge.Collection = Backbone.Collection.extend({
    model: Edge.Model,
    comparator: function(edge) {
      // Sort edges by z order (z set by clicking; not saved to JSON)
      return edge.get("z");
    }
  });

}(Dataflow) );

(function(Dataflow) {

  var Graph = Dataflow.prototype.module("graph");

  // Dependencies
  var Node = Dataflow.prototype.module("node");
  var Edge = Dataflow.prototype.module("edge");

  var minZoom = 0.20;
  var maxZoom = 1.1;

  var cssZoomSupported = document.createElement("div").style.hasOwnProperty("zoom");

  var template = 
    '<div class="dataflow-graph-panzoom">'+
      '<div class="dataflow-graph zoom-normal">'+
        '<div class="dataflow-edges">'+
          '<svg class="dataflow-svg-edges" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="800" height="800"></svg>'+
        '</div>'+
        '<div class="dataflow-nodes" />'+
      '</div>'+
    '</div>'+
    '<div class="dataflow-graph-controls">'+
      '<button class="dataflow-graph-gotoparent"><i class="icon-chevron-left"></i> back to parent</button>'+
    '</div>';

  Graph.View = Backbone.View.extend({
    template: _.template(template),
    className: "dataflow-g",
    events: {
      "click .dataflow-graph": "deselect",
      "dragstart .dataflow-graph-panzoom": "panStart",
      "drag .dataflow-graph-panzoom": "pan",
      "dragstop .dataflow-graph-panzoom": "panStop",
      "click .dataflow-graph-gotoparent": "gotoParent",
      "mousewheel": "mouseWheel"
      // ".dataflow-graph transformstart": "pinchStart",
      // ".dataflow-graph transform": "pinch",
      // ".dataflow-graph transformend": "pinchEnd"
    },
    initialize: function() {
      // Graph container
      this.$el.html(this.template(this.model.toJSON()));

      var nodes = this.model.get("nodes");
      var edges = this.model.get("edges");

      // Initialize nodes
      this.nodes = nodes.view = {};
      this.model.nodes.each(this.addNode, this);
      this.model.nodes.on("add", this.addNode, this);
      this.model.nodes.on("remove", this.removeNode, this);
      // Initialize edges
      this.edges = edges.view = {};
      this.model.edges.each(this.addEdge, this);
      this.model.edges.on("add", this.addEdge, this);
      this.model.edges.on("remove", this.removeEdge, this);

      // For subgraphs only: navigate up
      var parentNode = this.model.get("parentNode");
      if (!parentNode){
        this.$(".dataflow-graph-controls").hide();
      }

      this.$(".dataflow-graph-panzoom").draggable({
        helper: function(){
          var h = $("<div>");
          this.model.dataflow.$el.append(h);
          return h;
        }.bind(this)
      });

      // Cache the graph div el
      this.$graphEl = this.$(".dataflow-graph");
      this.graphEl = this.$(".dataflow-graph")[0];

      // Default 3D transform
      this.$graphEl.css({
        transform: "translate3d(0, 0, 0) " +
                   "scale3d(1, 1, 1) ",
        transformOrigin: "left top"
      });

      this.bindInteraction();
    },
    panStartOffset: null,
    panStart: function (event, ui) {
      if (!ui) { return; }
      this.panStartOffset = ui.offset;
    },
    pan: function (event, ui) {
      if (!ui) { return; }
      var scale = this.model.get('zoom');
      var deltaX = ui.offset.left - this.panStartOffset.left;
      var deltaY = ui.offset.top - this.panStartOffset.top;
      this.$(".dataflow-graph").css({
        transform: "translate3d("+deltaX/scale+"px, "+deltaY/scale+"px, 0)"
      });
    },
    panStop: function (event, ui) {
      this.$(".dataflow-graph").css({
        transform: "translate3d(0, 0, 0)"
      });
      var scale = this.model.get('zoom');
      var deltaX = ui.offset.left - this.panStartOffset.left;
      var deltaY = ui.offset.top - this.panStartOffset.top;
      this.model.set({
        panX: this.model.get("panX") + deltaX/scale,
        panY: this.model.get("panY") + deltaY/scale
      });
    },
    tempPanX: 0,
    tempPanY: 0,
    setPanDebounce: _.debounce(function () {
      // Moves the graph back to 0,0 and changes pan, which will rerender wires
      this.$(".dataflow-graph").css({
        transform: "translate3d(0, 0, 0)"
      });
      this.model.set({
        panX: this.model.get("panX") + this.tempPanX,
        panY: this.model.get("panY") + this.tempPanY
      });
      this.tempPanX = 0;
      this.tempPanY = 0;
    }, 250),
    mouseWheel: function (event) {
      event.preventDefault();
      var oe = event.originalEvent;
      this.tempPanX += oe.wheelDeltaX/6;
      this.tempPanY += oe.wheelDeltaY/6;
      this.$(".dataflow-graph").css({
        transform: "translate3d("+this.tempPanX+"px, "+this.tempPanY+"px, 0)"
      });
      this.setPanDebounce();
    },
    gotoParent: function () {
      var parentNode = this.model.get("parentNode");
      if (parentNode){
        this.model.dataflow.showGraph( parentNode.parentGraph );
      }
    },
    bindInteraction: function () {
      this.bindZoom();
      this.bindScroll();
    },
    bindZoom: function () {
      if (!window.Hammer) {
        return;
      }
      var currentZoom, startX, startY, originX, originY, scale, deltaX, deltaY, distance_to_origin_x, distance_to_origin_y;
      var self = this;
      Hammer( this.$(".dataflow-graph-panzoom")[0] )
        .on('transformstart', function (event) {
          currentZoom = self.model.get('zoom');
          startX = event.gesture.center.pageX;
          startY = event.gesture.center.pageY;
          originX = startX/currentZoom;
          originY = startY/currentZoom;
          var graphOffset = self.$el.offset();
          distance_to_origin_x = originX - graphOffset.left;
          distance_to_origin_y = originY - graphOffset.top;
          self.$graphEl.css({
            transformOrigin: originX+"px "+originY+"px"
            // transformOrigin: startX+"px "+startY+"px"
          });
        })
        .on('transform', function (event) {
          scale = Math.max(minZoom/currentZoom, Math.min(event.gesture.scale, maxZoom/currentZoom));
          deltaX = (event.gesture.center.pageX - startX) / currentZoom;
          deltaY = (event.gesture.center.pageY - startY) / currentZoom;
          self.$graphEl.css({
            transform: "translate3d("+deltaX+"px,"+deltaY+"px, 0) " +
                       "scale3d("+scale+","+scale+", 1) "
          });
        })
        .on('transformend', function (event) {
          // Reset 3D transform
          self.$graphEl.css({
            transform: "translate3d(0, 0, 0) " +
                       "scale3d(1, 1, 1) "
          });
          // Zoom
          var zoom = currentZoom * scale;
          zoom = Math.max(minZoom, Math.min(zoom, maxZoom));
          self.model.set('zoom', zoom);
          distance_to_origin_x *= zoom;
          distance_to_origin_y *= zoom;
          self.model.set({
            panX: self.model.get("panX") + deltaX,
            panY: self.model.get("panY") + deltaY
          });
          console.log(self.model.attributes);
        });

      var onZoom = function () {
        var z = self.model.get('zoom');
        var lastClass = self.zoomClass;
        self.zoomClass = z < 0.5 ? "zoom-tiny" : (z < 0.8 ? "zoom-small" : (z < 1.3 ? "zoom-normal" : "zoom-big"));
        self.$graphEl
          .removeClass(lastClass)
          .addClass(self.zoomClass);
        self.graphEl.style.zoom = self.model.get('zoom');
      };

      this.model.on('change:zoom', onZoom);

      // Initial zoom this.model from localStorage
      if (this.model.get('zoom') !== 1) {
        onZoom();
      }
    },
    zoomClass: 1,
    zoomIn: function () {
      var currentZoom = this.model.get('zoom');
      var zoom = currentZoom * 0.9;
      zoom = Math.max(minZoom, zoom); 
      if (zoom !== currentZoom) {
        this.model.set('zoom', zoom);
      }
    },
    zoomOut: function () {
      var currentZoom = this.model.get('zoom');
      var zoom = currentZoom * 1.1;
      zoom = Math.min(maxZoom, zoom); 
      if (zoom !== currentZoom) {
        this.model.set('zoom', zoom);
      }
    },
    zoomCenter: function () {
      var currentZoom = this.model.get('zoom');
      var zoom = 1;
      if (zoom !== currentZoom) {
        this.model.set('zoom', 1);
      }
    },
    bindScroll: function () {
    },
    render: function() {
      // HACK to get them to show correct positions on load
      var self = this;
      _.defer(function(){
        self.rerenderEdges();
      }, this);

      return this;
    },
    addNode: function(node){
      // Initialize
      var CustomType = this.model.dataflow.nodes[node.type];
      if (CustomType && CustomType.View) {
        node.view = new CustomType.View({
          model:node,
          graph: this
        });
      } else {
        var BaseNode = this.model.dataflow.node("base");
        node.view = new BaseNode.View({
          model:node,
          graph: this
        });
      }
      // Save to local collection
      this.nodes[node.id] = node.view;
      // Render
      node.view.render();
      this.$(".dataflow-nodes").append(node.view.el);
    },
    removeNode: function(node){
      node.view.remove();
      this.nodes[node.id] = null;
      delete this.nodes[node.id];
    },
    addEdge: function(edge){
      // Initialize
      edge.view = new Edge.View({model:edge});
      // Save to local collection
      this.edges[edge.id] = edge.view;
      // Render
      edge.view.render();
      this.$('.dataflow-svg-edges')[0].appendChild(edge.view.el);
    },
    removeEdge: function(edge){
      if (edge.view) {
        edge.view.remove();
      }
      this.edges[edge.id] = null;
      delete this.edges[edge.id];
    },
    rerenderEdges: function(){
      _.each(this.edges, function(edgeView){
        edgeView.render();
      }, this);
    },
    sizeSVG: function(){
      // TODO timeout to not do this with many edge resizes at once
      try{
        var svg = this.$('.dataflow-svg-edges')[0];
        var rect = svg.getBBox();
        var width =  Math.max( Math.round(rect.x+rect.width +50), 50 );
        var height = Math.max( Math.round(rect.y+rect.height+50), 50 );
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
      } catch (error) {}
    },
    deselect: function () {
      this.model.nodes.invoke("set", {selected:false});
      this.model.edges.invoke("set", {selected:false});
      // this.model.nodes.each(function (node) {
      //   node.set("selected", false);
      // }, this);
      this.model.trigger("selectionChanged");
      this.unfade();
      this.model.dataflow.hideCards();
    },
    fade: function () {
      this.model.nodes.each(function(node){
        if (node.view) {
          if (!node.get('selected')) {
            node.view.fade();
          }
        }
      });
      this.fadeEdges();
    },
    fadeEdges: function () {
      this.model.edges.each(function(edge){
        if (edge.get("selected") || edge.source.parentNode.get("selected") || edge.target.parentNode.get("selected")) {
          edge.view.unfade();
        } else {
          edge.view.fade();
        }
      });
    },
    unfade: function () {
      this.model.nodes.each(function(node){
        if (node.view) {
          node.view.unfade();
        }
      });
      this.model.edges.each(function(edge){
        if (edge.view) {
          edge.view.unfade();
        }
      });
    },
    startHighlightCompatible: function (port, fromInput) {
      this.model.nodes.each(function (node) {
        node.outputs.each(function (output) {
          if (output === port) {
            return;
          }
          if (!fromInput) {
            output.view.blur();
            return;
          }
          if (output.canConnect() && (port.get('type') == 'all' || output.get('type') === 'all' || output.get('type') === port.get('type'))) {
            return;
          }
          output.view.blur();
        });
        node.inputs.each(function (input) {
          if (input === port) {
            return;
          }
          if (fromInput) {
            input.view.blur();
            return;
          }
          if (input.canConnect() && (port.get('type') == 'all' || input.get('type') === 'all' || input.get('type') === port.get('type'))) {
            return;
          }
          input.view.blur();
        });
      });
    },
    stopHighlightCompatible: function (port, fromInput) {
      this.$el.find('.dataflow-port.blur').removeClass('blur');
    }
  });

}(Dataflow) );

( function(Dataflow) {

  var Node = Dataflow.prototype.module("node");

  // Dependencies
  var Input = Dataflow.prototype.module("input");
  var Output = Dataflow.prototype.module("output");

  var headerTemplate =
    '<h1 class="dataflow-node-title" title="<%- label %>: <%- type %>">'+
    '<% if (icon) { %><i class="icon-<%- icon %>"></i> <% } %>'+
    '<%- label %></h1>';

  var template = 
    '<div class="outer" />'+
    '<div class="dataflow-node-header">'+
      headerTemplate +
    '</div>'+
    '<div class="dataflow-node-ports">'+
      '<div class="dataflow-node-ins"></div>'+
      '<div class="dataflow-node-outs"></div>'+
      '<div style="clear:both;"></div>'+
    '</div>'+
    '<div class="dataflow-node-inner"></div>';

  var innerTemplate = "";

  var zoom;
 
  Node.View = Backbone.View.extend({
    template: _.template(template),
    innerTemplate: _.template(innerTemplate),
    className: "dataflow-node",
    events: function(){
      return {
        "click .dataflow-node-header":  "select",
        "dragstart": "dragStart",
        "drag":      "drag",
        "dragstop":  "dragStop"
      };
    },
    initialize: function(options) {
      var templateData = this.model.toJSON();
      templateData.icon = this.model.getIcon();
      this.$el.html(this.template(templateData));

      this.graph = options.graph;

      // Add type class
      this.$el.addClass(this.model.type);

      if (!this.model.parentGraph.dataflow.editable) {
        // No edit name
        this.$(".dataflow-node-edit").hide();
      }

      // Initialize i/o views
      this.inputs = this.model.inputs.view = new Input.CollectionView({
        collection: this.model.inputs,
        parent: this
      });
      // Outs
      this.outputs = this.model.outputs.view = new Output.CollectionView({
        collection: this.model.outputs,
        parent: this
      });

      var self = this;
      this.$el.draggable({
        handle: "h1",
        helper: function(){
          return $('<div>');
        }
      });

      this.$el.data("dataflow-node-view", this);

      // Inner template
      this.$(".dataflow-node-inner").append(this.innerTemplate);

      // Listener to reset inputs list
      // this.inputs.on("change", function(input){
      //   this.$inputsList = null;
      // }, this);

      // Listen for graph panning
      this.listenTo(this.model.parentGraph, "change:panX change:panY", this.bumpPosition);

      // Selected listener
      this.listenTo(this.model, "change:selected", this.selectedChanged);

      this.listenTo(this.model, "change:label change:icon", this.changeHeader);

      this.listenTo(this.model, "remove", this.hideInspector);

      this.$inner = this.$(".dataflow-node-inner");
    },
    render: function() {
      // Initial position
      this.$el.css({
        left: this.model.get("x") + this.model.parentGraph.get("panX"),
        top: this.model.get("y") + this.model.parentGraph.get("panY")
      });

      this.$(".dataflow-node-ins").html(this.inputs.el);
      this.$(".dataflow-node-outs").html(this.outputs.el);

      // Hide controls
      this.$(".dataflow-node-controls").hide();
      this.$(".label-edit").hide();

      return this;
    },
    _alsoDrag: [],
    _dragDelta: {},
    $dragHelpers: $('<div class="dataflow-nodes-helpers">'),
    dragStart: function(event, ui){
      if (!ui){ return; }
      // Select this
      if (!this.model.get("selected")){
        this.select(event, true);
      }

      // Don't drag graph
      event.stopPropagation();

      // Current zoom
      zoom = this.model.parentGraph.get('zoom');

      this.$dragHelpers.css({
        transform: "translate3d(0,0,0)"
      });
      this.$el.parent().append( this.$dragHelpers );

      // Make helper and save start position of all other selected
      var self = this;
      this._alsoDrag = this.model.collection.where({selected:true});

      _.each(this._alsoDrag, function(node){
        var $el = node.view.$el;
        // Add helper
        var helper = $('<div class="dataflow-node helper">').css({
          width: $el.width(),
          height: $el.height(),
          left: parseInt($el.css('left'), 10),
          top: parseInt($el.css('top'), 10)
        });
        this.$dragHelpers.append(helper);
      }, this);

    },
    changeHeader: function () {
      var templateData = this.model.toJSON();
      templateData.icon = this.model.getIcon();
      this.$(".dataflow-node-header")
        .html(_.template(headerTemplate, templateData));
    },
    drag: function(event, ui){
      if (!ui){ return; }
      // Don't drag graph
      event.stopPropagation();

      var x = (ui.position.left - ui.originalPosition.left) / zoom;
      var y = (ui.position.top - ui.originalPosition.top) / zoom;
      this.$dragHelpers.css({
        transform: "translate3d("+x+"px,"+y+"px,0)"
      });
    },
    dragStop: function(event, ui){
      if (!ui){ return; }
      // Don't drag graph
      event.stopPropagation();

      var panX = this.model.parentGraph.get("panX");
      var panY = this.model.parentGraph.get("panY");
      var deltaX = (ui.position.left - ui.originalPosition.left) / zoom;
      var deltaY = (ui.position.top - ui.originalPosition.top) / zoom;
      // this.moveToPosition(this.model.get("x") + deltaX, this.model.get("y") + deltaY);
      // Also drag
      if (this._alsoDrag.length) {
        _.each(this._alsoDrag, function(node){
          node.view.moveToPosition(node.get("x") + deltaX, node.get("y") + deltaY);
        }, this);
        this._alsoDrag = [];
      }
      // Remove helpers
      this.$dragHelpers.empty();
      this.$dragHelpers.remove();
    },
    bumpPosition: function () {
      this.$el.css({
        left: this.model.get("x") + this.model.parentGraph.get("panX"),
        top: this.model.get("y") + this.model.parentGraph.get("panY")
      });
      this.model.trigger("change:x change:y");
    },
    moveToPosition: function(x, y){
      this.model.set({
        x: x,
        y: y
      }, {
        // Don't trigger wire move until bumped
        silent: true
      });
      this.bumpPosition();
    },
    removeModel: function(){
      this.model.remove();
    },
    bringToTop: function () {
      var topZ = 0;
      this.model.collection.each(function(node){
        var thisZ = parseInt(node.view.el.style.zIndex, 10);
        if (thisZ > topZ) {
          topZ = thisZ;
        }
      }, this);
      this.el.style.zIndex = topZ+1;
    },
    select: function(event, deselectOthers){
      // Don't click graph
      if (event) {
        event.stopPropagation();
      }
      var toggle = false;
      var selected = this.model.get("selected");
      if (event && (event.ctrlKey || event.metaKey)) {
        toggle = true;
        selected = !selected;
        this.model.set("selected", selected);
        if (!selected) {
          this.fade();
        }
      } else {
        // Deselect all
        this.model.parentGraph.edges.invoke("set", {selected:false});
        this.model.parentGraph.nodes.invoke("set", {selected:false});
        this.model.parentGraph.view.fade();
        selected = true;
        this.model.set("selected", true);
      }
      this.bringToTop();
      this.model.parentGraph.view.fadeEdges();
      this.model.parentGraph.trigger("selectionChanged");
    },
    inspector: null,
    getInspector: function () {
      if (!this.inspector) {
        var inspect = new Node.InspectView({model:this.model});
        var Card = Dataflow.prototype.module("card");
        this.inspector = new Card.Model({
          dataflow: this.model.parentGraph.dataflow,
          card: inspect
        });
      }
      return this.inspector;
    },
    showInspector: function(leaveUnpinned){
      this.model.parentGraph.dataflow.addCard( this.getInspector(), leaveUnpinned );
    },
    hideInspector: function () {
      this.model.parentGraph.dataflow.removeCard( this.getInspector() );
    },
    fade: function(){
      this.$el.addClass("fade");
      this.$el.removeClass("ui-selected");
    },
    unfade: function(){
      this.$el.removeClass("fade");
    },
    selectedChanged: function () {
      if (this.model.get("selected")) {
        this.highlight();
        this.showInspector();
      } else {
        this.unhighlight();
        this.hideInspector();
      }
    },
    highlight: function () {
      this.$el.removeClass("fade");
      this.$el.addClass("ui-selected");
    },
    unhighlight: function () {
      this.$el.removeClass("ui-selected");
    }//,
    // $inputList: null,
    // getInputList: function() {
    //   if (!this.$inputList) {
    //     this.$inputList = $("<div>");
    //     var model = this.model.toJSON();
    //     this.$inputList.html( this.inspectTemplate(model) );
    //     if (model.id !== model.label) {
    //       this.$inputList.children(".dataflow-node-inspector-title").prepend(model.id + ": ");
    //     }
    //     var $inputs = this.$inputList.children(".dataflow-node-inspector-inputs");
    //     this.model.inputs.each(function(input){
    //       if (input.view && input.view.$input) {
    //         $inputs.append( input.view.$input );
    //       }
    //     }, this);
    //   }
    //   return this.$inputList;
    // }
  });

}(Dataflow) );

( function(Dataflow) {

  var Input = Dataflow.prototype.module("input");

  // Dependencies
  var Edge = Dataflow.prototype.module("edge");

  var template = 
    '<span class="dataflow-port-plug in" title="drag to edit wire"></span>'+ //i18n
    '<span class="dataflow-port-hole in" title="drag to make new wire"></span>'+ //i18n
    '<label class="dataflow-port-label in" title="<%= description %>">'+
      '<%= label %>'+
    '</label>';  

  var zoom = 1;
 
  Input.View = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "dataflow-port dataflow-in",
    events: {
      "click":  "getTopEdge",
      "drop":   "connectEdge",
      "dragstart .dataflow-port-hole":  "newEdgeStart",
      "drag      .dataflow-port-hole":  "newEdgeDrag",
      "dragstop  .dataflow-port-hole":  "newEdgeStop",
      "dragstart .dataflow-port-plug":  "changeEdgeStart",
      "drag      .dataflow-port-plug":  "changeEdgeDrag",
      "dragstop  .dataflow-port-plug":  "changeEdgeStop"
    },
    $input: null,
    initialize: function(options) {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.addClass(this.model.get("type"));

      this.parent = options.parent;

      // Reset hole position
      var node = this.parent.model;
      var graph = node.parentGraph;
      this.listenTo(node, "change:x change:y", function(){
        this._holePosition = null;
      }.bind(this));
      this.listenTo(graph, "change:panX change:panY", function(){
        this._holePosition = null;
      }.bind(this));

      var nodeState = node.get('state');
      if (nodeState && nodeState[this.model.id]) {
        this.$el.addClass('hasvalue');
      }

      if (!this.model.parentNode.parentGraph.dataflow.editable) {
        // No drag and drop
        return;
      }

      var self = this;
      this.$(".dataflow-port-plug").draggable({
        cursor: "pointer",
        helper: function(){
          var helper = $('<span class="dataflow-port-plug in helper" />');
          self.parent.graph.$el.append(helper);
          return helper;
        },
        disabled: true,
        // To prevent accidental disconnects
        distance: 10,
        delay: 100
      });
      this.$(".dataflow-port-hole").draggable({
        cursor: "pointer",
        helper: function(){
          var helper = $('<span class="dataflow-port-plug out helper" />')
            .data({port: self.model});
          self.parent.graph.$el.append(helper);
          return helper;
        }
      });
      this.$el.droppable({
        accept: ".dataflow-port-plug.in, .dataflow-port-hole.out",
        activeClassType: "droppable-hover",
        refreshPositions: true
      });

      if (!this.model.parentNode.parentGraph.dataflow.inputs) {
        // No direct inputs
        return;
      }

      // Initialize direct input
      var type = this.model.get("type");
      var state = this.model.parentNode.get("state");
      options = this.model.get("options");
      if (options !== undefined) {
        // Normalize options
        if (_.isString(options)) {
          options = options.split(' ');
          this.model.set('options', options);
        }
        if (_.isArray(options)) {
          var o = {};
          for (var i=0; i<options.length; i++){
            o[options[i]] = options[i];
          }
          options = o;
          this.model.set('options', options);
        }
      }
      var input = this.renderInput(type, options);

      var val;
      if (state && state[this.model.id] !== undefined){
        // Use the stored state
        val = state[this.model.id];
      } else if (this.model.get("value") !== undefined) {
        // Use the default
        val = this.model.get("value");
      }

      this.setInputValue(input, type, val);

      this.model.parentNode.on('change:state', function () {
        var state = this.model.parentNode.get('state');
        if (!state || state[this.model.id] === undefined) {
          this.$el.removeClass('hasvalue');
          return;
        }
        this.setInputValue(input, type, state[this.model.id]);
        this.$el.addClass('hasvalue');
      }.bind(this));

      var label = $('<label class="input-type-' + type + '">')
        .append( input )
        .prepend( '<span>' + this.model.get("label") + "</span> " );
      this.$input = label;

      // Update connection state on the input field
      if (this.model.connected.length) {
        label.addClass('connected');
      }
      this.model.on('connected', function () {
        this.$input.addClass('connected');
      }, this);
      this.model.on('disconnected', function () {
        this.$input.removeClass('connected');
      }, this);
    },
    renderInput: function (type, options) {
      var input;
      if (options) {
        input = $('<select class="input input-select">');
        for (var name in options) {
          var option = $('<option value="'+options[name]+'">'+name+'</option>')
            .data("val", options[name]);
          input.append(option);
        }
        input.change(this.inputSelect.bind(this));
        return input;
      }
      
      switch (type) {
        case 'int':
        case 'float':
        case 'number':
          var attributes = {};
          if (this.model.get("min") !== undefined) {
            attributes.min = this.model.get("min");
          }
          if (this.model.get("max") !== undefined) {
            attributes.max = this.model.get("max");
          }
          if (type === "int") {
            attributes.step = 1;
          }
          input = $('<input type="number" class="input input-number">')
            .attr(attributes)
            .addClass(type === "int" ? "input-int" : "input-float");
          if (type == 'int') {
            input.change(this.inputInt.bind(this));
          } else {
            input.change(this.inputFloat.bind(this));
          }
          return input;
        case 'boolean':
          input = $('<input type="checkbox" class="input input-boolean"><div class="input-boolean-checkbox"/>');
          input.change(this.inputBoolean.bind(this));
          return input;
        case 'object':
          input = $('<textarea class="input input-object"></textarea>');
          input.on('change, keyup', this.inputObject.bind(this));
          return input;
        case 'bang':
          input = $('<button class="input input-bang">!</button>');
          input.click(this.inputBang.bind(this));
          return input;
        default:
          input = $('<input class="input input-string">');
          input.change(this.inputString.bind(this));
          return input;
      }
    },
    setInputValue: function (input, type, value) {
      if (!input) {
        return;
      }
      if (input[0].tagName === 'SELECT') {
        $('option', input).each(function () {
          var selectVal = $(this).data('val');
          $(this).prop('selected', selectVal == value);
        });
        return;
      }
      if (type === 'boolean') {
        input.prop('checked', value);
        return;
      }
      if (type === 'object') {
        input.text(JSON.stringify(value, null, 2));
        return;
      }
      input.val(value);
    },
    inputSelect: function(e){
      var val = $(e.target).find(":selected").data("val");
      this.model.parentNode.setState(this.model.id, val);
    },
    inputInt: function(e){
      this.model.parentNode.setState(this.model.id, parseInt($(e.target).val(), 10));
    },
    inputFloat: function(e){
      this.model.parentNode.setState(this.model.id, parseFloat($(e.target).val()));
    },
    inputString: function(e){
      this.model.parentNode.setState(this.model.id, $(e.target).val());
    },
    inputBoolean: function(e){
      this.model.parentNode.setState(this.model.id, $(e.target).prop("checked"));
    },
    inputObject: function(e){
      try {
        var obj = JSON.parse($(e.target).text());
        this.model.parentNode.setState(this.model.id, obj);
      } catch (err) {
        // TODO: We need error handling in the form
      }
    },
    inputBang: function(){
      this.model.parentNode.setBang(this.model.id);
    },
    render: function(){
      return this;
    },
    newEdgeStart: function(event, ui){
      if (!ui) { return; }
      // Don't drag node
      event.stopPropagation();
      
      ui.helper.data({
        route: this.topRoute
      });
      this.previewEdgeNew = new Edge.Model({
        target: {
          node: this.model.parentNode.id,
          port: this.model.id
        },
        parentGraph: this.model.parentNode.parentGraph,
        preview: true,
        route: this.topRoute
      });
      this.previewEdgeNewView = new Edge.View({
        model: this.previewEdgeNew
      });
      var graphSVGElement = this.model.parentNode.parentGraph.view.$('.dataflow-svg-edges')[0];
      graphSVGElement.appendChild(this.previewEdgeNewView.el);

      zoom = this.model.parentNode.parentGraph.get('zoom');

      this.model.parentNode.parentGraph.view.startHighlightCompatible(this.model, true);
    },
    newEdgeDrag: function(event, ui){
      if (!this.previewEdgeNewView || !ui) {
        return;
      }
      // Don't drag node
      event.stopPropagation();

      ui.position.top = event.clientY / zoom;
      ui.position.left = event.clientX / zoom;
      var df = this.model.parentNode.parentGraph.view.el;
      ui.position.left += df.scrollLeft;
      ui.position.top += df.scrollTop;
      this.previewEdgeNewView.render({
        left: ui.position.left - df.scrollLeft,
        top: ui.position.top - df.scrollTop
      });
      this.model.parentNode.parentGraph.view.sizeSVG();
    },
    newEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      this.previewEdgeNewView.remove();
      delete this.previewEdgeNew;
      delete this.previewEdgeNewView;
      this.model.parentNode.parentGraph.view.stopHighlightCompatible(this.model, true);
    },
    getTopEdge: function() {
      var topEdge;
      var topZ = -1;
      if (this.isConnected){
        // Will get the top matching edge
        this.model.parentNode.parentGraph.edges.each(function(edge){
          var thisZ = edge.get("z");
          if(edge.target === this.model && thisZ > topZ ){
            topEdge = edge;
            topZ = thisZ;
          }
          if (edge.view) {
            edge.view.unhighlight();
          }
        }, this);
        if (topEdge && topEdge.view) {
          topEdge.view.bringToTop();
        }
      }
      return topEdge;
    },
    changeEdgeStart: function(event, ui){
      if (!ui) { return; }
      // Don't drag node
      event.stopPropagation();

      if (this.isConnected){
        var changeEdge = this.getTopEdge();
        if (changeEdge){
          // Remove edge
          changeEdge.remove();

          // Make preview
          if (ui) {
            ui.helper.data({
              port: changeEdge.source,
              route: changeEdge.get("route")
            });
          }
          this.previewEdgeChange = new Edge.Model({
            source: changeEdge.get("source"),
            route: changeEdge.get("route"),
            parentGraph: this.model.parentNode.parentGraph,
            preview: true
          });
          this.previewEdgeChangeView = new Edge.View({
            model: this.previewEdgeChange
          });
          var graphSVGElement = this.model.parentNode.parentGraph.view.$('.dataflow-svg-edges')[0];
          graphSVGElement.appendChild(this.previewEdgeChangeView.el);
          
          zoom = this.model.parentNode.parentGraph.get('zoom');
        }
      }
    },
    changeEdgeDrag: function(event, ui){
      if (!ui) { return; }
      // Don't drag node
      event.stopPropagation();
      
      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.render(ui.offset);
        this.model.parentNode.parentGraph.view.sizeSVG();
      }
    },
    changeEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.remove();
        delete this.previewEdgeChange;
        delete this.previewEdgeChangeView;
      }
    },
    blur: function () {
      this.$el.addClass('blur');
    },
    unblur: function () {
      this.$el.removeClass('blur');
    },
    connectEdge: function(event, ui) {
      // Dropped to this el
      var otherPort = ui.helper.data("port");
      var oldLength = this.model.parentNode.parentGraph.edges.length;

      if (otherPort.parentNode.parentGraph.dataflow !== this.model.parentNode.parentGraph.dataflow) {
        // from another widget
        return false;
      }

      if (!this.model.canConnect()) {
        // Port declined the connection, abort
        return;
      }

      function getRouteForType(type) {
        switch (type) {
          case 'int':
          case 'float':
          case 'number':
            return 1;
          case 'boolean':
            return 2;
          case 'object':
            return 3;
          case 'string':
          case 'text':
            return 4;
          default:
            return 0;
        }
      }
      function getDefaultRoute(fromType, toType) {
        if (fromType === 'all' && toType === 'all') {
          return 0;
        }
        if (fromType === 'all') {
          return getRouteForType(toType);
        }
        return getRouteForType(fromType);
      }

      var route = getDefaultRoute(this.model.get('type'), otherPort.get('type'));
      this.model.parentNode.parentGraph.edges.add({
        id: otherPort.parentNode.id+":"+otherPort.id+"::"+this.model.parentNode.id+":"+this.model.id,
        parentGraph: this.model.parentNode.parentGraph,
        source: {
          node: otherPort.parentNode.id,
          port: otherPort.id
        },
        target: {
          node: this.model.parentNode.id,
          port: this.model.id
        },
        route: route
      });
      // Tells changeEdgeStop to remove to old edge
      ui.helper.data("removeChangeEdge", (oldLength < this.model.parentNode.parentGraph.edges.length));
    },
    _holePosition: null,
    holePosition: function(){
      // this._holePosition gets reset when graph panned or node moved
      if (!this._holePosition) {
        if (!this.parent){
          this.parent = this.options.parent;
        }
        var node = this.parent.model;
        var graph = node.parentGraph;
        var $graph = this.parent.graph.$el;
        var index = this.$el.index();
        var left = graph.get("panX") + node.get("x") + 18;
        var top = graph.get("panY") + node.get("y") + 48 + index*20;
        this._holePosition = { left:left, top:top };
      }
      return this._holePosition;
    },
    isConnected: false,
    plugSetActive: function(){
      try {
        this.$(".dataflow-port-plug").draggable("enable");
      } catch (e) { }
      this.$(".dataflow-port-plug, .dataflow-port-hole").addClass("active");
      this.isConnected = true;
    },
    plugCheckActive: function(){
      var topEdge;
      var topEdgeZ = -1;
      this.model.parentNode.parentGraph.edges.each(function(edge){
        if (edge.target === this.model) {
          var z = edge.get("z");
          if (z > topEdgeZ) {
            topEdge = edge;
            topEdgeZ = z;
          }
        }
      }, this);
      if (topEdge) {
        this.bringToTop(topEdge);
      } else {
        try {
          this.$(".dataflow-port-plug").draggable("disable");
        } catch (e) { }
        this.$(".dataflow-port-plug, .dataflow-port-hole").removeClass("active");
        this.isConnected = false;
      }
    },
    topRoute: 0,
    bringToTop: function (edge) {
      var route = edge.get("route");
      if (route !== undefined) {
        this.$(".dataflow-port-hole, .dataflow-port-plug").removeClass("route"+this.topRoute);
        this.$(".dataflow-port-hole, .dataflow-port-plug").addClass("route"+route);
        this.topRoute = route;
      }
    }
  });

  Input.CollectionView = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Input.View
  }); 

}(Dataflow) );

( function(Dataflow) {

  var Output = Dataflow.prototype.module("output");

  // Dependencies
  var Edge = Dataflow.prototype.module("edge");
 
  var template = 
    '<span class="dataflow-port-label out" title="<%= description %>"><%= label %></span>'+
    '<span class="dataflow-port-hole out" title="drag to make new wire"></span>'+
    '<span class="dataflow-port-plug out" title="drag to edit wire"></span>';

  var zoom = 1;

  Output.View = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "dataflow-port dataflow-out",
    events: {
      "click": "getTopEdge",
      "drop":  "connectEdge",
      "dragstart .dataflow-port-hole": "newEdgeStart",
      "drag      .dataflow-port-hole": "newEdgeDrag",
      "dragstop  .dataflow-port-hole": "newEdgeStop",
      "dragstart .dataflow-port-plug": "changeEdgeStart",
      "drag      .dataflow-port-plug": "changeEdgeDrag",
      "dragstop  .dataflow-port-plug": "changeEdgeStop"
    },
    initialize: function (options) {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.addClass(this.model.get("type"));

      this.parent = options.parent;

      // Reset hole position
      var node = this.parent.model;
      var graph = node.parentGraph;
      this.listenTo(node, "change:x change:y change:w", function(){
        this._holePosition = null;
      }.bind(this));
      this.listenTo(graph, "change:panX change:panY", function(){
        this._holePosition = null;
      }.bind(this));

      if (!this.model.parentNode.parentGraph.dataflow.editable) {
        // No drag and drop
        return;
      }

      var self = this;
      this.$(".dataflow-port-plug").draggable({
        cursor: "pointer",
        helper: function(){
          var helper = $('<span class="dataflow-port-plug out helper" />');
          self.parent.graph.$el.append(helper);
          return helper;
        },
        disabled: true,
        // To prevent accidental disconnects
        distance: 10,
        delay: 100
      });
      this.$(".dataflow-port-hole").draggable({
        cursor: "pointer",
        helper: function(){
          var helper = $('<span class="dataflow-port-plug in helper" />')
            .data({port: self.model});
          self.parent.graph.$el.append(helper);
          return helper;
        }
      });
      this.$el.droppable({
        accept: ".dataflow-port-plug.out, .dataflow-port-hole.in",
        activeClassType: "droppable-hover"
      });
    },
    render: function () {
      return this;
    },
    newEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      if (!ui) { return; }

      ui.helper.data({
        route: this.topRoute
      });
      this.previewEdge = new Edge.Model({
        source: {
          node: this.model.parentNode.id,
          port: this.model.id
        },
        parentGraph: this.model.parentNode.parentGraph,
        preview: true,
        route: this.topRoute
      });
      this.previewEdgeView = new Edge.View({
        model: this.previewEdge
      });
      var graphSVGElement = this.model.parentNode.parentGraph.view.$('.dataflow-svg-edges')[0];
      graphSVGElement.appendChild(this.previewEdgeView.el);

      zoom = this.model.parentNode.parentGraph.get('zoom');

      this.model.parentNode.parentGraph.view.startHighlightCompatible(this.model);
    },
    newEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      if (!this.previewEdgeView || !ui) {
        return;
      }
      ui.position.top = event.clientY / zoom;
      ui.position.left = event.clientX / zoom;
      var df = this.model.parentNode.parentGraph.view.el;
      ui.position.left += df.scrollLeft;
      ui.position.top += df.scrollTop;
      this.previewEdgeView.render({
        left: ui.position.left - df.scrollLeft,
        top: ui.position.top - df.scrollTop
      });
    },
    newEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      this.previewEdgeView.remove();
      delete this.previewEdge;
      delete this.previewEdgeView;
      this.model.parentNode.parentGraph.view.stopHighlightCompatible(this.model);
    },
    getTopEdge: function() {
      var topEdge;
      var topZ = -1;
      if (this.isConnected){
        // Will get the top matching edge
        this.model.parentNode.parentGraph.edges.each(function(edge){
          var thisZ = edge.get("z");
          if(edge.source === this.model && thisZ > topZ ){
            topEdge = edge;
            topZ = thisZ;
          }
          if (edge.view) {
            edge.view.unhighlight();
          }
        }, this);
        if (topEdge && topEdge.view) {
          topEdge.view.bringToTop();
        }
      }
      return topEdge;
    },
    changeEdgeStart: function(event, ui){
      if (!ui) { return; }
      // Don't drag node
      event.stopPropagation();

      if (this.isConnected){
        var changeEdge = this.getTopEdge();
        if (changeEdge){
          // Remove edge
          changeEdge.remove();

          // Make preview
          if (ui) {
            ui.helper.data({
              port: changeEdge.target,
              route: changeEdge.get("route")
            });
          }
          this.previewEdgeChange = new Edge.Model({
            target: changeEdge.get("target"),
            route: changeEdge.get("route"),
            parentGraph: this.model.parentNode.parentGraph,
            preview: true
          });
          this.previewEdgeChangeView = new Edge.View({
            model: this.previewEdgeChange
          });
          var graphSVGElement = this.model.parentNode.parentGraph.view.$('.dataflow-svg-edges')[0];
          graphSVGElement.appendChild(this.previewEdgeChangeView.el);

          zoom = this.model.parentNode.parentGraph.get('zoom');
        }
      }
    },
    changeEdgeDrag: function(event, ui){
      if (!ui) { return; }
      // Don't drag node
      event.stopPropagation();

      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.render(ui.offset);
        this.model.parentNode.parentGraph.view.sizeSVG();
      }
    },
    changeEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();

      // Clean up preview edge
      if (this.previewEdgeChange) {
        this.previewEdgeChangeView.remove();
        delete this.previewEdgeChange;
        delete this.previewEdgeChangeView;
      }
    },
    blur: function () {
      this.$el.addClass('blur');
    },
    unblur: function () {
      this.$el.removeClass('blur');
    },
    connectEdge: function(event, ui) {
      // Dropped to this el
      var otherPort = ui.helper.data("port");
      var oldLength = this.model.parentNode.parentGraph.edges.length;

      if (otherPort.parentNode.parentGraph.dataflow !== this.model.parentNode.parentGraph.dataflow) {
        // from another widget
        return false;
      }

      if (!this.model.canConnect()) {
        // Port declined the connection, abort
        return;
      }

      function getRouteForType(type) {
        switch (type) {
          case 'int':
          case 'float':
          case 'number':
            return 1;
          case 'boolean':
            return 2;
          case 'object':
            return 3;
          case 'string':
          case 'text':
            return 4;
          default:
            return 0;
        }
      }
      function getDefaultRoute(fromType, toType) {
        if (fromType === 'all' && toType === 'all') {
          return 0;
        }
        if (fromType === 'all') {
          return getRouteForType(toType);
        }
        return getRouteForType(fromType);
      }

      var route = getDefaultRoute(this.model.get('type'), otherPort.get('type'));
      this.model.parentNode.parentGraph.edges.add({
        id: this.model.parentNode.id+":"+this.model.id+"::"+otherPort.parentNode.id+":"+otherPort.id,
        parentGraph: this.model.parentNode.parentGraph,
        source: {
          node: this.model.parentNode.id,
          port: this.model.id
        },
        target: {
          node: otherPort.parentNode.id,
          port: otherPort.id
        },
        route: route
      });
      // Tells changeEdgeStop to remove to old edge
      ui.helper.data("removeChangeEdge", (oldLength < this.model.parentNode.parentGraph.edges.length));
    },
    _holePosition: null,
    holePosition: function () {
      // this._holePosition gets reset when graph panned or node moved
      if (!this._holePosition) {
        if (!this.parent){
          this.parent = this.options.parent;
        }
        var node = this.parent.model;
        var graph = node.parentGraph;
        var $graph = this.parent.graph.$el;
        var index = this.$el.index();
        var width = node.get("w") !== undefined ? node.get("w") : 175;
        var left = graph.get("panX") + node.get("x") + width - 18;
        var top = graph.get("panY") + node.get("y") + 48 + index*20;
        this._holePosition = { left:left, top:top };
      }
      return this._holePosition;
    },
    isConnected: false,
    plugSetActive: function(){
      try {
        this.$(".dataflow-port-plug").draggable("enable");
      } catch (e) { }
      this.$(".dataflow-port-plug, .dataflow-port-hole").addClass("active");
      this.isConnected = true;
    },
    plugCheckActive: function(){
      var topEdge;
      var topEdgeZ = -1;
      this.model.parentNode.parentGraph.edges.each(function(edge){
        if (edge.source === this.model) {
          var z = edge.get("z");
          if (z > topEdgeZ) {
            topEdge = edge;
            topEdgeZ = z;
          }
        }
      }, this);
      if (topEdge) {
        this.bringToTop(topEdge);
      } else {
        try {
          this.$(".dataflow-port-plug").draggable("disable");
        } catch (e) { }
        this.$(".dataflow-port-plug, .dataflow-port-hole").removeClass("active");
        this.isConnected = false;
      }
    },
    topRoute: 0,
    bringToTop: function (edge) {
      var route = edge.get("route");
      if (route !== undefined) {
        this.$(".dataflow-port-hole").removeClass("route"+this.topRoute);
        this.$(".dataflow-port-hole").addClass("route"+route);
        this.topRoute = route;
      }
    }
  });

  Output.CollectionView = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Output.View
  }); 

}(Dataflow) );

( function(Dataflow) {

  var Edge = Dataflow.prototype.module("edge");

  // Thanks bobince http://stackoverflow.com/a/3642265/592125
  var makeSvgElement = function(tag, attrs) {
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

  var addClass = function (el, name) {
    if (el.classList) {
      el.classList.add(name);
    } else {
      el.className = "dataflow-edge " + name;
    }
  };

  var removeClass = function (el, name) {
    if (el.classList) {
      el.classList.remove(name);
    } else {
      el.className = "dataflow-edge"; 
    }
  };
  
  Edge.View = Backbone.View.extend({
    tagName: "div",
    className: "dataflow-edge",
    positions: null,
    initialize: function() {
      this.positions = {
        from: null, 
        to: null
      };
      // Render on source/target view move
      if (this.model.source) {
        this.model.source.parentNode.on("change:x change:y change:w", this.render, this);
        // this.model.source.parentNode.inputs.on("add remove", this.render, this);
        // this.model.source.parentNode.outputs.on("add remove", this.render, this);
      }
      if (this.model.target) {
        this.model.target.parentNode.on("change:x change:y", this.render, this);
      }
      // Set port plug active
      if (this.model.source && this.model.source.view) {
        // Port plug active
        this.model.source.view.plugSetActive();
        // Port hole color
        this.model.source.view.bringToTop(this.model);
      }
      if (this.model.target && this.model.target.view) {
        // Port plug active
        this.model.target.view.plugSetActive();
        // Port hole color
        this.model.target.view.bringToTop(this.model);
      }
      // Made SVG elements
      this.el = makeSvgElement("g", {
        "class": "dataflow-edge"
      });
      this.elEdge = makeSvgElement("path", {
        "class": "dataflow-edge-wire"
      });
      this.elShadow = makeSvgElement("path", {
        "class": "dataflow-edge-shadow"
      });

      // Color route
      if (this.model.get("route") !== undefined) {
        this.elEdge.setAttribute("class", "dataflow-edge-wire route"+this.model.get("route"));
      }
      // Change color on route change
      var self = this;
      this.model.on("change:route", function(){
        self.elEdge.setAttribute("class", "dataflow-edge-wire route"+self.model.get("route"));
        self.bringToTop();
      });

      this.el.appendChild(this.elShadow);
      this.el.appendChild(this.elEdge);

      // Click handler
      this.el.addEventListener("click", function(event){
        self.click(event);
      });

      // Listen for select
      this.listenTo(this.model, "change:selected", this.selectedChange);
      this.listenTo(this.model, "remove", this.hideInspector);
    },
    render: function(previewPosition){
      var source = this.model.source;
      var target = this.model.target;
      var dataflowParent, graphPos;
      if (source) {
        this.positions.from = source.view.holePosition();
      }
      else {
        // Preview 
        // TODO: match zoom
        dataflowParent = this.model.parentGraph.dataflow.$el.parent().position();
        graph = this.model.parentGraph.view.$el;
        this.positions.from = {
          left: graph.scrollLeft() + previewPosition.left - 5 - dataflowParent.left,
          top:  graph.scrollTop()  + previewPosition.top + 5 - dataflowParent.top
        };
      }
      if (target) {
        this.positions.to = target.view.holePosition();
      } else {
        // Preview
        dataflowParent = this.model.parentGraph.dataflow.$el.parent().position();
        graph = this.model.parentGraph.view.$el;
        this.positions.to = {
          left: graph.scrollLeft() + previewPosition.left + 15 - dataflowParent.left,
          top:  graph.scrollTop()  + previewPosition.top + 5 - dataflowParent.top
        };
      }
      // No half-pixels
      // this.positions.from.left = Math.floor(this.positions.from.left);
      // this.positions.from.top = Math.floor(this.positions.from.top);
      // this.positions.to.left = Math.floor(this.positions.to.left);
      // this.positions.to.top = Math.floor(this.positions.to.top);
 
      // Make and apply the path
      var pathD = this.edgePath(this.positions);
      this.elEdge.setAttribute("d", pathD);
      this.elShadow.setAttribute("d", pathD);
      // Reset bounding box
      if (this.model.parentGraph && this.model.parentGraph.view){
        this.model.parentGraph.view.sizeSVG();
      }
    },
    fade: function(){
      if (this.model.source.parentNode.get("selected") || this.model.target.parentNode.get("selected")) {
        return;
      }
      addClass(this.el, "fade");
    },
    unfade: function(){
      removeClass(this.el, "fade");
    },
    selectedChange: function () {
      if (this.model.get("selected")){
        this.highlight();
        this.showInspector();
      } else {
        this.unhighlight();
        this.hideInspector();
      }
      this.model.parentGraph.trigger("selectionChanged");
    },
    highlight: function(){
      addClass(this.el, "highlight");
    },
    unhighlight: function(){
      removeClass(this.el, "highlight");
    },
    edgePath: function(positions){
      var extend = 20;
      var x = (positions.to.left-extend) - (positions.from.left+extend);
      var halfX = Math.floor(x/2);
      var halfX2 = x-halfX;
      var y = positions.to.top - positions.from.top;
      var halfY = Math.floor(y/2);
      var halfY2 = y-halfY;

      var control1 = "";
      var control2 = "";

      // Todo: check if this wire path is occupied, if so shift it over

      if (Math.abs(y) > Math.abs(x)) {
        // More vertical travel
        if (y > 0) {
          if (x > 0) {
            control1 = " L " + (positions.from.left+extend+halfX) + " " + (positions.from.top+halfX);
            control2 = " L " + (positions.to.left-extend-halfX2) + " " + (positions.to.top-halfX2);
          } else if (x < 0) {
            control1 = " L " + (positions.from.left+extend+halfX) + " " + (positions.from.top-halfX);
            control2 = " L " + (positions.to.left-extend-halfX2) + " " + (positions.to.top+halfX2);
          }
        } else if (y < 0) {
          if (x > 0) {
            control1 = " L " + (positions.from.left+extend+halfX) + " " + (positions.from.top-halfX);
            control2 = " L " + (positions.to.left-extend-halfX2) + " " + (positions.to.top+halfX2);
          } else if (x < 0) {
            control1 = " L " + (positions.from.left+extend+halfX) + " " + (positions.from.top+halfX);
            control2 = " L " + (positions.to.left-extend-halfX2) + " " + (positions.to.top-halfX2);
          }          
        }
      } else if (Math.abs(y) < Math.abs(x)) {
        // More horizontal travel
        if (x > 0) {
          if (y > 0) {
            control1 = " L " + (positions.from.left+extend+halfY) + " " + (positions.from.top+halfY);
            control2 = " L " + (positions.to.left-extend-halfY2) + " " + (positions.to.top-halfY2);
          } else if (y < 0) {
            control1 = " L " + (positions.from.left+extend-halfY) + " " + (positions.from.top+halfY);
            control2 = " L " + (positions.to.left-extend+halfY2) + " " + (positions.to.top-halfY2);
          }
        } else if (x < 0) {
          if (y > 0) {
            control1 = " L " + (positions.from.left+extend-halfY) + " " + (positions.from.top+halfY);
            control2 = " L " + (positions.to.left-extend+halfY2) + " " + (positions.to.top-halfY2);
          } else if (y < 0) {
            control1 = " L " + (positions.from.left+extend+halfY) + " " + (positions.from.top+halfY);
            control2 = " L " + (positions.to.left-extend-halfY2) + " " + (positions.to.top-halfY2);
          }          
        }
      } 

      return "M " + positions.from.left + " " + positions.from.top + 
        " L " + (positions.from.left+extend) + " " + positions.from.top +
        control1 + control2 +
        " L " + (positions.to.left-extend) + " " + positions.to.top +
        " L " + positions.to.left + " " + positions.to.top;
    },
    remove: function(){
      var source = this.model.source;
      var target = this.model.target;
      // Remove listeners
      if (source) {
        source.parentNode.off(null, null, this);
      }
      if (target) {
        target.parentNode.off(null, null, this);
      }
      // Check if port plug is still active
      if (source) {
        source.view.plugCheckActive();
      }
      if (target) {
        target.view.plugCheckActive();
      }
      // Remove element
      this.el.parentNode.removeChild(this.el);
    },
    click: function(event){
      // Don't click graph
      if (event) {
        event.stopPropagation();
      }
      var selected;
      if (event && (event.ctrlKey || event.metaKey)) {
        // Toggle
        selected = this.model.get("selected");
        selected = !selected;
      } else {
        // Deselect all and select this
        selected = true;
        this.model.parentGraph.nodes.invoke("set", {selected:false});
        this.model.collection.invoke("set", {selected:false});
      }
      this.model.set({selected:selected});
      if (selected) {
        this.bringToTop();
        this.model.trigger("select");
        this.unfade();
      }
      // Fade all and highlight related
      this.model.parentGraph.view.fade();
    },
    bringToTop: function(){
      this.model.bringToTop();
      var parent = this.el.parentNode;
      if (parent) {
        parent.appendChild(this.el);
      }

      // Port hole color
      this.model.source.view.bringToTop(this.model);
      this.model.target.view.bringToTop(this.model);
    },
    inspector: null,
    getInspector: function () {
      if (!this.inspector) {
        var inspect = new Edge.InspectView({model:this.model});
        var Card = Dataflow.prototype.module("card");
        this.inspector = new Card.Model({
          dataflow: this.model.parentGraph.dataflow,
          card: inspect
        });
      }
      return this.inspector;
    },
    showInspector: function(leaveUnpinned){
      this.model.parentGraph.dataflow.addCard( this.getInspector(), leaveUnpinned );
    },
    hideInspector: function () {
      this.model.parentGraph.dataflow.removeCard( this.getInspector() );
    }

  });

}(Dataflow) );

(function(Dataflow){

  var Card = Dataflow.prototype.module("card");

  Card.Model = Backbone.Model.extend({
    defaults: {
      pinned: false
    },
    initialize: function () {
      this.dataflow = this.get("dataflow");
    },
    hide: function () {
      this.dataflow.shownCards.remove( this );
    }
  });

  Card.Collection = Backbone.Collection.extend({
    model: Card.Model
  });

}(Dataflow));

(function(Dataflow){

  var Card = Dataflow.prototype.module("card");

  var template = 
    '<div class="dataflow-card-control">'+
      '<button title="pin" class="dataflow-card-pin icon-pushpin"></button>'+
      '<button title="close" class="dataflow-card-close icon-remove"></button>'+
    '</div>';

  Card.View = Backbone.View.extend({
    tagName: "div",
    className: "dataflow-card",
    template: _.template(template),
    events: {
      "click .dataflow-card-pin": "togglePin",
      "click .dataflow-card-close": "hide"
    },
    initialize: function () {
      this.$el.html(this.template());
      this.card = this.model.get("card");
      this.$el.append(this.card.el);
      this.listenTo(this.model, "change:pinned", this.pinnedChanged);
      this.pinnedChanged();
    },
    animate: function (timestamp) {
      if (typeof this.card.animate === "function") {
        this.card.animate(timestamp);
      }
    },
    togglePin: function () {
      var pinned = !this.model.get("pinned");
      this.model.set("pinned", pinned);
      if (!pinned) {
        this.hide();
      }
    },
    pinnedChanged: function () {
      if ( this.model.get("pinned") ) {
        this.$(".dataflow-card-pin").addClass("active");
      } else {
        this.$(".dataflow-card-pin").removeClass("active");
      }
    },
    hide: function () {
      this.model.hide();
    },
    remove: function () {
      this.$el.detach();
    }
  });

  // requestAnimationFrame shim
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function(){
      return  window.requestAnimationFrame       ||
              window.webkitRequestAnimationFrame ||
              window.mozRequestAnimationFrame    ||
              window.oRequestAnimationFrame      ||
              window.msRequestAnimationFrame     ||
              function( callback ){
                window.setTimeout(callback, 1000 / 20);
              };
    })();
  }

  Card.CollectionView = Backbone.CollectionView.extend({
    tagName: "div",
    className: "dataflow-cards",
    itemView: Card.View,
    prepend: true,
    initialize: function () {
      // Super
      Backbone.CollectionView.prototype.initialize.apply(this, arguments);
      // Set up animation loop
      var loop = function (timestamp) {
        window.requestAnimationFrame(loop);
        // Call all visible
        this.collection.each(function(card){
          if (card.view) {
            card.view.animate(timestamp);
          }
        });
      }.bind(this);
      loop();
    },
    bringToTop: function (card) {
      this.$el.prepend( card.view.el );
    }
  });

}(Dataflow));

(function (Dataflow) {
  var MenuItem = Backbone.Model.extend({
    defaults: {
      label: '',
      icon: '',
      action: null
    }
  });

  var Menu = Backbone.Collection.extend({
    model: MenuItem
  });

  var Card = Dataflow.prototype.module('card');
  var MenuCard = Dataflow.prototype.module('menucard');
  MenuCard.Model = Card.Model.extend({
    initialize: function () {
      this.menu = new Menu();
      Card.Model.prototype.initialize.call(this);
    }
  });
}(Dataflow));

(function (Dataflow) {
  var Card = Dataflow.prototype.module('card');
  var MenuCard = Dataflow.prototype.module('menucard');

  var MenuItemView = Backbone.View.extend({
    tagName: 'li',
    template: '<button title="<%- label %>"><i class="icon-<%- icon %>"></i><span class="name"><%- label %></span></button>',
    events: {
      'click': 'clicked'
    },
    render: function () {
      this.$el.html(_.template(this.template, this.model.toJSON()));
    },
    clicked: function () {
      if (!this.model.get('action')) {
        return;
      }
      this.model.get('action')();
    }
  });

  MenuCard.View = Card.View.extend({
    initialize: function () {
      this.model.set('card', new Backbone.CollectionView({
        tagName: 'ul',
        className: 'dataflow-menu',
        collection: this.model.menu,
        itemView: MenuItemView
      }));
      Card.View.prototype.initialize.call(this);
    }
  });
}(Dataflow));

( function(Dataflow) {

  var Node = Dataflow.prototype.module("node");

  var template = 
    '<div class="dataflow-plugin-inspector-title">'+
      '<h1 class="dataflow-node-inspector-label" title="click to edit"><%- label %></h1>'+
      '<h2 class="dataflow-node-inspector-type"><%- type %></h2>'+
    '</div>'+
    // '<div class="dataflow-node-inspector-controls">'+
    //   '<button class="dataflow-node-delete">delete</button>'+
    // '</div>'+
    '<div class="dataflow-node-inspector-inputs"></div>';

  var makeEditable = function ($el, model, attribute) {
    $el[0].contentEditable = true;
    var initial = $el.text();
    var apply = function(){
      model.set(attribute, $el.text());
    };
    var revert = function(){
      $el.text(initial);
    };
    $el
      .focus(function(event){
        initial = $el.text();
      })
      .blur(function(event){
        apply();
      })
      .keydown(function(event){
        if (event.which === 27) {
          // ESC
          revert();
          $el.blur();
        } else if (event.which === 13) {
          // Enter
          $el.blur();
        }
      });
  };

  Node.InspectView = Backbone.View.extend({
    template: _.template(template),
    className: "dataflow-node-inspector",
    events: {
    },
    initialize: function(options) {
      this.$el.html(this.template(this.model.toJSON()));
      // Make input list
      var $inputs = this.$el.children(".dataflow-node-inspector-inputs");
      this.model.inputs.each(function(input){
        if (input.view && input.view.$input) {
          $inputs.append( input.view.$input );
        }
      }, this);

      makeEditable(this.$(".dataflow-node-inspector-label"), this.model, "label");
    },
    render: function() {
      return this;
    },
    removeModel: function(){
      this.model.remove();
    }
  });

}(Dataflow) );

( function(Dataflow) {

  var Edge = Dataflow.prototype.module("edge");

  var template = 
    '<div class="dataflow-plugin-inspector-title">'+
      '<h1>Edge</h1>'+
      '<h2 class="dataflow-edge-inspector-id"><%= id %></h2>'+
    '</div>'+
    '<div class="dataflow-edge-inspector-route-choose"></div>'+
    '<ul class="dataflow-edge-inspector-events"></ul>';

  Edge.InspectView = Backbone.View.extend({
    tagName: "div",
    className: "dataflow-edge-inspector",
    positions: null,
    template: _.template(template),
    initialize: function() {
      var templateData = this.model.toJSON();
      if (this.model.id) {
        templateData.id = this.model.id.replace('->', '&#8594;');
      }
      this.$el.html( this.template(templateData) );

      var $choose = this.$el.children(".dataflow-edge-inspector-route-choose");
      this.$log = this.$el.children('.dataflow-edge-inspector-events');

      var changeRoute = function(event){
        var route = $(event.target).data("route");
        this.model.set("route", route);
      }.bind(this);
      
      // Make buttons
      for (var i=0; i<12; i++) {
        var button = $("<button>")
          .data("route", i)
          .addClass("route"+i)
          .click(changeRoute);
        if (i === this.model.get("route")){
          button.addClass("active");
        }
        $choose.append(button);
      }

      this.listenTo(this.model, "change:route", this.render);
      this.listenTo(this.model, "remove", this.remove);
      // Check if need to render logs
      this.animate();
    },
    render: function(){
      var route = this.model.get("route");
      var $choose = this.$el.children(".dataflow-edge-inspector-route-choose");
      $choose.children(".active").removeClass("active");
      $choose.children(".route"+route).addClass("active");
      return this;
    },
    showLogs: 20,
    lastLog: 0,
    animate: function (timestamp) {
      // Called from dataflow.shownCards collection (card-view.js)
      var logs = this.model.get('log');
      if (logs.length > this.lastLog) {
        this.renderLogs(logs);
        this.lastLog = logs.length;
      }
    },
    renderLogs: function (logs) {
      // Add new logs
      var firstToShow = this.lastLog;
      if (logs.length - this.lastLog > this.showLogs) {
        firstToShow = logs.length - this.showLogs;
      }
      for (var i=firstToShow; i<logs.length; i++){
        var item = logs.get(i);
        if (item) {
          var li = $("<li>")
            .addClass(item.type)
            .text( (item.group ? item.group + " " : "")+item.data);
          this.$log.append(li);
        }
      }
      // Trim list
      while (this.$log.children().length > this.showLogs) {
        this.$log.children().first().remove();
      }
      // Scroll list
      this.$log[0].scrollTop = this.$log[0].scrollHeight;
    }
  });

}(Dataflow) );

(function (Dataflow) {
  var Menu = Dataflow.prototype.plugin('menu');
  var MenuCard = Dataflow.prototype.module('menucard');

  Menu.initialize = function (dataflow) {
    Menu.card = new MenuCard.Model({
      dataflow: dataflow,
      pinned: true
    });
    Menu.card.view = new MenuCard.View({
      model: Menu.card
    });

    Menu.addPlugin = function (info) {
      Menu.card.menu.add({
        id: info.id,
        icon: info.icon,
        label: info.label,
        showLabel: false,
        action: function () {
          Menu.card.hide();
          dataflow.showPlugin(info.id);
        }
      });
    };

    Menu.disablePlugin = function (name) {
      if (!this.card.menu.get(name)) {
        return;
      }
      this.card.menu.remove(name);

      if (dataflow.plugins[name] && dataflow.plugins[name].card) {
        // Hide any open cards from the plugin
        dataflow.plugins[name].card.hide();
      }
    };
  };
}(Dataflow));

( function(Dataflow) {

  var Edit = Dataflow.prototype.plugin("edit");

  Edit.initialize = function(dataflow){

    var buttons = $(
      '<div class="dataflow-plugin-edit">'+
        '<button class="selectall">Select All (A)</button><br />'+
        '<button class="cut">Cut (X)</button><br />'+
        '<button class="copy">Copy (C)</button><br />'+
        '<button class="paste">Paste (V)</button><br />'+
      '</div>'
    );

    // dataflow.addPlugin({
    //   id: "edit", 
    //   name: "edit", 
    //   menu: buttons, 
    //   icon: "edit"
    // });
    
    //
    // A
    //

    function selectAll(){
      dataflow.currentGraph.nodes.invoke("set", {selected:true});
    }
    buttons.children(".selectall").click(selectAll);
    Edit.selectAll = selectAll;

    //
    // X
    //
    
    Edit.removeSelected = function () {
      var toRemove = dataflow.currentGraph.nodes.where({selected:true});      
      _.each(toRemove, function(node){
        node.remove();
      });
    };

    function cut(){
      // Copy selected
      copy();
      // Move back so paste in original place
      _.each(copied.nodes, function(node){
        node.x -= 50;
        node.y -= 50;
      });

      // Remove selected
      Edit.removeSelected();

      // Update context
      dataflow.currentGraph.trigger('selectionChanged');
    }
    buttons.children(".cut").click(cut);
    Edit.cut = cut;
    
    

    function removeEdge(){
      var selected = dataflow.currentGraph.edges.where({selected:true});
      selected.forEach(function(edge){
        edge.remove();
      });
      // Update context
      dataflow.currentGraph.trigger('selectionChanged');
    }
    Edit.removeEdge = removeEdge;

    //
    // C
    //

    var copied = {};
    function copy(){
      copied = {};
      // nodes
      copied.nodes = dataflow.currentGraph.nodes.where({selected:true});
      copied.nodes = JSON.parse(JSON.stringify(copied.nodes));
      // edges
      copied.edges = [];
      dataflow.currentGraph.edges.each(function(edge){
        // Only copy the edges between nodes being copied
        var connectedSource = _.any(copied.nodes, function(node){
          return (edge.source.parentNode.id === node.id);
        });
        var connectedTarget = _.any(copied.nodes, function(node){
          return (edge.target.parentNode.id === node.id);
        });
        if (connectedSource || connectedTarget){
          copied.edges.push( JSON.parse(JSON.stringify(edge)) );
        }
      });
    }
    buttons.children(".copy").click(copy);
    Edit.copy = copy;

    //
    // V
    //

    function paste(){
      if (copied && copied.nodes && copied.nodes.length > 0) {
        // Deselect all
        dataflow.currentGraph.nodes.invoke("set", {selected:false});
        // Add nodes
        _.each(copied.nodes, function(node){
          // Offset pasted
          node.x += 50;
          node.y += 50;
          node.parentGraph = dataflow.currentGraph;
          node.selected = true;
          var oldId = node.id;
          // Make unique id
          while (dataflow.currentGraph.nodes.get(node.id)){
            node.id++;
          }
          // Update copied edges with new node id
          if (oldId !== node.id) {
            _.each(copied.edges, function(edge){
              if (edge.source.node === oldId) {
                edge.source.node = node.id;
              }
              if (edge.target.node === oldId) {
                edge.target.node = node.id;
              }
            });
          }
          var newNode = new dataflow.nodes[node.type].Model(node);
          dataflow.currentGraph.nodes.add(newNode);
          // Select new node
          newNode.view.bringToTop();
          newNode.view.highlight();
        });
        // Add edges
        _.each(copied.edges, function(edge){
          // Clone edge object (otherwise weirdness on multiple pastes)
          edge = JSON.parse(JSON.stringify(edge));
          // Add it
          edge.parentGraph = dataflow.currentGraph;
          edge.id = edge.source.node+":"+edge.source.port+"::"+edge.target.node+":"+edge.target.port;
          var newEdge = new dataflow.modules.edge.Model(edge);
          dataflow.currentGraph.edges.add(newEdge);
        });
      }
      // Rerender edges
      _.defer(function(){
        dataflow.currentGraph.view.rerenderEdges();
      });
    }
    buttons.children(".paste").click(paste);
    Edit.paste = paste;






    // Add context actions for actionbar

    dataflow.addContext({
      id: "cut",
      icon: "cut",
      label: "cut",
      action: cut,
      contexts: ["node", "nodes"]
    });
    dataflow.addContext({
      id: "copy",
      icon: "copy",
      label: "copy",
      action: copy,
      contexts: ["node", "nodes"]
    });
    dataflow.addContext({
      id: "paste",
      icon: "paste",
      label: "paste",
      action: paste,
      contexts: ["node", "nodes"]
    });

    dataflow.addContext({
      id: "edgeRemove",
      icon: "remove",
      label: "remove edge",
      action: removeEdge,
      contexts: ["edge"]
    });

    dataflow.addContext({
      id: "edgeRemove",
      icon: "remove",
      label: "remove edges",
      action: removeEdge,
      contexts: ["edges"]
    });

    dataflow.plugin('search').addCommand({
      names: ['remove', 'r', 'remove node'],
      args: ['node'],
      preview: function (text, callback) {
        if (!dataflow.currentGraph) {
          return;
        }
        var results = [];
        dataflow.currentGraph.nodes.each(function (node) {
          if (node.get('label').toLowerCase().indexOf(text.toLowerCase()) === -1) {
            return;
          }
          results.push({
            icon: 'remove',
            label: node.get('label'),
            description: node.type,
            item: node
          });
        });
        callback(results);
      },
      execute: function (item) {
        if (!dataflow.currentGraph) {
          return;
        }
        item.remove();
      }
    });

    Edit.onSearch = function (text, callback) {
      if (!dataflow.currentGraph) {
        return;
      }
      var results = [];
      dataflow.currentGraph.nodes.each(function (node) {
        if (node.get('label').toLowerCase().indexOf(text.toLowerCase()) === -1) {
          return;
        }
        results.push({
          source: 'edit',
          icon: 'sign-blank',
          label: node.get('label'),
          description: node.type,
          action: function () {
            node.view.select();
          }
        });
      });
      callback(results);
    };

  };

}(Dataflow) );

( function(Dataflow) {

  var Elements = Dataflow.prototype.plugin("elements");

  Elements.list = [
    {type: "div",    attributes: ["id", "class", "style"], events: ["pointermove", "pointerover", "pointerout"]},
    {type: "button", attributes: ["id", "class", "style"], events: ["pointerdown", "pointerup"]}
  ];

}(Dataflow) );

( function(Dataflow) {

  var Library = Dataflow.prototype.plugin("library");

  Library.initialize = function(dataflow){

    var $container = $('<div class="dataflow-plugin-overflow">');
    var $library = $('<ul class="dataflow-plugin-library" />');
    $container.append($library);

    Library.excluded = ["base", "base-resizable"];

    var addNode = function(node, x, y) {
      return function(){
        // Deselect others
        dataflow.currentGraph.view.$(".dataflow-node").removeClass("ui-selected");

        // Current zoom
        zoom = dataflow.currentGraph.get('zoom');

        // Find vacant id
        var id = 1;
        while (dataflow.currentGraph.nodes.get(id)){
          id++;
        }
        // Position
        x = x===undefined ? 200 : x;
        y = y===undefined ? 200 : y;
        x = x/zoom - dataflow.currentGraph.get("panX");
        y = y/zoom - dataflow.currentGraph.get("panY");

        // Add node
        var newNode = new node.Model({
          id: id,
          x: x,
          y: y,
          parentGraph: dataflow.currentGraph
        });
        dataflow.currentGraph.nodes.add(newNode);
        // Select and bring to top
        newNode.view.select();
      };
    };

    var addElement = function (info) {

    };

    var itemTemplate = '<li><a class="button add"><i class="icon-<%- icon %>"></i></a><span class="name"><%- name %></span><span class="description"><%-description %></span></li>';

    var addLibraryItem = function(name, node) {
      var $item = $(_.template(itemTemplate, {
        name: name,
        description: node.description,
        icon: node.icon ? node.icon : 'sign-blank'
      }));
      var addButton = $('.button', $item)
        .attr("title", "click or drag")
        .draggable({
          helper: function(){
            var helper = $('<div class="dataflow-node helper"><div class="dataflow-node-title">'+name+'</div></div>');
            dataflow.$el.append(helper);
            return helper;
          },
          stop: function(event, ui) {
            addNode(node, ui.position.left, ui.position.top).call();
          }
        })
        .click(addNode(node));
      $library.append($item);
    };

    var update = function(options){
      options = options ? options : {};
      Library.excluded = options.exclude ? options.exclude : Library.excluded;

      $library.empty();
      var sortedLibrary = _.sortBy(Object.keys(dataflow.nodes), function (name) {
        return name;
      });
      _.each(sortedLibrary, function (name) {
        if (Library.excluded.indexOf(name) !== -1) {
          return;
        }
        addLibraryItem(name, dataflow.nodes[name]);
      });
    };
    update();

    dataflow.addPlugin({
      id: "library", 
      label: "library",
      name: "", 
      menu: $container, 
      icon: "plus",
      pinned: false
    });

    Library.update = update;

    Library.onSearch = function (text, callback) {
      var results = [];
      _.each(dataflow.nodes, function (node, name) {
        if (Library.excluded.indexOf(name) !== -1) {
          return;
        }
        if (name.toLowerCase().indexOf(text.toLowerCase()) === -1) {
          return;
        }
        results.push({
          source: 'library',
          icon: 'plus',
          action: function () {
            addNode(node).call();
          },
          label: name,
          description: node.description
        });
      });
      callback(results);
    };

    dataflow.plugin('search').addCommand({
      names: ['add', 'a', 'add component', 'add node'],
      args: ['component'],
      preview: function (text, callback) {
        var results = [];
        _.each(dataflow.nodes, function (node, name) {
          if (Library.excluded.indexOf(name) !== -1) {
            return;
          }
          if (name.toLowerCase().indexOf(text.toLowerCase()) === -1) {
            return;
          }
          results.push({
            icon: 'plus',
            label: name,
            description: node.description,
            item: node
          });
        });
        callback(results);
      },
      execute: function (item) {
        addNode(item).call();
      }
    });
  };

}(Dataflow) );

( function(Dataflow) {

  var Source = Dataflow.prototype.plugin("source");

  // Whether the graph may be updated via the source form
  Source.updateAllowed = true;

  Source.initialize = function(dataflow){
    var $form = $( 
      '<form class="dataflow-plugin-view-source">'+
        '<div style="">'+
          '<textarea class="code" style="width:99%; height:400px;; margin:0; padding: 0;"></textarea><br/>'+
        '</div>'+
        '<input class="apply" type="submit" value="apply changes" style="position: absolute; right:5px; bottom:5px;" />'+
      '</form>'
    );
    var $code = $form.find(".code");

    dataflow.addPlugin({
      id: "source", 
      label: "view source",
      name: "", 
      menu: $form, 
      icon: "code",
      pinned: true
    });

    Source.show = function(source) {
      var scrollBackTop = $code.prop("scrollTop");
      $code.val( source );
      $code.scrollTop( scrollBackTop );
    };

    var showGraph = function(graph){
      if (dataflow.graph) {
        Source.show( JSON.stringify(dataflow.graph.toJSON(), null, "  ") );
      }
    };

    // Method for setting graph change listeners on or off
    Source.listeners = function(boo){
      if (boo) {
        // On change update code view
        dataflow.on("change", showGraph);
      } else {
        // Custom
        dataflow.off("change", showGraph);
      }
    };
    // By default we listen to graph changes
    Source.listeners(true);

    // Whether to allow updating the graph from the form
    Source.allowUpdate = function (allowed) {
      var $button = $form.find('.apply');
      if (allowed) {
        Source.updateAllowed = true;
        $button.show();
        $code.removeAttr('readonly');
        return;
      }
      Source.updateAllowed = false;
      $button.hide();
      $code.attr('readonly', 'readonly');
    };

    // Apply source to test graph
    $form.submit(function(){
      Source.updateGraph($code, dataflow);
      return false;
    });
    
  };

  // Method for updating the graph from the form. Override
  // this for systems using another graph format (for example,
  // NoFlo).
  Source.updateGraph = function ($code, dataflow) {
    if (!Source.updateAllowed) {
      return;
    }
    var graph;
    try {
      graph = JSON.parse( $code.val() );
    } catch(error) {
      dataflow.log("Invalid JSON");
      return false;
    }
    if (graph) {
      var g = dataflow.loadGraph(graph);
      g.trigger("change");
    }
  };

}(Dataflow) );

( function(Dataflow) {
 
  var Log = Dataflow.prototype.plugin("log");

  Log.initialize = function(dataflow){

    var $log = $(
      '<div class="dataflow-plugin-log dataflow-plugin-overflow">'+
        '<ol class="loglist"></ol>'+
      '</div>'
    );

    dataflow.addPlugin({
      id: "log", 
      label: "log",
      name: "", 
      menu: $log, 
      icon: "th-list",
      pinned: true
    });

    // Log message and scroll
    function log(message){
      message = _.escape(message);
      $log.children(".loglist").append("<li>" + message + "</li>");
      $log.scrollTop( $log.prop("scrollHeight") );
    }

    Log.add = log;

    var logged = function(message){
      log("log: " + message);
    };
    var nodeAdded = function(graph, node){
      log("node added: " + node.toString());
    };
    var nodeRemoved = function(graph, node){
      log("node removed: " + node.toString());
    };
    var edgeAdded = function(graph, edge){
      log("edge added: " + edge.toString());
    };
    var edgeRemoved = function(graph, edge){
      log("edge removed: " + edge.toString());
    };



    Log.listeners = function(boo){
      if (boo) {
        // Log
        dataflow.on("log", logged);

        // Log graph changes
        dataflow.on("node:add", nodeAdded);
        dataflow.on("node:remove", nodeRemoved);
        dataflow.on("edge:add", edgeAdded);
        dataflow.on("edge:remove", edgeRemoved);
      } else {
        // Custom for other integration
        dataflow.off("log", logged);
        dataflow.off("node:add", nodeAdded);
        dataflow.off("node:remove", nodeRemoved);
        dataflow.off("edge:add", edgeAdded);
        dataflow.off("edge:remove", edgeRemoved);
      }
    };
    Log.listeners(true);

  };

}(Dataflow) );

( function(Dataflow) {
 
  var Inspector = Dataflow.prototype.plugin("inspector");

  Inspector.initialize = function(dataflow){

    function showInspector(){
      var selectedNodes = dataflow.currentGraph.nodes.where({selected:true});
      selectedNodes.forEach(function(node){
        var inspector = node.view.getInspector();
        inspector.set("pinned", true);
        dataflow.addCard( inspector );
      });
      var selectedEdges = dataflow.currentGraph.edges.where({selected:true});
      selectedEdges.forEach(function(edge){
        var inspector = edge.view.getInspector();
        inspector.set("pinned", true);
        dataflow.addCard( inspector );
      });
    }

    dataflow.addContext({
      id: "inspector",
      icon: "info-sign",
      label: "inspect",
      action: showInspector,
      contexts: ["one", "twoplus"]
    });

  };

}(Dataflow) );

( function(Dataflow) {

  // Load after other plugins
  // TODO: track which widget has focus if multiple in page
 
  var KeyBinding = Dataflow.prototype.plugin("keybinding");
  var Edit = Dataflow.prototype.plugin("edit");
  var Search = Dataflow.prototype.plugin("search");

  KeyBinding.initialize = function(dataflow){
    function zoomIn() {
      if (dataflow && dataflow.currentGraph && dataflow.currentGraph.view) {
        dataflow.currentGraph.view.zoomIn();
      }
    }

    function zoomOut() {
      if (dataflow && dataflow.currentGraph && dataflow.currentGraph.view) {
        dataflow.currentGraph.view.zoomOut();
      }
    }

    function zoomCenter() {
      if (dataflow && dataflow.currentGraph && dataflow.currentGraph.view) {
        dataflow.currentGraph.view.zoomCenter();
      }
    }

    function keyDown(event) {

      // Don't keybind graph actions when could be editing text #10
      if (event.target.tagName==="TEXTAREA" || 
          event.target.tagName==="INPUT" || 
          event.target.contentEditable==="true" ){ return; }

      if (event.ctrlKey || event.metaKey) {
        switch (event.which) {
          case 189: // -
            event.preventDefault();
            zoomIn();
            break;
          case 187: // =
            event.preventDefault();
            zoomOut();
            break;
          case 48:
            event.preventDefault();
            zoomCenter();
            break;
          case 65: // a
            Edit.selectAll();
            break;
          case 88: // x
            Edit.cut();
            break;
          case 67: // c
            Edit.copy();
            break;
          case 86: // v
            Edit.paste();
            break;
          case 90: // z
            break;
          case 83: // s
            event.preventDefault();
            Search.focus();
            break;
          default:
            break;
        }
      }
    }

    KeyBinding.listeners = function(boo){
      if (boo) {
        $(document).on('keydown', keyDown);
      } else {
        $(document).off('keydown', keyDown);
      }
    };
    KeyBinding.listeners(true);

  };

}(Dataflow) );

( function(Dataflow) {
  var Notification = Dataflow.prototype.plugin('notification');
  var webNotifications = window.webkitNotifications ? true : false;

  // Request permission to show notifications
  //
  // Note that this function has to be called from some user
  // interaction, like a click event.
  //
  // For example:
  //
  //     $button.click(function () {
  //       dataflow.plugins.notification.requestPermission();
  //       // Other things the button should do
  //     });
  Notification.requestPermission = function () {
    if (!webNotifications) {
      return;
    }

    if (Notification.hasPermission()) {
      // We already have the permission
      return;
    }

    window.webkitNotifications.requestPermission();
  };

  // Check if user has granted the permission to show Web Notifications
  Notification.hasPermission = function () {
    if (!webNotifications) {
      return false;
    }

    if (window.webkitNotifications.checkPermission() !== 0) {
      return false;
    }

    return true;
  };

  // Show a notification. If user has granted the permission to show
  // Web Notifications, then that is what will be used. Otherwise,
  // the notification will fall back to console.log
  Notification.notify = function (icon, title, message) {
    if (!Notification.hasPermission()) {
      if (!console || !console.log) {
        // TODO: alert?
        return;
      }
      console.log(title + ': ' + message);
      return;
    }
    var notification = window.webkitNotifications.createNotification(icon, title, message);
    notification.show();
  };

}(Dataflow) );

(function (Dataflow) {
  var Search = Dataflow.prototype.plugin("search");

  var SearchResult = Backbone.Model.extend({
    defaults: {
      source: '',
      icon: '',
      action: null,
      label: '',
      description: ''
    }
  });

  var SearchResults = Backbone.Collection.extend({
    model: SearchResult,
    initialize: function (models, options) {
      if (!options) {
        options = {};
      }
      this.search = options.search;
    }
  });

  var ResultView = Backbone.View.extend({
    tagName: 'li',
    template: '<i class="icon-<%- icon %>"></i><span class="name"><%- label %></span><span class="description"><%- description %></span>',
    events: {
      'click': 'clicked'
    },
    render: function () {
      this.$el.html(_.template(this.template, this.model.toJSON()));
    },
    clicked: function () {
      if (!this.model.get('action')) {
        return;
      }
      this.model.get('action')();
    }
  });

  Search.initialize = function (dataflow) {
    var $search = $('<div class="dataflow-plugin-search"><input type="search" placeholder="Search" results="5" x-webkit-speech /><button><i class="icon-reorder"></i></button></div>');
    var $input = $search.find('input');
    var $button = $search.find('button');
    dataflow.$el.prepend($search);

    $input.on('keydown', function (event) {
      // Ctrl-s again to get out of the search field
      if ((event.ctrlKey || event.metaKey) && event.which === 83) {
        event.preventDefault();
        $input.val('');
        $input.blur();
        dataflow.removeCard('searchresults');
      }
    });

    $input.on('keyup search webkitspeechchange', function (event) {
      if (event.keyCode === 13 && Search.results && Search.results.length === 1) {
        var card = dataflow.shownCards.get('searchresults');
        if (!card) {
          return;
        }
        $('li', card.el).click();
        dataflow.removeCard('searchresults');
        $input.val('');
        return;
      }
      if (!$input.val()) {
        dataflow.removeCard('searchresults');
        return;
      }
      Search.search($input.val(), dataflow);
    });

    $button.on('click', function () {
      dataflow.showPlugin('menu');
    });

    Search.focus = function () {
      $input.val('');
      $input.focus();
    };
  };

  Search.addCommand = function (command) {
    Search.commands.push(command);
  };

  Search.handleCommands = function (text, dataflow) {
    var handled = false;
    _.each(Search.commands, function (command) {
      if (handled) {
        return;
      }
      _.each(command.names, function (name) {
        if (handled) {
          return;
        }
        if (text.indexOf(name) === 0) {
          // Prepare arguments
          var argumentString = text.substr(name.length).trim();
          var args = argumentString.split(' ');

          // Validate arguments
          if (args.length !== command.args.length) {
            return;
          }

          // We found the command
          handled = true;

          args.push(function (results) {
            if (results.length === 0) {
              return;
            }
            _.each(results, function (result) {
              result.action = function () {
                args.unshift(result.item);
                command.execute.apply(command, args);
              };
            });
            var Card = Dataflow.prototype.module('card');
            var resultList = new SearchResults(results, {
              search: argumentString
            });
            var ResultsView = new Backbone.CollectionView({
              tagName: 'ul',
              className: 'dataflow-plugin-search-results',
              collection: resultList,
              itemView: ResultView
            });
            var ResultsCard = new Card.Model({
              id: 'searchresults',
              dataflow: dataflow,
              card: ResultsView,
              pinned: false
            });
            dataflow.addCard(ResultsCard);
            Search.results = resultList;
          });

          command.preview.apply(command, args);
        }
      });
    });
    return handled;
  };

  Search.commands = [];

  Search.search = function (text, dataflow) {
    dataflow.removeCard('searchresults');

    // Check commands for match
    if (Search.handleCommands(text, dataflow)) {
      // Handled by the command, ignore
      return;
    }

    var Card = Dataflow.prototype.module('card');
    var results = new SearchResults([], {
      search: text
    });
    var ResultsView = new Backbone.CollectionView({
      tagName: 'ul',
      className: 'dataflow-plugin-search-results',
      collection: results
    });
    ResultsView.itemView = ResultView;
    var ResultsCard = new Card.Model({
      id: 'searchresults',
      dataflow: dataflow,
      card: ResultsView,
      pinned: false
    });
    results.on('add', function () {
      dataflow.addCard(ResultsCard);
    });

    Search.results = results;

    _.each(dataflow.plugins, function (plugin, name) {
      if (!plugin.onSearch) {
        return;
      }
      Search.searchPlugin(results, text, plugin);
    });
  };

  Search.searchPlugin = function (results, text, plugin) {
    plugin.onSearch(text, function (pluginResults) {
      if (text !== Search.results.search) {
        // Search has changed, ignore results
        return;
      }

      pluginResults.forEach(function (result) {
        results.add(result);
      });
    });
  };

}(Dataflow));

( function(Dataflow) {
 
  // Dependencies
  var Node = Dataflow.prototype.module("node");
  var Base = Dataflow.prototype.node("base");

  Base.Model = Node.Model.extend({
    defaults: function(){
      var defaults = Node.Model.prototype.defaults.call(this);
      defaults.type = "base";
      return defaults;
    },
    initialize: function() {
      Node.Model.prototype.initialize.call(this);
    },
    unload: function(){
      // Stop any processes that need to be stopped
    },
    inputs:[],
    outputs:[]
  });

  Base.View = Node.View.extend({
  });

}(Dataflow) );

( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.prototype.node("base");
  var BaseResizable = Dataflow.prototype.node("base-resizable");

  BaseResizable.Model = Base.Model.extend({
    defaults: function(){
      var defaults = Base.Model.prototype.defaults.call(this);
      defaults.type = "base-resizable";
      defaults.w = 200;
      defaults.h = 200;
      return defaults;
    },
    initialize: function() {
      Base.Model.prototype.initialize.call(this);
    },
    unload: function(){
      // Stop any processes that need to be stopped
    },
    toJSON: function(){
      var json = Base.Model.prototype.toJSON.call(this);
      json.w = this.get("w");
      json.h = this.get("h");
      return json;
    },
    inputs:[],
    outputs:[]
  });

  BaseResizable.View = Base.View.extend({
    initialize: function(options) {
      Base.View.prototype.initialize.call(this, options);
      // Initial size
      this.$el.css({
        width: this.model.get("w"),
        height: this.model.get("h")
      });
      // Make resizable
      var self = this;
      this.$el.resizable({
        helper: "dataflow-node helper",
        minHeight: 100,
        minWidth: 120,
        stop: function(event, ui) {
          self.resizeStop(event, ui);
        }
      });
      // The simplest way to extend the events hash
      // this.addEvents({
      //   'resizestop': 'resizeStop'
      // });
    },
    resizeStop: function(event, ui) {
      this.model.set({
        "w": ui.size.width,
        "h": ui.size.height
      });
    }
  });

}(Dataflow) );

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
