(function(Dataflow) {

  var Graph = Dataflow.prototype.module("graph");

  // Dependencies
  var Node = Dataflow.prototype.module("node");
  var Edge = Dataflow.prototype.module("edge");

  var minZoom = 0.25;
  var maxZoom = 2.5;

  var cssZoomSupported = document.createElement("div").style.hasOwnProperty("zoom");

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
    className: "dataflow-graph zoom-normal",
    events: {
      "click": "deselect",
      "click .dataflow-graph-gotoparent": "gotoParent",
      "dragstart": "dragStart",
      "drag": "drag",
      "dragstop": "dragStop"
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

      this.$el.draggable({
        helper: function(){
          var h = $("<div>");
          this.model.dataflow.$el.append(h);
          return h;
        }.bind(this)
      });

      // Default 3D transform
      this.$el.css({
        transform: "translate3d(0, 0, 0) " +
                   "scale3d(1, 1, 1) ",
        transformOrigin: "left top"
      });

      this.pageX = this.$el.position();

      // Handle zooming and scrolling
      this.state = this.model.dataflow.get('state');

      this.bindInteraction();
    },
    dragStartOffset: null,
    dragStart: function (event, ui) {
      if (!ui) { return; }
      this.dragStartOffset = ui.offset;
    },
    drag: function (event, ui) {
      if (!ui) { return; }
      var scale = this.state.get('zoom');
      var deltaX = ui.offset.left - this.dragStartOffset.left;
      var deltaY = ui.offset.top - this.dragStartOffset.top;
      this.$el.css({
        transform: "translate3d("+deltaX/scale+"px, "+deltaY/scale+"px, 0)"
      });
    },
    dragStop: function (event, ui) {
      this.$el.css({
        transform: "translate3d(0, 0, 0)"
      });
      var scale = this.state.get('zoom');
      var deltaX = ui.offset.left - this.dragStartOffset.left;
      var deltaY = ui.offset.top - this.dragStartOffset.top;
      this.model.set({
        panX: this.model.get("panX") + deltaX/scale,
        panY: this.model.get("panY") + deltaY/scale
      });
    },
    gotoParent: function () {
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
      var currentZoom, startX, startY, originX, originY, scale, deltaX, deltaY;
      var self = this;
      Hammer(this.el).on('transformstart', function (event) {
        currentZoom = state.get('zoom');
        startX = event.gesture.center.pageX;
        startY = event.gesture.center.pageY;
        originX = startX/currentZoom;
        originY = startY/currentZoom;
        self.$el.css({
          transformOrigin: originX+"px "+originY+"px"
          // transformOrigin: startX+"px "+startY+"px"
        });
      });
      Hammer(this.el).on('transform', function (event) {
        scale = Math.max(minZoom/currentZoom, Math.min(event.gesture.scale, maxZoom/currentZoom));
        deltaX = (event.gesture.center.pageX - startX) / currentZoom;
        deltaY = (event.gesture.center.pageY - startY) / currentZoom;
        self.$el.css({
          transform: "translate3d("+deltaX+"px,"+deltaY+"px, 0) " +
                     "scale3d("+scale+","+scale+", 1) "
        });
      });
      Hammer(this.el).on('transformend', function (event) {
        // Reset 3D transform
        self.$el.css({
          transform: "translate3d(0, 0, 0) " +
                     "scale3d(1, 1, 1) "
        });
        // Zoom
        var zoom = currentZoom * scale;
        zoom = Math.max(minZoom, Math.min(zoom, maxZoom));
        state.set('zoom', zoom);
        // var scaleD = scale - currentZoom;
        var width = self.$el.width();
        var height = self.$el.height();
        // console.log("panX", self.model.get("panX") );
        // console.log("deltaX", deltaX); 
        // console.log("width", width); 
        // console.log("currentZoom", currentZoom); 
        // console.log("scale", scale);
        // console.log("zoom", zoom);
        // console.log("-===============-");
        //
        // TODO : fix origin difference bump
        self.model.set({
          panX: self.model.get("panX") + deltaX,
          panY: self.model.get("panY") + deltaY
        });
      });

      var onZoom = function () {
        var z = state.get('zoom');
        var lastClass = self.zoomClass;
        self.zoomClass = z < 0.5 ? "zoom-tiny" : (z < 0.8 ? "zoom-small" : (z < 1.3 ? "zoom-normal" : "zoom-big"));
        self.$el
          .removeClass(lastClass)
          .addClass(self.zoomClass);
        self.el.style.zoom = state.get('zoom');
      };

      state.on('change:zoom', onZoom);

      // Initial zoom state from localStorage
      if (state.get('zoom') !== 1) {
        onZoom();
      }
    },
    zoomClass: 1,
    zoomIn: function () {
      var currentZoom = this.state.get('zoom');
      var zoom = currentZoom * 0.9;
      zoom = Math.max(minZoom, zoom); 
      if (zoom !== currentZoom) {
        this.state.set('zoom', zoom);
      }
    },
    zoomOut: function () {
      var currentZoom = this.state.get('zoom');
      var zoom = currentZoom * 1.1;
      zoom = Math.min(maxZoom, zoom); 
      if (zoom !== currentZoom) {
        this.state.set('zoom', zoom);
      }
    },
    zoomCenter: function () {
      var currentZoom = this.state.get('zoom');
      var zoom = 1;
      if (zoom !== currentZoom) {
        this.state.set('zoom', 1);
      }
    },
    bindScroll: function (state) {
      // this.el.addEventListener('scroll', function (event) {
      //   state.set('scrollY', this.scrollTop);
      //   state.set('scrollX', this.scrollLeft);
      // });
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
        var width =  Math.max( Math.round(rect.x+rect.width +50), 50 );
        var height = Math.max( Math.round(rect.y+rect.height+50), 50 );
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
      } catch (error) {}
    },
    deselect: function () {
      this.$(".dataflow-node").removeClass("ui-selected");
      this.model.trigger("selectionChanged");
      this.unfade();
      this.model.dataflow.hideMenu();
    },
    fade: function () {
      this.model.nodes.each(function(node){
        if (!node.view.$el.hasClass("ui-selected")){
          if (node.view) {
            node.view.fade();
          }
        }
      });
      this.model.edges.each(function(edge){
        if (edge.view) {
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
    }
  });

}(Dataflow) );
