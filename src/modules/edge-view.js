( function(Edge) {

  // Thanks bobince http://stackoverflow.com/a/3642265/592125
  var makeSVG = function(tag, attrs) {
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
  
  Edge.Views.Main = Backbone.View.extend({
    tagName: "div",
    className: "edge",
    positions: null,
    initialize: function() {
      this.positions = {
        from: null, 
        to: null
      };
      // Render on source/target view move
      if (this.model.source) {
        this.model.source.node.on("move", this.render, this);
      }
      if (this.model.target) {
        this.model.target.node.on("move", this.render, this);
      }
      // Set port plug active
      if (this.model.source) {
        this.model.source.view.plugSetActive();
      }
      if (this.model.target) {
        this.model.target.view.plugSetActive();
      }
      // Made SVG elements
      this.el = makeSVG("path", {
        // "filter": "url(#drop-shadow)"
      });
      this.$el = $(this.el);
      // Add el to SVG
      if (this.model.collection) {
        var self = this;
        _.defer(function(){
          self.model.collection.graph.view.$('.svg-edges')[0].appendChild(self.el);
        }, this);
      }
    },
    render: function(previewPosition){
      if (this.model.source) {
        this.positions.from = this.model.source.view.holePosition();
      }
      else {
        // Preview 
        this.positions.from = previewPosition;
      }
      if (this.model.target) {
        this.positions.to = this.model.target.view.holePosition();
      } else {
        // Preview
        this.positions.to = previewPosition;
      }
      this.el.setAttribute("d", this.edgePath(this.positions));
      // Bounding box
      if (this.model.collection) {
        this.model.collection.view.sizeSvg();
      }
    },
    edgePath: function(positions){
      return "M " + positions.from.left + " " + positions.from.top + 
        " L " + (positions.from.left+40) + " " + positions.from.top +
        " L " + (positions.to.left-40) + " " + positions.to.top +
        " L " + positions.to.left + " " + positions.to.top;
    },
    remove: function(){
      // Remove listeners
      if (this.model.source) {
        this.model.source.node.off("move", this.render, this);
      }
      if (this.model.target) {
        this.model.target.node.off("move", this.render, this);
      }
      // Check if port plug is still active
      if (this.model.source) {
        this.model.source.view.plugCheckActive();
      }
      if (this.model.target) {
        this.model.target.view.plugCheckActive();
      }
      // Remove element
      this.$el.remove();
    }
  });

  Edge.Views.Collection = Backbone.CollectionView.extend({
    itemView: Edge.Views.Main,
    sizeSvg: function(){
      // TODO timeout to not do this with many edge resizes at once
      try{
        var svg = this.collection.graph.view.$('.svg-edges')[0];
        var rect = svg.getBBox();
        svg.setAttribute("width", Math.round(rect.x+rect.width+50));
        svg.setAttribute("height", Math.round(rect.y+rect.height+50));
      } catch (error) {}
    }
  }); 

}(Dataflow.module("edge")) );
