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
      this.positions = {from:{}, to:{}};
      // Made SVG elements
      this.el = makeSVG("path", {});
    },
    render: function(){
      // this.positions.from = this.model.source.view.holePosition();
      // this.positions.to = this.model.target.view.holePosition();
    }
  });

  Edge.Views.Collection = Backbone.CollectionView.extend({
    itemView: Edge.Views.Main
  }); 

}(Dataflow.module("edge")) );
