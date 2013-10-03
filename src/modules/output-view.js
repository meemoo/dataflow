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
