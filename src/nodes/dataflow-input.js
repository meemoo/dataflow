( function(Dataflow) {
 
  // Dependencies
  var Base = Dataflow.prototype.node("base");
  var DataflowInput = Dataflow.prototype.node("dataflow-input");

  DataflowInput.description = 'Simple input component';
  DataflowInput.Model = Base.Model.extend({
    defaults: function () {
      var defaults = Base.Model.prototype.defaults.call(this);
      defaults.type = "dataflow-input";
      defaults["input-type"] = "all";
      return defaults;
    },
    initialize: function(options) {
      if (this.get("label")===""){
        this.set({label:"input"+this.id});
      }
      // super
      Base.Model.prototype.initialize.call(this, options);
    },
    toJSON: function(){
      var json = Base.Model.prototype.toJSON.call(this);
      json["input-type"] = this.get("input-type");
      return json;
    },
    inputs:[
      // {
      //   id: "data",
      //   type: "all"
      // },
    ],
    outputs:[
      {
        id: "data",
        type: "all"
      }
    ]
  });

  // DataflowInput.View = Base.View.extend({
  // });

}(Dataflow) );
