( function(Dataflow) {

  var Library = Dataflow.prototype.plugin("library");

  Library.initialize = function(dataflow){
 
    var library = $('<ul class="dataflow-plugin-library" style="list-style:none; padding:0; margin:15px 0;" />');

    var addNode = function(node, x, y) {
      return function(){
        // Deselect others
        dataflow.currentGraph.view.$(".node").removeClass("ui-selected");

        // Current zoom
        zoom = dataflow.get('state').get('zoom');

        // Find vacant id
        var id = 1;
        while (dataflow.currentGraph.nodes.get(id)){
          id++;
        }
        // Position
        x = x===undefined ? 200 : x;
        y = y===undefined ? 200 : y;
        x = x/zoom - dataflow.currentGraph.get("panX");
        y = y/zoom - dataflow.currentGraph.get("panY");

        // Add node
        var newNode = new node.Model({
          id: id,
          x: x,
          y: y,
          parentGraph: dataflow.currentGraph
        });
        dataflow.currentGraph.nodes.add(newNode);
        // Select and bring to top
        newNode.view.select();
      };
    };

    var addElement = function (info) {

    };

    var addLibraryItem = function(node, name) {
      var addButton = $('<a class="button">+</a>')
        .attr("title", "click or drag")
        .draggable({
          helper: function(){
            var helper = $('<div class="node helper" style="width:100px; height:100px">'+name+'</div>');
            dataflow.$el.append(helper);
            return helper;
          },
          stop: function(event, ui) {
            addNode(node, ui.position.left, ui.position.top).call();
          }
        })
        .click(addNode(node));
      var item = $("<li />")
        .append(addButton)
        .append(name);
      library.append(item);
    };

    var update = function(options){
      options = options ? options : {};
      options.exclude = options.exclude ? options.exclude : ["base", "base-resizable"];

      library.empty();
      _.each(dataflow.nodes, function(node, index){
        if (options.exclude.indexOf(index) === -1) {
          addLibraryItem(node, index);
        }
      });
    };
    update();

    dataflow.addPlugin({
      id: "library", 
      name: "", 
      menu: library, 
      icon: "plus"
    });

    Library.update = update;

  };

}(Dataflow) );
