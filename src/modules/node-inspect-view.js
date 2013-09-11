( function(Dataflow) {

  var Node = Dataflow.prototype.module("node");

  var template = 
    '<div class="dataflow-plugin-inspector-title">'+
      '<h1 class="dataflow-node-inspector-label" title="click to edit"><%- label %></h1>'+
      '<h2 class="dataflow-node-inspector-type"><%- type %></h2>'+
    '</div>'+
    // '<div class="dataflow-node-inspector-controls">'+
    //   '<button class="dataflow-node-delete">delete</button>'+
    // '</div>'+
    '<div class="dataflow-node-inspector-inputs"></div>';

  var makeEditable = function ($el, model, attribute) {
    $el[0].contentEditable = true;
    var initial = $el.text();
    var apply = function(){
      model.set(attribute, $el.text());
    };
    var revert = function(){
      $el.text(initial);
    };
    $el
      .focus(function(event){
        initial = $el.text();
      })
      .blur(function(event){
        apply();
      })
      .keydown(function(event){
        if (event.which === 27) {
          // ESC
          revert();
          $el.blur();
        } else if (event.which === 13) {
          // Enter
          $el.blur();
        }
      });
  };

  Node.InspectView = Backbone.View.extend({
    template: _.template(template),
    className: "dataflow-node-inspector",
    events: {
    },
    initialize: function(options) {
      this.$el.html(this.template(this.model.toJSON()));
      // Make input list
      var $inputs = this.$el.children(".dataflow-node-inspector-inputs");
      this.model.inputs.each(function(input){
        if (input.view && input.view.$input) {
          $inputs.append( input.view.$input );
        }
      }, this);

      makeEditable(this.$(".dataflow-node-inspector-label"), this.model, "label");
    },
    render: function() {
      return this;
    },
    removeModel: function(){
      this.model.remove();
    }
  });

}(Dataflow) );
