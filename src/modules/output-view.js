( function(Output) {

  var Edge = Dataflow.module("edge");
 
  var template = 
    '<span class="label out" title="<%= description %>"><%= label %></span>'+
    '<span class="hole out" title="drag to make new wire"></span>'+
    '<span class="plug out" title="drag to edit wire"></span>';

  Output.View = Backbone.View.extend({
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
        disabled: true,
        // To prevent accidental disconnects
        distance: 10,
        delay: 100
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

      // this.model.parentNode.on("change:x change:y change:w", this.movedHole, this);
    },
    render: function () {
      return this;
    },
    newEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdge = new Edge.Model({
        source: {
          node: this.model.parentNode.id,
          port: this.model.id
        },
        parentGraph: this.model.parentNode.parentGraph,
        preview: true
      });
      this.previewEdgeView = new Edge.View({
        model: this.previewEdge
      });
      var graphSVGElement = this.model.parentNode.parentGraph.view.$('.svg-edges')[0];
      graphSVGElement.appendChild(this.previewEdgeView.el);
    },
    newEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdgeView.render(ui.offset);
      this.model.parentNode.parentGraph.view.sizeSVG();
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
        // var changeEdge = this.model.parentNode.parentGraph.edges.find(function(edge){
        //   return edge.source === this.model;
        // }, this);
        var changeEdge;
        // Will get the last (top) matching edge
        this.model.parentNode.parentGraph.edges.each(function(edge){
          if(edge.source === this.model){
            changeEdge = edge;
          }
        }, this);
        if (changeEdge){
          // Remove edge
          changeEdge.collection.remove(changeEdge);

          // Make preview
          ui.helper.data({
            port: changeEdge.target
          });
          this.previewEdgeChange = new Edge.Model({
            target: changeEdge.get("target"),
            parentGraph: this.model.parentNode.parentGraph,
            preview: true
          });
          this.previewEdgeChangeView = new Edge.View({
            model: this.previewEdgeChange
          });
          var graphSVGElement = this.model.parentNode.parentGraph.view.$('.svg-edges')[0];
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
      this.model.parentNode.parentGraph.edges.add({
        id: this.model.parentNode.id+":"+this.model.id+"→"+otherPort.parentNode.id+":"+otherPort.id,
        parentGraph: this.model.parentNode.parentGraph,
        source: {
          node: this.model.parentNode.id,
          port: this.model.id
        },
        target: {
          node: otherPort.parentNode.id,
          port: otherPort.id
        }
      });
      // Tells changeEdgeStop to remove to old edge
      ui.helper.data("removeChangeEdge", (oldLength < this.model.parentNode.parentGraph.edges.length));
    },
    // _holePosition: null,
    holePosition: function () {
      // if (!this._holePosition){
      //   this._holePosition = this.$(".hole").offset();
      // }
      // return this._holePosition;
      return this.$(".hole").offset();
    },
    // movedHole: function(){
    //   this._holePosition = null;
    // },
    plugSetActive: function(){
      this.$(".plug").draggable("enable");
      this.$(".plug").addClass("active");
      this.isConnected = true;
    },
    plugCheckActive: function(){
      var isConnected = this.model.parentNode.parentGraph.edges.some(function(edge){
        return (edge.source === this.model);
      }, this);
      if (!isConnected) {
        this.$(".plug").draggable("disable");
        this.$(".plug").removeClass("active");
        this.isConnected = false;
      }
    }
  });

  Output.CollectionView = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Output.View
  }); 

}(Dataflow.module("output")) );
