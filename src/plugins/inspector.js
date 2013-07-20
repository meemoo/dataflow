( function(Dataflow) {
 
  var Inspector = Dataflow.prototype.plugin("inspector");

  Inspector.initialize = function(dataflow){

    var $inspector = $(
      '<div class="dataflow-plugin-inspector"></div>'
    );

    // Doing this manually instead of dataflow.addPlugin()
    var $menu = $("<div>")
      .addClass("menuitem menuitem-inspector")
      .append($inspector);
    dataflow.$(".menu").append($menu);

    var lastSelected = null;

    function showInspector(){
      dataflow.showMenu("inspector");
      updateInspector();
    }

    function updateInspector(){
      if (lastSelected) {
        if (lastSelected.view) {
          $inspector.children().detach();
          $inspector.append( lastSelected.view.getInputList() );
        }
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
          if ($menu.is(':visible')){
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
