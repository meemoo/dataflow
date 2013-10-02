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
