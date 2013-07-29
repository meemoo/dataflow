( function(Dataflow) {

  // Load after other plugins
  // TODO: track which widget has focus if multiple in page
 
  var KeyBinding = Dataflow.prototype.plugin("keybinding");
  var Edit = Dataflow.prototype.plugin("edit");

  KeyBinding.initialize = function(dataflow){

    function zoomIn() {
      if (dataflow && dataflow.currentGraph && dataflow.currentGraph.view) {
        dataflow.currentGraph.view.zoomIn();
      }
    }

    function zoomOut() {
      if (dataflow && dataflow.currentGraph && dataflow.currentGraph.view) {
        dataflow.currentGraph.view.zoomOut();
      }
    }

    function zoomCenter() {
      if (dataflow && dataflow.currentGraph && dataflow.currentGraph.view) {
        dataflow.currentGraph.view.zoomCenter();
      }
    }

    function keyDown(event) {
      if (event.ctrlKey || event.metaKey) {
        switch (event.which) {
          case 189: // -
            event.preventDefault();
            zoomIn();
            break;
          case 187: // =
            event.preventDefault();
            zoomOut();
            break;
          case 48:
            event.preventDefault();
            zoomCenter();
            break;
          case 65: // a
            Edit.selectAll();
            break;
          case 88: // x
            Edit.cut();
            break;
          case 67: // c
            Edit.copy();
            break;
          case 86: // v
            Edit.paste();
            break;
          case 90: // z
            break;
          default:
            break;
        }
      }
    }

    KeyBinding.listeners = function(boo){
      if (boo) {
        $(document).on('keydown', keyDown);
      } else {
        $(document).off('keydown', keyDown);
      }
    };
    KeyBinding.listeners(true);

  };

}(Dataflow) );
