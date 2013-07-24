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
