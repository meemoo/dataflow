(function(Dataflow) {

  var Graph = Dataflow.prototype.module("graph");

  // Dependencies
  var Node = Dataflow.prototype.module("node");
  var Edge = Dataflow.prototype.module("edge");

  var minZoom = 0.25;
  var maxZoom = 2.5;

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
      // "dragstart .dataflow-graph-panzoom": "panStart",
      // "drag .dataflow-graph-panzoom": "pan",
      // "dragstop .dataflow-graph-panzoom": "panStop",
      "click .dataflow-graph-gotoparent": "gotoParent"
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

      // this.$(".dataflow-graph-panzoom").draggable({
      //   helper: function(){
      //     var h = $("<div>");
      //     this.model.dataflow.$el.append(h);
      //     return h;
      //   }.bind(this)
      // });

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
    gotoParent: function () {
      var parentNode = this.model.get("parentNode");
      if (parentNode){
        this.model.dataflow.showGraph( parentNode.parentGraph );
      }
    },
    bindInteraction: function () {
      this.bindZoom();
      this.bindPan();
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
    bindPan: function () {
      var zoom, deltaX, deltaY, isDragging;
      var self = this;

      function panStart (event) {
        if (!event.gesture) { return; }
        // Don't drag other
        event.stopPropagation();

        isDragging = true;
      }
      function pan (event) {
        if (!event.gesture || !isDragging) { return; }
        // Don't drag other
        event.stopPropagation();

        zoom = self.model.get('zoom');
        deltaX = event.gesture.deltaX/zoom;
        deltaY = event.gesture.deltaY/zoom;
        self.$(".dataflow-graph").css({
          transform: "translate3d("+deltaX+"px, "+deltaY+"px, 0)"
        });
      }
      function panEnd (event) {
        if (!event.gesture || !isDragging) { return; }
        // Don't drag other
        event.stopPropagation();

        isDragging = false;

        self.$(".dataflow-graph").css({
          transform: "translate3d(0, 0, 0)"
        });
        self.model.set({
          panX: self.model.get("panX") + deltaX,
          panY: self.model.get("panY") + deltaY
        });
      }

      Hammer( this.$(".dataflow-graph-panzoom")[0] )
        .on("dragstart", panStart)
        .on("drag", pan)
        .on("dragend", panEnd);

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
