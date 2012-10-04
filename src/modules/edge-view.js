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
  }
 
  Edge.Views.Main = Backbone.View.extend({
    tagName: "div",
    className: "edge",
    positions: null,
    initialize: function() {
      this.positions = {fromX: 0, fromY: 0, toX: 0, toY: 0};
    },
    render: function(){
      // Made SVG elements
      this.el = makeSVG("path", {});
      var self = this;
      _.defer(function(){
        $('.svg-edges')[0].appendChild(self.el);
      })
      
      // Add to DOM      
      // this.el.appendChild(this.elementWire);
      // This is the only view that doesn't follow the Backbone convention, for the sake of the SVG
      // TODO make it graph-specific
      // var graphSVGElement = $('.svg-edges')[0];
      // graphSVGElement.appendChild(this.el);
    }
  });

  Edge.Views.Collection = Backbone.CollectionView.extend({
    itemView: Edge.Views.Main
  }); 

}(Dataflow.module("edge")) );
