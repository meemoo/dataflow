( function(Dataflow) {

  var Input = Dataflow.prototype.module("input");
 
  Input.Model = Backbone.Model.extend({
    defaults: {
      id: "input",
      label: "",
      type: "all",
      description: ""
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
      if (this.get("label")===""){
        this.set({label: this.id});
      }
      this.connected = [];
    },
    connect: function(edge){
      var unique = true;
      for (var i=0; i<this.connected.length; i++){
        if (this.connected[i].id === edge.id){
          unique = false;
        }
      }
      if (unique){
        this.connected.push(edge);
      }
    },
    disconnect: function(edge){
      this.connected = _.without(this.connected, edge);
    },
    remove: function(){
      // Port removed from node's inputs collection
      // Remove related edges
      while (this.connected.length > 0) {
        this.connected[0].remove();
      }
    }

  });

  Input.Collection = Backbone.Collection.extend({
    model: Input.Model
  });

}(Dataflow) );
