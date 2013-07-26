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
        if (!node.view.$el.hasClass("ui-selected")){
          node.view.fade();
        }
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
