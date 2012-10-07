(function(Graph) {
 
  var template = 
    '<div class="edges"><svg class="svg-edges" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" style="width:1000px; height:1000px;"></svg></div>'+
    '<div class="nodes" />';

  // Dependencies
  var Node = Dataflow.module("node");
  var Edge = Dataflow.module("edge");

  Graph.Views.Main = Backbone.View.extend({
    template: _.template(template),
    className: "graph",
    initialize: function() {
      var nodes = this.model.get("nodes");
      var edges = this.model.get("edges");

      // Initialize nodes
      nodes.view = new Node.Views.Collection({
        collection: nodes
      });
      // Initialize edges
      edges.view = new Edge.Views.Collection({
        collection: edges
      });
    },
    render: function() {
      // Graph container
      this.$el.html(this.template(this.model.toJSON()));

      // Render nodes
      var nodes = this.model.get("nodes");
      nodes.view.render();
      nodes.view.renderAllItems();
      this.$(".nodes").html(nodes.view.el);
      // Render edges
      var edges = this.model.get("edges");
      edges.view.render();
      edges.view.renderAllItems();

      // Do this without jQuery because SVG
      var graphSVGElement = this.$('.svg-edges')[0];
      _.each(edges.view.viewsByCid, function(edgeView){
        graphSVGElement.appendChild(edgeView.el);
      }, this);

      return this;
    }
  });

}(Dataflow.module("graph")) );
