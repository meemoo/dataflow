( function(Input) {

  var Edge = Dataflow.module("edge");

  var template = 
    '<span class="plug in" title="drag to edit wire"></span>'+ //i18n
    '<span class="hole in" title="drag to make new wire"></span>'+ //i18n
    '<span class="label in"><%= id %></span>';
 
  Input.Views.Main = Backbone.View.extend({
    template: _.template(template),
    tagName: "li",
    className: "port in",
    events: {
      "dragstart .hole":  "newEdgeStart",
      "drag      .hole":  "newEdgeDrag",
      "dragstop  .hole":  "newEdgeStop",
      "dragstart .plug":  "changeEdgeStart",
      "drag      .plug":  "changeEdgeDrag",
      "dragstop  .plug":  "changeEdgeStop",
      "drop":             "connectEdge"
    },
    initialize: function() {
      this.$el.html(this.template(this.model.toJSON()));
      this.$el.addClass(this.model.get("type"));
      var self = this;
      this.$(".plug").draggable({
        helper: function(){
          return self.dragHelper();
        },
        disabled: true
      });
      this.$(".hole").draggable({
        helper: function(){
          return self.dragHelper();
        }
      });
      this.$el.droppable({
        accept: ".plug.out, .hole.out",
        activeClassType: "droppable-hover"
      });
    },
    dragHelper: function(){
      return $('<span class="plug out helper" />')
        .data({port: this.model});
    },
    render: function(){
    },
    newEdgeStart: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdge = new Edge.Model({
        target: {
          node: this.model.node.id,
          port: this.model.id
        },
        graph: this.model.node.graph,
        preview: true
      });
      this.previewEdgeView = new Edge.Views.Main({
        model: this.previewEdge
      });
      var graphSVGElement = this.model.node.graph.view.$('.svg-edges')[0];
      graphSVGElement.appendChild(this.previewEdgeView.el);
    },
    newEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
      this.previewEdgeView.render(ui.offset);
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
    },
    changeEdgeDrag: function(event, ui){
      // Don't drag node
      event.stopPropagation();
    },
    changeEdgeStop: function(event, ui){
      // Don't drag node
      event.stopPropagation();
    },
    connectEdge: function(event, ui) {
      // Dropped to this el
      var otherPort = ui.helper.data("port");
      this.model.node.graph.edges.add({
        id: otherPort.node.id+":"+otherPort.id+"->"+this.model.node.id+":"+this.model.id,
        graph: this.model.node.graph,
        source: {
          node: otherPort.node.id,
          port: otherPort.id
        },
        target: {
          node: this.model.node.id,
          port: this.model.id
        }
      });
    },
    holePosition: function(){
      return this.$(".hole").offset();
    },
    plugSetActive: function(){
      this.$(".plug").draggable("enable");
      this.$(".plug").addClass("active");
    },
    plugCheckActive: function(){
      var isConnected = this.model.node.graph.edges.some(function(edge){
        var port = edge.get("target");
        return (port.node === this.model.node.id && port.port === this.model.id);
      }, this);
      if (!isConnected) {
        this.$(".plug").draggable("disable");
        this.$(".plug").removeClass("active");
      }
    }
  });

  Input.Views.Collection = Backbone.CollectionView.extend({
    tagName: "ul",
    itemView: Input.Views.Main
  }); 

}(Dataflow.module("input")) );
