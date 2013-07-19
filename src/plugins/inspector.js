( function(Dataflow) {
 
  var Inspector = Dataflow.prototype.plugin("inspector");

  Inspector.initialize = function(dataflow){

    var $inspector = $(
      '<div class="dataflow-plugin-inspector">'+
        'hoi'+
      '</div>'
    );

    // dataflow.addPlugin({
    //   id: "inspector", 
    //   name: "inspector",
    //   menu: $inspector, 
    //   icon: "info-sign"
    // });

    var $menu = $("<div>")
      .addClass("menuitem menuitem-inspector")
      .append($inspector);
    dataflow.$(".menu").append( $menu );

    var lastSelected = null;

    function showInspector(){
      dataflow.showMenu("inspector");
      updateInspector();
    }

    function updateInspector(){
      if (lastSelected) {
        $menu.empty();
        lastSelected.inputs.each(function(input){
          if (input.view && input.view.$input) {
            $menu.append(input.view.$input);
          }
        });
      }
    }

    dataflow.addContext({
      id: "inspector",
      icon: "info-sign",
      label: "inspect",
      action: showInspector,
      contexts: ["one", "twoplus"]
    });

    Inspector.listeners = function(boo){
      if (boo) {
        // Selection changes
        dataflow.on("select:node", function(graph, node){
          lastSelected = node;
          if ($menu.is(':visible')) {
            updateInspector();
          }
        });
        dataflow.on("select:edge", function(graph, edge){
        });
      } else {
        // Custom
        dataflow.off("select:node");
        dataflow.off("select:edge");
      }
    };
    Inspector.listeners(true);

  };

}(Dataflow) );
