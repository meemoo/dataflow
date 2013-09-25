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
      if (info.menu) {
        var Card = Dataflow.prototype.module("card");
        var card = new Card.Model({
          dataflow: this,
          card: {el:info.menu}, // HACK since plugins are not bb views
          pinned: (info.pinned ? true : false)
        });

        this.actionBar.get('actions').add({
          id: info.id,
          icon: info.icon,
          label: info.name,
          showLabel: false,
          action: function(){ this.addCard(card); }
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
    prepend: false,
    initialize: function(options){
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
