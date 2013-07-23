( function(Dataflow) {
 
  var Inspector = Dataflow.prototype.plugin("inspector");

  Inspector.initialize = function(dataflow){

    var $inspector = $(
      '<div class="dataflow-plugin-inspector"></div>'
    );

    // Doing this manually instead of dataflow.addPlugin()
    var $menu = $("<div>")
      .addClass("dataflow-menuitem dataflow-menuitem-inspector")
      .append($inspector);
    dataflow.$(".dataflow-menu").append($menu);

    var lastSelected = null;

    function updateInspector(){
      if (lastSelected) {
        if (lastSelected.view) {
          $inspector.children().detach();
          $inspector.append( lastSelected.view.getInputList() );
          
          lastSelected.view.highlightEdges();
        }
      }
    }
    // Inspector.updateInspector = updateInspector;

    function showInspector(){
      dataflow.showMenu("inspector");
      updateInspector();
    }

    dataflow.addContext({
      id: "inspector",
      icon: "info-sign",
      label: "inspect",
      action: showInspector,
      contexts: ["one", "twoplus"]
    });

    function selectNode (graph, node) {
      if (lastSelected !== node) {
        lastSelected = node;
        if ($menu.is(':visible')){
          updateInspector();
        }
      }
    }

    Inspector.listeners = function(boo){
      if (boo) {
        // Selection changes
        dataflow.on("select:node", selectNode);
        // dataflow.on("select:edge", function(graph, edge){
        // });
      } else {
        // Custom
        dataflow.off("select:node", selectNode);
        // dataflow.off("select:edge");
      }
    };
    Inspector.listeners(true);

  };

}(Dataflow) );
