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
      this.positions = {};
      // Render on source/target view move
      this.model.source.node.on("move", this.render, this);
      this.model.target.node.on("move", this.render, this);
      // Made SVG elements
      this.el = makeSVG("path", {
        // "filter": "url(#drop-shadow)"
      });
      this.$el = $(this.el);
    },
    render: function(){
      this.positions.from = this.model.source.view.holePosition();
      this.positions.to = this.model.target.view.holePosition();
      this.el.setAttribute("d", this.edgePath(this.positions));
      // Bounding box
      this.model.collection.view.sizeSvg();
    },
    edgePath: function(positions){
      return "M " + positions.from.left + " " + positions.from.top + 
        " L " + (positions.from.left+40) + " " + positions.from.top +
        " L " + (positions.to.left-40) + " " + positions.to.top +
        " L " + positions.to.left + " " + positions.to.top;
    },
    remove: function(){
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
