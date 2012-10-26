( function(Input) {
 
  Input.Model = Backbone.Model.extend({
    defaults: {
      id: "input",
      label: "",
      type: "all"
    },
    initialize: function() {
      this.parentNode = this.get("parentNode");
      if (this.get("label")===""){
        this.set({label: this.id});
      }
    }
  });

  Input.Collection = Backbone.Collection.extend({
    model: Input.Model
  });

}(Dataflow.module("input")) );
