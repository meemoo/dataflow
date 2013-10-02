( function(Dataflow) {

  var Edge = Dataflow.prototype.module("edge");

  Edge.Model = Backbone.Model.extend({
    defaults: {
      "z": 0,
      "route": 0,
      "selected": false,
      "log": null
    },
    initialize: function() {
      var nodes, sourceNode, targetNode;
      var preview = this.get("preview");
      this.parentGraph = this.get("parentGraph");
      this.attributes.log = new CircularBuffer(50);
      if (preview) {
        // Preview edge
        nodes = this.get("parentGraph").nodes;
        var source = this.get("source");
        var target = this.get("target");
        if (source) {
          sourceNode = nodes.get( this.get("source").node );
          this.source = sourceNode.outputs.get( this.get("source").port );
        } else if (target) {
          targetNode = nodes.get( this.get("target").node );
          this.target = targetNode.inputs.get( this.get("target").port );
        }
      } else {
        // Real edge
        // this.parentGraph = this.get("parentGraph");
        nodes = this.parentGraph.nodes;
        try{
          sourceNode = nodes.get( this.get("source").node );
          this.source = sourceNode.outputs.get( this.get("source").port );
          targetNode = nodes.get( this.get("target").node );
          this.target = targetNode.inputs.get( this.get("target").port );
        }catch(e){
          // Dataflow.log("node or port not found for edge", this);
        }

        this.source.connect(this);
        this.target.connect(this);

        // Set up listener
        sourceNode.on("send:"+this.source.id, this.send, this);

        this.bringToTop();

        // Selection event
        this.on("select", this.select, this);
      }
    },
    select: function() {
      this.parentGraph.trigger("select:edge", this);
    },
    send: function (value) {
      this.target.parentNode.recieve( this.target.id, value );
    },
    isConnectedToPort: function(port) {
      return ( this.source === port || this.target === port );
    },
    isConnectedToNode: function(node) {
      return ( this.source.parentNode === node || this.target.parentNode === node );
    },
    toString: function(){
      if (this.id) {
        return this.id;
      }
      return this.get("source").node+":"+this.get("source").port+"::"+this.get("target").node+":"+this.get("target").port;
    },
    toJSON: function(){
      return {
        source: this.get("source"),
        target: this.get("target"),
        route: this.get("route")
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
    },
    remove: function(){
      this.source.disconnect(this);
      this.target.disconnect(this);
      if (this.collection) {
        this.collection.remove(this);
      }
      // Remove listener
      this.source.parentNode.off("send:"+this.source.id, this.send, this);
      this.trigger('remove');
    }
  });

  Edge.Collection = Backbone.Collection.extend({
    model: Edge.Model,
    comparator: function(edge) {
      // Sort edges by z order (z set by clicking; not saved to JSON)
      return edge.get("z");
    }
  });

}(Dataflow) );
