/*! dataflow.js - v0.0.7 - 2013-07-26 (2:56:15 AM GMT+0200)
* Copyright (c) 2013 Forrest Oliphant; Licensed MIT, GPL */
(function(Backbone) {
  var ensure = function (obj, key, type) {
    if (!obj[key]) {
      obj[key] = new type();
    }
    if (!(obj[key] instanceof type)) {
      obj[key] = new type(obj[key]);
    }
  };

  var ActionItem = Backbone.Model.extend({
    defaults: {
      action: null,
      label: '',
      disabled: false,
      icon: ''
    }
  });

  var ActionList = Backbone.Collection.extend({
    model: ActionItem
  });

  var ActionBar = Backbone.Model.extend({
    view: null,
    context: null,

    defaults: {
      control: null,
      actions: null,
      overflow: null,
      className: 'actionbar'
    },

    initialize: function (attributes, context) {
      ensure(this.attributes, 'control', ActionItem);
      ensure(this.attributes, 'actions', ActionList);
      ensure(this.attributes, 'overflow', ActionList);
      this.context = context;
    },

    render: function () {
      this.view = new ActionBarView({
        model: this,
        context: this.context
      });
      return this.view.render().el;
    },

    show: function () {
      var bar = this.render();
      Backbone.$('body').prepend(bar);
    },

    hide: function () {
      if (!this.view) {
        return;
      }
      this.view.$el.remove();
      this.view = null;
    }
  });

  var ContextBar = Backbone.Model.extend({
    view: null,
    context: null,

    defaults: {
      control: null,
      actions: null,
      className: 'contextbar'
    },

    initialize: function (attributes, context) {
      ensure(this.attributes, 'control', ActionItem);
      ensure(this.attributes, 'actions', ActionList);
      this.context = context;
    },

    render: function () {
      this.view = new ContextBarView({
        model: this,
        context: this.context
      });
      return this.view.render().el;
    },

    show: function () {
      var bar = this.render();
      Backbone.$('body').prepend(bar);
    },

    hide: function () {
      if (!this.view) {
        return;
      }
      this.view.$el.remove();
      this.view = null;
    }
  });

  var ActionBarView = Backbone.View.extend({
    tagName: 'div',
    className: 'navbar navbar-fixed-top',
    template: '<div class="navbar-inner"></div>',
    $inner: null,
    $control: null,
    $actions: null,
    context: null,

    events: {
      'click .control-up': 'handleUp',
      'click .control-icon': 'handleIcon',
      'click .control-label': 'handleLabel'
    },

    initialize: function (options) {
      this.listenTo(this.model.get('control'), 'change', this.renderControl);
      this.context = options.context;
    },

    handleUp: function (event) {
      event.preventDefault();
      if (this.model.get('control').get('disabled')) {
       return;
      }
      if (!this.model.get('control').get('up')) {
        return;
      }
      this.model.get('control').get('up').call(this.context);
    },

    handleIcon: function (event) {
      if (this.model.get('control').get('up')) {
        this.handleUp(event);
        return;
      }
      this.handleLabel(event);
    },

    handleLabel: function (event) {
      event.preventDefault();
      if (this.model.get('control').get('disabled')) {
       return;
      }
      if (!this.model.get('control').get('action')) {
        return;
      }
      this.model.get('control').get('action').call(this.context);
    },

    render: function () {
      this.$el.html(this.template);
      this.$el.addClass(this.model.get('className'));
      this.$inner = Backbone.$('.navbar-inner', this.$el);
      this.$control = null;
      this.$actions = null;
      this.renderControl();
      this.renderActions();
      this.renderOverflow();
      return this;
    },

    renderControl: function () {
      if (!this.model.get('control')) {
        return;
      }
      if (!this.$control) {
        this.$control = Backbone.$('<a>');
        this.$control.addClass('brand');
        this.$inner.prepend(this.$control);
      }
      var icon = this.model.get('control').get('icon');
      var up = this.model.get('control').get('up');
      var label = this.model.get('control').get('label');
      this.$control.empty();
      if (up) {
        this.$control.append(Backbone.$('<i class="control-up icon-chevron-left"></i><span class="control-up">&nbsp;</span>'));
      }
      if (icon) {
        this.$control.append(Backbone.$('<i class="control-icon icon-' + icon + '"></i>'));
      }
      if (label) {
        this.$control.append('<span class="control-label">&nbsp;' + label + '</span>');
      }
    },

    renderActions: function () {
      if (this.$actions) {
        return;
      }
      var view = new ActionListView({
        collection: this.model.get('actions'),
        context: this.context
      });
      this.$inner.append(view.render().$el);
      this.$actions = view.$el;
    },

    renderOverflow: function () {
    }
  });

  var ContextBarView = Backbone.View.extend({
    tagName: 'div',
    className: 'navbar navbar-inverse navbar-fixed-top',
    template: '<div class="navbar-inner"></div>',
    $inner: null,
    $control: null,
    $actions: null,
    context: null,

    events: {
      'click .control-icon': 'handleControl',
      'click .control-label': 'handleControl'
    },

    handleControl: function (event) {
      event.preventDefault();
      if (this.model.get('control').get('disabled')) {
       return;
      }
      if (!this.model.get('control').get('action')) {
        return;
      }
      this.model.get('control').get('action').call(this.context);
    },

    initialize: function (options) {
      this.listenTo(this.model.get('control'), 'change', this.renderControl);
      this.context = options.context;
    },

    render: function () {
      this.$el.html(this.template);
      this.$el.addClass(this.model.get('className'));
      this.$inner = Backbone.$('.navbar-inner', this.$el);
      this.$control = null;
      this.$actions = null;
      this.renderControl();
      this.renderActions();
      return this;
    },

    renderControl: function () {
      if (!this.$control) {
        this.$control = Backbone.$('<a>');
        this.$control.addClass('brand');
        this.$inner.prepend(this.$control);
      }
      var icon = this.model.get('control').get('icon');
      var label = this.model.get('control').get('label');
      this.$control.empty();
      if (icon) {
        this.$control.append(Backbone.$('<i class="control-icon icon-' + icon + '"></i>'));
      }
      if (label) {
        this.$control.append('<span class="control-label"> ' + label + '</span>');
      }
    },

    renderActions: function () {
      if (this.$actions) {
        return;
      }
      var view = new ActionListView({
        collection: this.model.get('actions'),
        context: this.context
      });
      this.$inner.append(view.render().$el);
      this.$actions = view.$el;
    }
  });

  var ActionListView = Backbone.View.extend({
    tagName: 'ul',
    className: 'nav pull-right',
    views: {},
    context: null,

    initialize: function (options) {
      this.collection = options.collection;
      this.context = options.context;
      this.listenTo(this.collection, 'add', this.addItem);
      this.listenTo(this.collection, 'remove', this.removeItem);
      this.listenTo(this.collection, 'reset', this.render);
    },

    render: function () {
      this.$el.empty();
      this.collection.each(this.addItem, this);
      return this;
    },

    addItem: function (action) {
      var view = new ActionItemView({
        model: action,
        context: this.context
      });
      this.$el.append(view.render().el);
      this.views[action.cid] = view;
    },

    removeItem: function (action) {
      if (!this.views[action.cid]) {
        return;
      }

      this.views[action.cid].$el.remove();
      delete this.views[action.cid];
    }
  });

  var ActionItemView = Backbone.View.extend({
    tagName: 'li',
    template: '<a></a>',
    context: null,

    events: {
      'click': 'handleClick'
    },
    
    initialize: function (options) {
      this.context = options.context;
      this.listenTo(this.model, 'change', this.render);
    },

    handleClick: function (event) {
      event.preventDefault();
      if (this.model.get('disabled')) {
        return;
      }
      if (!this.model.get('action')) {
        return;
      }
      this.model.get('action').call(this.context);
    },

    render: function () {
      this.$el.html(this.template);
      var $btn = Backbone.$('a', this.$el);
      $btn.append(Backbone.$('<i class="icon-' + this.model.get('icon') + '"></i>'));
      $btn.append( this.model.get('label') );

      if (this.model.get('disabled')) {
        this.$el.addClass('disabled');
      } else {
        this.$el.removeClass('disabled');
      }
      return this;
    }
  });

  window.ActionBar = ActionBar;
  window.ContextBar = ContextBar;
})(Backbone);

(function(){
  var App = Backbone.Model.extend({
    "$": function(query) {
      return this.$el.find(query);
    },
    initialize: function(q){
      this.el = document.createElement("div");
      this.el.className = "dataflow";
      this.$el = $(this.el);
      var menu = $('<div class="dataflow-menu">');
      var self = this;
      var menuClose = $('<button class="dataflow-menu-close icon-remove"></button>')
        .click( function(){ self.hideMenu(); } )
        .appendTo(menu);
      this.$el.append(menu);

      // Debug mode
      this.debug = this.get("debug");

      // Show controls?
      this.controls = this.get("controls");
      if (this.controls !== false) {
        // Default to true
        this.controls = true;
      }

      if (this.controls) {
        // Setup actionbar
        this.prepareActionBar();
        this.renderActionBar();

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
    prepareActionBar: function () {
      this.actionBar = new ActionBar({}, this);
      this.actionBar.get('control').set({
        label: 'Dataflow',
        icon: 'retweet'
      });
      this.contextBar = new ContextBar({}, this);
      this.contextBar.get('control').set({
        label: '1 selected',
        icon: 'ok',
        action: function () {
          if (this.currentGraph && this.currentGraph.view) {
            this.currentGraph.view.deselect();
          }
        }
      });
    },
    renderActionBar: function () {
      this.$el.append( this.actionBar.render() );
      this.$(".brand").attr({
        href: "https://github.com/meemoo/dataflow",
        target: "_blank"
      });
      this.$el.append( this.contextBar.render() );
      this.contextBar.view.$el.hide();
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
      this.nodes[name] = {};
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
    hideMenu: function () {
      this.$el.removeClass("menu-shown");
    },
    showMenu: function (id) {
      this.$el.addClass("menu-shown");
      this.$(".dataflow-menuitem").removeClass("shown");
      this.$(".dataflow-menuitem-"+id).addClass("shown");
    },
    addPlugin: function (info) {
      if (info.menu) {
        var menu = $("<div>")
          .addClass("dataflow-menuitem dataflow-menuitem-"+info.id)
          .append(info.menu);
        this.$(".dataflow-menu").append( menu );

        this.actionBar.get('actions').add({
          id: info.id,
          icon: info.icon,
          label: info.name,
          action: function(){ this.showMenu(info.id); }
        });
      }
    },
    showContextBar: function () {
      this.actionBar.view.$el.hide();
      this.contextBar.view.$el.show();
    },
    hideContextBar: function () {
      this.contextBar.view.$el.hide();
      this.actionBar.view.$el.show();
    },
    contexts: {},
    addContext: function (info) {
      for (var i=0; i<info.contexts.length; i++){
        var c = info.contexts[i];
        if (!this.contexts[c]) {
          this.contexts[c] = [];
        }
        this.contexts[c].push(info);
      }
    },
    changeContext: function (selected) {
      if (!this.contextBar) { return false; }
      if (selected.length > 1) {
        // More than one selected: Move to subgraph, Cut/Copy
        this.contextBar.get('control').set({
          label: selected.length + ' selected'
        });
        this.contextBar.get('actions').reset();
        this.contextBar.get('actions').add(this.contexts.twoplus);

        this.showContextBar();
      } else if (selected.length === 1) {
        // One selected: Remove node, Rename node, Change component, Cut/Copy
        this.contextBar.get('control').set({
          label: '1 selected'
        });
        this.contextBar.get('actions').reset();
        this.contextBar.get('actions').add(this.contexts.one);
        this.showContextBar();
      } else {
        // None selected: hide contextBar
        this.hideContextBar();
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
    initialize: function(options){
      this.el = document.createElement(this.tagName);
      this.$el = $(this.el);
      this.parent = options.parent;
      var collection = this.get("collection");
      collection.each(this.addItem, this);
      collection.on("add", this.addItem, this);
      collection.on("remove", this.removeItem, this);
    },
    addItem: function(item){
      item.view = new this.itemView({
        model:item,
        parent: this.parent
      });
      this.$el.append(item.view.render().el);
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
      edges: []
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
      this.selected = [];
      if (!this.view) {
        return;
      }

      this.nodes.each( function (node) {
        if (node.view && node.view.$el.hasClass("ui-selected")) {
          this.selected.push(node);
        }
      }, this);

      this.dataflow.changeContext(this.selected);
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

      // Selection event
      this.on("select", this.select, this);

    },
    select: function() {
      this.parentGraph.trigger("select:node", this);
    },
    setState: function (name, value) {
      var state = this.get("state");
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
      label: "",
      type: "all",
      description: ""
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
      if (this.get("label")===""){
        this.set({label: this.id});
      }
      this.connected = [];
    },
    connect: function(edge){
      this.connected.push(edge);
      this.connected = _.uniq(this.connected);
    },
    disconnect: function(edge){
      this.connected = _.without(this.connected, edge);
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
      description: ""
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
      "route": 0
    },
    initialize: function() {
      var nodes, sourceNode, targetNode;
      var preview = this.get("preview");
      this.parentGraph = this.get("parentGraph");
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
      if (this.collection) {
        this.collection.sort();
      }
    },
    remove: function(){
      this.source.disconnect(this);
      this.target.disconnect(this);
      if (this.collection) {
        this.collection.remove(this);
      }

      // Remove listener
      this.source.parentNode.off("send:"+this.source.id, this.send, this);
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
 
  var template = 
    '<div class="dataflow-edges">'+
      '<svg class="dataflow-svg-edges" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width="800" height="800"></svg>'+
    '</div>'+
    '<div class="dataflow-nodes" />'+
    '<div class="dataflow-graph-controls">'+
      '<button class="dataflow-graph-gotoparent"><i class="icon-chevron-left"></i> back to parent</button>'+
    '</div>';

  Graph.View = Backbone.View.extend({
    template: _.template(template),
    className: "dataflow-graph",
    events: {
      "click": "deselect",
      "click .dataflow-graph-gotoparent": "gotoParent"
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

      // Handle zooming and scrolling
      this.bindInteraction();
    },
    gotoParent: function() {
      var parentNode = this.model.get("parentNode");
      if (parentNode){
        this.model.dataflow.showGraph( parentNode.parentGraph );
      }
    },
    bindInteraction: function () {
      var state = this.model.dataflow.get('state');
      this.bindZoom(state);
      this.bindScroll(state);

    },
    bindZoom: function (state) {
      if (!window.Hammer) {
        return;
      }
      if (!state.has('zoom')) {
        // Initial zoom level
        // TODO: calculate level where whole graph fits
        state.set('zoom', 1);
      }
      var self = this;
      var lastScale;
      Hammer(this.el).on('touch', function (event) {
        lastScale = state.get('zoom');
        state.set('centerX', event.gesture.center.pageX);
        state.set('centerY', event.gesture.center.pageY);
      });
      Hammer(this.el).on('pinch', function (event) {
        var zoom = Math.max(0.5, Math.min(lastScale * event.gesture.scale, 3));
        var centerX = state.get('centerX');
        var centerY = state.get('centerY');
        var scrollX = centerX - (centerX / zoom);
        var scrollY = centerY - (centerY / zoom);
        state.set('zoom', zoom);
        state.set('scrollY', scrollY);
        state.set('scrollX', scrollX);
      });

      var onZoom = function () {
        self.el.style.zoom = state.get('zoom');
        self.el.scrollTop = state.get('scrollY');
        self.el.scrollLeft = state.get('scrollX');
      };
      state.on('change:zoom', onZoom);

      // Initial zoom state from localStorage
      if (state.get('zoom') !== 1) {
        onZoom();
      }
    },
    bindScroll: function (state) {
      this.el.addEventListener('scroll', function (event) {
        state.set('scrollY', this.scrollTop);
        state.set('scrollX', this.scrollLeft);
      });
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
      edge.view.remove();
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
        svg.setAttribute("width", Math.round(rect.x+rect.width+50));
        svg.setAttribute("height", Math.round(rect.y+rect.height+50));
      } catch (error) {}
    },
    deselect: function () {
      this.$(".dataflow-node").removeClass("ui-selected");
      this.model.trigger("selectionChanged");
      this.unfade();
    },
    fade: function () {
      this.model.nodes.each(function(node){
        node.view.fade();
      });
      this.model.edges.each(function(edge){
        edge.view.fade();
      });
    },
    unfade: function () {
      this.model.nodes.each(function(node){
        node.view.unfade();
      });
      this.model.edges.each(function(edge){
        edge.view.unfade();
      });
    }
  });

}(Dataflow) );

( function(Dataflow) {

  var Node = Dataflow.prototype.module("node");

  // Dependencies
  var Input = Dataflow.prototype.module("input");
  var Output = Dataflow.prototype.module("output");

  var template = 
    '<div class="outer" />'+
    '<div class="dataflow-node-header">'+
      '<h1 class="dataflow-node-title"><span class="label"><%- label %></span> <input class="label-edit" value="<%- label %>" type="text" /></h1>'+
      '<button title="properties" class="dataflow-node-inspect icon-cog"></button>'+
    '</div>'+
    '<div class="dataflow-node-ports dataflow-node-ins" />'+
    '<div class="dataflow-node-ports dataflow-node-outs" />'+
    '<div class="dataflow-node-inner" />';

  var inspectTemplate = 
    '<h1 class="dataflow-node-inspector-title"><%- label %></h1>'+
    // '<div class="dataflow-node-inspector-controls">'+
    //   '<button class="dataflow-node-delete">delete</button>'+
    //   '<button class="dataflow-node-save">save</button>'+
    //   '<button class="dataflow-node-cancel">cancel</button>'+
    // '</div>'+
    '<div class="dataflow-node-inspector-inputs"></div>';

  var innerTemplate = "";
 
  Node.View = Backbone.View.extend({
    template: _.template(template),
    innerTemplate: _.template(innerTemplate),
    inspectTemplate: _.template(inspectTemplate),
    className: "dataflow-node",
    events: function(){
      return {
        "click .dataflow-node-inspect": "showInspector",
        "click":   "select",
        "dragstart":     "dragStart",
        "drag":          "drag",
        "dragstop":      "dragStop"
        // "click .dataflow-node-delete": "removeModel",
        // "click .dataflow-node-cancel": "hideControls",
        // "click .dataflow-node-save":   "saveLabel"
      };
    },
    initialize: function(options) {
      this.$el.html(this.template(this.model.toJSON()));

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
        // grid: [ 5, 5 ],
        helper: function(){
          var node = self.$el;
          var width = node.width();
          var height = node.height();
          return $('<div class="dataflow-node helper" style="width:'+width+'px; height:'+height+'px">');
        }
      });

      this.$el.data("dataflow-node-view", this);

      // Inner template
      this.$(".dataflow-node-inner").append(this.innerTemplate);

      // Listener to reset inputs list
      // this.inputs.on("change", function(input){
      //   this.$inputsList = null;
      //   console.log("change");
      // }, this);

      this.$inner = this.$(".dataflow-node-inner");
    },
    render: function() {
      // Initial position
      this.$el.css({
        left: this.model.get("x"),
        top: this.model.get("y")
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
    dragStart: function(event, ui){
      // Select this
      if (!this.$el.hasClass("ui-selected")){
        this.select(event);
      }

      // Make helper and save start position of all other selected
      var self = this;
      this._alsoDrag = [];
      this.model.parentGraph.view.$(".ui-selected").each(function() {
        if (self.el !== this) {
          var el = $(this);
          var position = {
            left: parseInt(el.css('left'), 10), 
            top: parseInt(el.css('top'), 10)
          };
          el.data("ui-draggable-alsodrag-initial", position);
          // Add helper
          var helper = $('<div class="node helper">').css({
            width: el.width(),
            height: el.height(),
            left: position.left,
            top: position.top
          });
          el.parent().append(helper);
          el.data("ui-draggable-alsodrag-helper", helper);
          // Add to array
          self._alsoDrag.push(el);
        }
      });
    },
    drag: function(event, ui){
      // Drag other helpers
      if (this._alsoDrag.length) {
        var self = $(event.target).data("ui-draggable");
        var op = self.originalPosition;
        var delta = {
          top: (self.position.top - op.top) || 0, 
          left: (self.position.left - op.left) || 0
        };

        _.each(this._alsoDrag, function(el){
          var initial = el.data("ui-draggable-alsodrag-initial");
          var helper = el.data("ui-draggable-alsodrag-helper");
          helper.css({
            left: initial.left + delta.left,
            top: initial.top + delta.top
          });
        });
      }
    },
    dragStop: function(event, ui){
      var x = parseInt(ui.position.left, 10);
      var y = parseInt(ui.position.top, 10);
      this.moveToPosition(x,y);
      // Also drag
      if (this._alsoDrag.length) {
        _.each(this._alsoDrag, function(el){
          var initial = el.data("ui-draggable-alsodrag-initial");
          var helper = el.data("ui-draggable-alsodrag-helper");
          var node = el.data("dataflow-node-view");
          // Move other node
          node.moveToPosition(parseInt(helper.css("left"), 10), parseInt(helper.css("top"), 10));
          // Remove helper
          helper.remove();
          el.data("ui-draggable-alsodrag-initial", null);
          el.data("ui-draggable-alsodrag-helper", null);
        });
        this._alsoDrag = [];
      }
    },
    moveToPosition: function(x, y){
      x = Math.max(x, 0);
      y = Math.max(y, 0);
      this.$el.css({
        left: x,
        top: y
      });
      this.model.set({
        x: x,
        y: y
      });
    },
    showInspector: function(){
      this.model.parentGraph.dataflow.showMenu("inspector");
      var $inspector = this.model.parentGraph.dataflow.$(".dataflow-plugin-inspector");
      $inspector.children().detach();
      $inspector.append( this.getInputList() );
      
      this.highlightEdges();
    },
    highlightEdges: function(){
      
    },
    hideControls: function(){
    },
    saveLabel: function(){
      // Save new label
      var newLabel = this.$(".title .label-edit").val();
      if (this.model.get("label") !== newLabel) {
        this.model.set("label", newLabel);
        this.$(".title .label").text(newLabel);
      }
      this.hideControls();
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
    select: function(event){
      if (event) {
        // Don't click graph
        event.stopPropagation();
        // Called from click
        if (event.ctrlKey || event.metaKey) {
          // Command key is pressed, toggle selection
          this.$el.toggleClass("ui-selected");
        } else {
          // Command key isn't pressed, deselect others and select this one
          this.model.parentGraph.view.$(".ui-selected").removeClass("ui-selected");
          this.$el.addClass("ui-selected");
        }
        // Bring to top
        this.bringToTop();
      } else {
        // Called from code
        this.$el.addClass("ui-selected");
        this.bringToTop();
      }
      // Trigger
      if ( this.$el.hasClass("ui-selected") ) {
        this.model.trigger("select");
        // Fade others, highlight these
        this.model.parentGraph.view.fade();
        this.unfade();
      }
      this.model.parentGraph.trigger("selectionChanged");
    },
    fade: function(){
      this.$el.addClass("fade");
    },
    unfade: function(){
      this.$el.removeClass("fade");
      // Unfade related edges
      var self = this;
      this.model.parentGraph.edges.each(function(edge){
        if (edge.source.parentNode.id === self.model.id || edge.target.parentNode.id === self.model.id) {
          edge.view.unfade();
        }
      });
    },
    $inputList: null,
    getInputList: function() {
      if (!this.$inputList) {
        this.$inputList = $("<div>");
        var model = this.model.toJSON();
        this.$inputList.html( this.inspectTemplate(model) );
        if (model.id !== model.label) {
          this.$inputList.children(".dataflow-node-inspector-title").prepend(model.id + ": ");
        }
        var $inputs = this.$inputList.children(".dataflow-node-inspector-inputs");
        this.model.inputs.each(function(input){
          if (input.view && input.view.$input) {
            $inputs.append( input.view.$input );
          }
        }, this);
      }
      return this.$inputList;
    }
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

      if (!this.model.parentNode.parentGraph.dataflow.editable) {
        // No drag and drop
        return;
      }

      var self = this;
      this.parent = options.parent;
      this.$(".dataflow-port-plug").draggable({
        cursor: "pointer",
        helper: function(){
          var helper = $('<span class="dataflow-port-plug in helper" />');
          $('.dataflow-graph').append(helper);
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
          $('.dataflow-graph').append(helper);
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
          return;
        }
        this.setInputValue(input, type, state[this.model.id]);
      }.bind(this));

      var label = $("<label>")
        .append( input )
        .prepend( '<span>' + this.model.get("label") + "</span> " );
      this.$input = label;
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
          input = $('<input type="checkbox" class="input input-boolean">');
          input.change(this.inputBoolean.bind(this));
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
    inputBang: function(){
      this.model.parentNode.setBang(this.model.id);
    },
    render: function(){
      return this;
    },
    newEdgeStart: function(event, ui){
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
    },
    newEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      if (!this.previewEdgeNewView || !ui) {
        return;
      }
      var state = this.model.parentNode.parentGraph.dataflow.get('state');
      ui.position.top = event.clientY / state.get('zoom');
      ui.position.left = event.clientX / state.get('zoom');
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
    },
    getTopEdge: function() {
      var topEdge;
      if (this.isConnected){
        // Will get the last (top) matching edge
        this.model.parentNode.parentGraph.edges.each(function(edge){
          if(edge.target === this.model){
            topEdge = edge;
          }
          if (edge.view) {
            edge.view.unhighlight();
          }
        }, this);
        if (topEdge && topEdge.view) {
          topEdge.view.click();
        }
      }
      return topEdge;
    },
    changeEdgeStart: function(event, ui){
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
        }
      }
    },
    changeEdgeDrag: function(event, ui){
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
    connectEdge: function(event, ui) {
      // Dropped to this el
      var otherPort = ui.helper.data("port");
      var oldLength = this.model.parentNode.parentGraph.edges.length;

      if (otherPort.parentNode.parentGraph.dataflow !== this.model.parentNode.parentGraph.dataflow) {
        // from another widget
        return false;
      }

      var route = 0;
      if (ui.helper.data("route") !== undefined) {
        route = ui.helper.data("route");
      }

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
    holePosition: function(){
      var holePos = this.$(".dataflow-port-hole").offset();
      if (!this.parent) {
        this.parent = this.options.parent;
      }
      var $graph = this.parent.graph.$el;
      var graphPos = $graph.offset();
      return {
        left: $graph.scrollLeft() + holePos.left - graphPos.left + 5,
        top: $graph.scrollTop() + holePos.top - graphPos.top + 8
      };
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
      var isConnected = this.model.parentNode.parentGraph.edges.some(function(edge){
        return (edge.target === this.model);
      }, this);
      if (!isConnected) {
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

      if (!this.model.parentNode.parentGraph.dataflow.editable) {
        // No drag and drop
        return;
      }

      var self = this;
      this.parent = options.parent;
      this.$(".dataflow-port-plug").draggable({
        cursor: "pointer",
        helper: function(){
          var helper = $('<span class="dataflow-port-plug out helper" />');
          $('.dataflow-graph').append(helper);
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
          $('.dataflow-graph').append(helper);
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
    },
    newEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      if (!this.previewEdgeView || !ui) {
        return;
      }
      var state = this.model.parentNode.parentGraph.dataflow.get('state');
      ui.position.top = event.clientY / state.get('zoom');
      ui.position.left = event.clientX / state.get('zoom');
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
    },
    getTopEdge: function() {
      var topEdge;
      if (this.isConnected){
        // Will get the last (top) matching edge
        this.model.parentNode.parentGraph.edges.each(function(edge){
          if(edge.source === this.model){
            topEdge = edge;
          }
          if (edge.view) {
            edge.view.unhighlight();
          }
        }, this);
        if (topEdge && topEdge.view) {
          topEdge.view.click();
        }
      }
      return topEdge;
    },
    changeEdgeStart: function(event, ui){
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
        }
      }
    },
    changeEdgeDrag: function(event, ui){
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
        // delete this.previewEdgeChange;
        // delete this.previewEdgeChangeView;
      }
    },
    connectEdge: function(event, ui) {
      // Dropped to this el
      var otherPort = ui.helper.data("port");
      var oldLength = this.model.parentNode.parentGraph.edges.length;

      if (otherPort.parentNode.parentGraph.dataflow !== this.model.parentNode.parentGraph.dataflow) {
        // from another widget
        return false;
      }

      var route = 0;
      if (ui.helper.data("route") !== undefined) {
        route = ui.helper.data("route");
      }

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
    // _holePosition: null,
    holePosition: function () {
      var holePos = this.$(".dataflow-port-hole").offset();
      if (!this.parent) {
        this.parent = this.options.parent;
      }
      var $graph = this.parent.graph.$el;
      var graphPos = $graph.offset();
      return {
        left: $graph.scrollLeft() + holePos.left - graphPos.left + 5,
        top: $graph.scrollTop() + holePos.top - graphPos.top + 8
      };
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
      var isConnected = this.model.parentNode.parentGraph.edges.some(function(edge){
        return (edge.source === this.model);
      }, this);
      if (!isConnected) {
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

  var inspectTemplate = 
    '<h1 class="dataflow-edge-inspector-title">Edge</h1>'+
    '<div class="dataflow-edge-inspector-route-choose"></div>';
    // '<div class="dataflow-edge-inspector-route route<%- route %>"><%- route %></div>';
  
  Edge.View = Backbone.View.extend({
    tagName: "div",
    className: "dataflow-edge",
    positions: null,
    inspectTemplate: _.template(inspectTemplate),
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
      this.positions.from.left = Math.floor(this.positions.from.left);
      this.positions.from.top = Math.floor(this.positions.from.top);
      this.positions.to.left = Math.floor(this.positions.to.left);
      this.positions.to.top = Math.floor(this.positions.to.top);
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
      this.el.setAttribute("class", "dataflow-edge fade");
    },
    unfade: function(){
      this.el.setAttribute("class", "dataflow-edge");
    },
    highlight: function(){
      this.el.setAttribute("class", "dataflow-edge highlight");
    },
    unhighlight: function(){
      this.el.setAttribute("class", "dataflow-edge");
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
      // event.stopPropagation();
      // Highlight
      this.highlight();
      this.bringToTop();
      this.model.trigger("select");
    },
    bringToTop: function(){
      this.model.bringToTop();
      var parent = this.el.parentNode;
      if (parent) {
        parent.appendChild(this.el);
      }

      // Fade all and highlight related
      // this.model.parentGraph.view.fade();
      // this.unfade();
      // this.model.source.parentNode.view.unfade();
      // this.model.target.parentNode.view.unfade();

      // Port hole color
      this.model.source.view.bringToTop(this.model);
      this.model.target.view.bringToTop(this.model);
    },
    $inspect: null,
    getInspect: function() {
      if (!this.$inspect) {
        this.$inspect = $("<div>");
        var model = this.model.toJSON();
        this.$inspect.html( this.inspectTemplate(model) );
        var $choose = this.$inspect.children(".dataflow-edge-inspector-route-choose");
        var self = this;
        var changeRoute = function(event){
          self.model.set("route", $(event.target).data("route"));
        };
        for (var i=0; i<12; i++) {
          var button = $("<button>")
            .data("route", i)
            .addClass("route"+i)
            .click(changeRoute);
          $choose.append(button);
        }
      }
      return this.$inspect;
    }
  });

}(Dataflow) );

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
      dataflow.currentGraph.view.$(".node").addClass("ui-selected");
    }
    buttons.children(".selectall").click(selectAll);

    //
    // X
    //

    function cut(){
      // Copy selected
      copy();
      // Move back so paste in original place
      _.each(copied.nodes, function(node){
        node.x -= 50;
        node.y -= 50;
      });
      // Remove selected
      var toRemove = dataflow.currentGraph.nodes.filter(function(node){
        return node.view.$el.hasClass("ui-selected");
      });
      _.each(toRemove, function(node){
        node.remove();
      });
    }
    buttons.children(".cut").click(cut);

    //
    // C
    //

    var copied = {};
    function copy(){
      copied = {};
      // nodes
      copied.nodes = [];
      dataflow.currentGraph.nodes.each(function(node){
        if (node.view.$el.hasClass("ui-selected")) {
          copied.nodes.push( JSON.parse(JSON.stringify(node)) );
        }
      });
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
        if (connectedSource && connectedTarget){
          copied.edges.push( JSON.parse(JSON.stringify(edge)) );
        }
      });
    }
    buttons.children(".copy").click(copy);

    //
    // V
    //

    function paste(){
      if (copied && copied.nodes.length > 0) {
        // Deselect all
        dataflow.currentGraph.view.$(".node").removeClass("ui-selected");
        // Add nodes
        _.each(copied.nodes, function(node){
          // Offset pasted
          node.x += 50;
          node.y += 50;
          node.parentGraph = dataflow.currentGraph;
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
          // Select it
          newNode.view.select();
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



    // Add context actions for actionbar

    dataflow.addContext({
      id: "cut",
      icon: "cut",
      label: "cut",
      action: cut,
      contexts: ["one", "twoplus"]
    });
    dataflow.addContext({
      id: "copy",
      icon: "copy",
      label: "copy",
      action: copy,
      contexts: ["one", "twoplus"]
    });
    dataflow.addContext({
      id: "paste",
      icon: "paste",
      label: "paste",
      action: paste,
      contexts: ["one", "twoplus"]
    });


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
 
    var library = $('<ul class="dataflow-plugin-library" style="list-style:none; padding-left:0" />');

    var addNode = function(node, x, y) {
      return function(){
        // Deselect others
        dataflow.currentGraph.view.$(".node").removeClass("ui-selected");
        // Find vacant id
        var id = 1;
        while (dataflow.currentGraph.nodes.get(id)){
          id++;
        }
        // Position if button clicked
        x = x===undefined ? 200 : x;
        y = y===undefined ? 200 : y;
        x += dataflow.currentGraph.view.$el.scrollLeft();
        y += dataflow.currentGraph.view.$el.scrollTop();
        x = Math.max(x, 0);
        y = Math.max(y, 0);
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

    var addLibraryItem = function(node, name) {
      var addButton = $('<a class="button">+</a>')
        .attr("title", "click or drag")
        .draggable({
          helper: function(){
            var helper = $('<div class="node helper" style="width:100px; height:100px">'+name+'</div>');
            dataflow.$el.append(helper);
            return helper;
          },
          stop: function(event, ui) {
            addNode(node, ui.position.left, ui.position.top).call();
          }
        })
        .click(addNode(node));
      var item = $("<li />")
        .append(addButton)
        .append(name);
      library.append(item);
    };

    var update = function(options){
      options = options ? options : {};
      options.exclude = options.exclude ? options.exclude : ["base", "base-resizable"];

      library.empty();
      _.each(dataflow.nodes, function(node, index){
        if (options.exclude.indexOf(index) === -1) {
          addLibraryItem(node, index);
        }
      });
    };
    update();

    dataflow.addPlugin({
      id: "library", 
      name: "", 
      menu: library, 
      icon: "plus"
    });

    Library.update = update;

  };

}(Dataflow) );

( function(Dataflow) {

  var Source = Dataflow.prototype.plugin("source");

  Source.initialize = function(dataflow){

    var $form = $( 
      '<form class="dataflow-plugin-view-source">'+
        '<div style="position: absolute; top:5px; left:5px; bottom:35px; right:5px;">'+
          '<textarea class="code" style="width:100%; height:100%; margin:0; padding: 0;"></textarea><br/>'+
        '</div>'+
        '<input class="apply" type="submit" value="apply changes" style="position: absolute; right:5px; bottom:5px;" />'+
      '</form>'
    );
    var $code = $form.find(".code");

    dataflow.addPlugin({
      id: "source", 
      name: "", 
      menu: $form, 
      icon: "globe"
    });

    var show = function(source) {
      var scrollBackTop = $code.prop("scrollTop");
      $code.val( source );
      $code.scrollTop( scrollBackTop );
    };

    Source.show = show;

    var showGraph = function(graph){
      if (dataflow.graph) {
        show( JSON.stringify(dataflow.graph.toJSON(), null, "  ") );
      }
    };

    Source.listeners = function(boo){
      if (boo) {
        // On change update code view
        dataflow.on("change", showGraph);
      } else {
        // Custom
        dataflow.off("change", showGraph);
      }
    };
    Source.listeners(true);

    // Apply source to test graph
    $form.submit(function(){
      var graph;
      try {
        graph = JSON.parse( $code.val() );
      } catch(error){
        dataflow.log("Invalid JSON");
        return false;
      }
      if (graph) {
        var g = dataflow.loadGraph(graph);
        g.trigger("change");
      }
      return false;
    });
    
  };

}(Dataflow) );

( function(Dataflow) {
 
  var Log = Dataflow.prototype.plugin("log");

  Log.initialize = function(dataflow){

    var $log = $(
      '<div class="dataflow-plugin-log" style="position: absolute; top:5px; left:5px; bottom:5px; right:5px; overflow:auto;">'+
        '<ol class="loglist"></ol>'+
      '</div>'
    );

    dataflow.addPlugin({
      id: "log", 
      name: "", 
      menu: $log, 
      icon: "cog"
    });

    // Log message and scroll
    function log(message){
      message = _.escape(message);
      $log.children(".loglist").append("<li>" + message + "</li>");
      $log.scrollTop( $log.prop("scrollHeight") );
    }

    Log.add = log;



    Log.listeners = function(boo){
      if (boo) {
        // Log
        dataflow.on("log", function(message){
          log("log: " + message);
        });

        // Log graph changes
        dataflow.on("node:add", function(graph, node){
          log("node added: " + node.toString());
        });
        dataflow.on("node:remove", function(graph, node){
          log("node removed: " + node.toString());
        });
        dataflow.on("edge:add", function(graph, edge){
          log("edge added: " + edge.toString());
        });
        dataflow.on("edge:remove", function(graph, edge){
          log("edge removed: " + edge.toString());
        });
      } else {
        // Custom
        dataflow.off("log");
        dataflow.off("node:add");
        dataflow.off("node:remove");
        dataflow.off("edge:add");
        dataflow.off("edge:remove");
      }
    };
    Log.listeners(true);

  };

}(Dataflow) );

( function(Dataflow) {
 
  var Inspector = Dataflow.prototype.plugin("inspector");

  Inspector.initialize = function(dataflow){

    var $inspector = $(
      '<div class="dataflow-plugin-inspector"></div>'
    );

    // Doing this manually instead of dataflow.addPlugin()
    var $menu = $("<div>")
      .addClass("dataflow-menuitem dataflow-menuitem-inspector")
      .append($inspector);
    dataflow.$(".dataflow-menu").append($menu);

    var lastSelected = null;

    function updateInspector(){
      if (lastSelected) {
        if (lastSelected.view) {
          $inspector.children().detach();
          $inspector.append( lastSelected.view.getInputList() );
          
          lastSelected.view.highlightEdges();
        }
      }
    }
    // Inspector.updateInspector = updateInspector;

    function showInspector(){
      dataflow.showMenu("inspector");
      updateInspector();
    }

    dataflow.addContext({
      id: "inspector",
      icon: "info-sign",
      label: "inspect",
      action: showInspector,
      contexts: ["one", "twoplus"]
    });

    function selectNode (graph, node) {
      if (lastSelected !== node) {
        lastSelected = node;
        if ($menu.is(':visible')){
          updateInspector();
        }
      }
    }

    function updateInspectorEdge (edge) {
      $inspector.children().detach();
      $inspector.append( edge.view.getInspect() );
    }

    function selectEdge (graph, edge) {
      if (lastSelected !== edge) {
        lastSelected = edge;
        if ($menu.is(':visible')){
          updateInspectorEdge(edge);
        }
      }
    }

    Inspector.listeners = function(boo){
      if (boo) {
        // Selection changes
        dataflow.on("select:node", selectNode);
        dataflow.on("select:edge", selectEdge);
      } else {
        // Custom
        dataflow.off("select:node", selectNode);
        dataflow.off("select:edge", selectEdge);
      }
    };
    Inspector.listeners(true);

  };

}(Dataflow) );

( function(Dataflow) {
 
  // Dependencies
  var Node = Dataflow.prototype.module("node");
  var Base = Dataflow.prototype.node("base");

  Base.Model = Node.Model.extend({
    defaults: function(){
      return {
        label: "",
        type: "base",
        x: 200,
        y: 100,
        state: {}
      };
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
