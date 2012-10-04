(function(Graph) {
 
  var template = 
    '<div class="edges"><svg class="svg-edges"></svg></div>'+
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

      var nodes = this.model.get("nodes");
      nodes.view.render();
      nodes.view.renderAllItems();
      this.$(".nodes").html(this.model.get("nodes").view.el);
      var edges = this.model.get("edges");
      edges.view.render();
      edges.view.renderAllItems();
      // var graphSVGElement = this.$('.svg-edges')[0];
      // edges.each(function(edge){
      //   graphSVGElement.appendChild(edge.view.el);
      // });

      return this;
    }
  });

}(Dataflow.module("graph")) );
