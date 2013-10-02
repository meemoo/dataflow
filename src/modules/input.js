( function(Dataflow) {

  var Input = Dataflow.prototype.module("input");
 
  Input.Model = Backbone.Model.extend({
    defaults: {
      id: "input",
      description: "",
      label: "",
      type: "all",
      multiple: true
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
      if (this.get("label")===""){
        this.set({label: this.id});
      }
      this.connected = [];
    },
    canConnect: function (edge) {
      if (!this.get('multiple') && this.connected.length) {
        // This port doesn't allow multiple connections and
        // there is a connection already, decline
        return false;
      }
      return true;
    },
    connect: function(edge){
      if (!this.canConnect(edge)) {
        return;
      }
      this.connected.push(edge);
      this.connected = _.uniq(this.connected);
      this.trigger('connected');
    },
    disconnect: function(edge){
      this.connected = _.without(this.connected, edge);
      if (this.connected.length === 0) {
        this.trigger('disconnected');
      }
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
