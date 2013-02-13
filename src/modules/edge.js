( function(Edge) {
 
  // Dependencies

  Edge.Model = Backbone.Model.extend({
    defaults: {
      "z": 0
    },
    initialize: function() {
      var nodes;
      var preview = this.get("preview");
      if (preview) {
        // Preview edge
        nodes = this.get("parentGraph").nodes;
        var source = this.get("source");
        var target = this.get("target");
        if (source) {
          this.source = nodes.get(this.get("source").node).outputs.get(this.get("source").port);
        } else if (target) {
          this.target = nodes.get(this.get("target").node).inputs.get(this.get("target").port);
        }
      } else {
        // Real edge
        this.parentGraph = this.get("parentGraph");
        nodes = this.parentGraph.nodes;
        try{
          this.source = nodes.get(this.get("source").node).outputs.get(this.get("source").port);
          this.target = nodes.get(this.get("target").node).inputs.get(this.get("target").port);
        }catch(e){
          Dataflow.log("node or port not found for edge", this);
        }

        this.source.connect(this);
        this.target.connect(this);

        this.bringToTop();
      }
    },
    isConnectedToPort: function(port) {
      return ( this.source === port || this.target === port );
    },
    isConnectedToNode: function(node) {
      return ( this.source.parentNode === node || this.target.parentNode === node );
    },
    toString: function(){
      return this.get("source").node+":"+this.get("source").port+"→"+this.get("target").node+":"+this.get("target").port;
    },
    toJSON: function(){
      return {
        source: this.get("source"),
        target: this.get("target")
      };
    },
    bringToTop: function(){
      var topZ = 0;
      this.parentGraph.edges.each(function(edge){
        if (edge !== this) {
          var thisZ = edge.get("z");
          if (thisZ > topZ) {
            topZ = thisZ;
          }
          if (edge.view){
            edge.view.unhighlight();
          }
        }
      }, this);
      this.set("z", topZ+1);
      if (this.collection) {
        this.collection.sort();
      }
    },
    remove: function(){
      this.source.disconnect(this);
      this.target.disconnect(this);
      if (this.collection) {
        this.collection.remove(this);
      }
    }
  });

  Edge.Collection = Backbone.Collection.extend({
    model: Edge.Model,
    comparator: function(edge) {
      // Sort edges by z order (z set by clicking; not saved to JSON)
      return edge.get("z");
    }
  });

}(Dataflow.module("edge")) );
