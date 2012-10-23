( function(Edge) {
 
  // Dependencies

  Edge.Model = Backbone.Model.extend({
    initialize: function() {
      var nodes;
      var preview = this.get("preview");
      if (preview) {
        // Preview edge
        nodes = this.get("graph").nodes;
        var source = this.get("source");
        var target = this.get("target");
        if (source) {
          this.source = nodes.get(this.get("source").node).outputs.get(this.get("source").port);
        } else if (target) {
          this.target = nodes.get(this.get("target").node).inputs.get(this.get("target").port);
        }
      } else {
        // Real edge
        this.graph = this.get("graph");
        nodes = this.graph.nodes;
        try{
          this.source = nodes.get(this.get("source").node).outputs.get(this.get("source").port);
          this.target = nodes.get(this.get("target").node).inputs.get(this.get("target").port);
        }catch(e){
          Dataflow.log("node or port not found for edge", this);
        }
      }
    },
    isConnectedToNode: function(node) {
      return ( this.source.node === node || this.target.node === node );
    },
    toString: function(){
      return this.get("source").node+":"+this.get("source").port+"→"+this.get("target").node+":"+this.get("target").port;
    },
    toJSON: function(){
      return {
        source: this.get("source"),
        target: this.get("target")
      };
    }
  });

  Edge.Collection = Backbone.Collection.extend({
    model: Edge.Model
  });

}(Dataflow.module("edge")) );
