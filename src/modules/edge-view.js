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
      // Made SVG elements
      this.el = makeSVG("path", {});
      this.model.source.node.on("move", this.render, this);
      this.model.target.node.on("move", this.render, this);
    },
    render: function(){
      this.positions = {};
      this.positions.from = this.model.source.view.holePosition();
      this.positions.to = this.model.target.view.holePosition();
      var d = "M " + this.positions.from.left + " " + this.positions.from.top + " L " + this.positions.to.left + " " + this.positions.to.top;
      this.el.setAttribute("d", d);
    }
  });

  Edge.Views.Collection = Backbone.CollectionView.extend({
    itemView: Edge.Views.Main
  }); 

}(Dataflow.module("edge")) );
