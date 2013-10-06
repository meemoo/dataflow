( function(Dataflow) {

  var Library = Dataflow.prototype.plugin("library");

  Library.initialize = function(dataflow){

    var $container = $('<div class="dataflow-plugin-overflow">');
    var $library = $('<ul class="dataflow-plugin-library" />');
    $container.append($library);

    Library.excluded = ["base", "base-resizable"];

    var addNode = function(node, x, y) {
      return function(){
        // Deselect others
        dataflow.currentGraph.view.$(".dataflow-node").removeClass("ui-selected");

        // Current zoom
        zoom = dataflow.currentGraph.get('zoom');

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

    var itemTemplate = '<li><a class="button add"><i class="icon-<%- icon %>"></i></a><span class="name"><%- name %></span><span class="description"><%-description %></span></li>';

    var addLibraryItem = function(name, node) {
      var $item = $(_.template(itemTemplate, {
        name: name,
        description: node.description,
        icon: node.icon ? node.icon : 'sign-blank'
      }));
      var addButton = $('.button', $item)
        .attr("title", "click or drag")
        .draggable({
          helper: function(){
            var helper = $('<div class="dataflow-node helper"><div class="dataflow-node-title">'+name+'</div></div>');
            dataflow.$el.append(helper);
            return helper;
          },
          stop: function(event, ui) {
            addNode(node, ui.position.left, ui.position.top).call();
          }
        })
        .click(addNode(node));
      $library.append($item);
    };

    var update = function(options){
      options = options ? options : {};
      Library.excluded = options.exclude ? options.exclude : Library.excluded;

      $library.empty();
      var sortedLibrary = _.sortBy(Object.keys(dataflow.nodes), function (name) {
        return name;
      });
      _.each(sortedLibrary, function (name) {
        if (Library.excluded.indexOf(name) !== -1) {
          return;
        }
        addLibraryItem(name, dataflow.nodes[name]);
      });
    };
    update();

    dataflow.addPlugin({
      id: "library", 
      label: "library",
      name: "", 
      menu: $container, 
      icon: "plus",
      pinned: false
    });

    Library.update = update;

    Library.onSearch = function (text, callback) {
      var results = [];
      _.each(dataflow.nodes, function (node, name) {
        if (Library.excluded.indexOf(name) !== -1) {
          return;
        }
        if (name.toLowerCase().indexOf(text.toLowerCase()) === -1) {
          return;
        }
        results.push({
          source: 'library',
          icon: 'plus',
          action: function () {
            addNode(node).call();
          },
          label: name,
          description: node.description
        });
      });
      callback(results);
    };

    dataflow.plugin('search').addCommand({
      names: ['add', 'a', 'add component', 'add node'],
      args: ['component'],
      preview: function (text, callback) {
        var results = [];
        _.each(dataflow.nodes, function (node, name) {
          if (Library.excluded.indexOf(name) !== -1) {
            return;
          }
          if (name.toLowerCase().indexOf(text.toLowerCase()) === -1) {
            return;
          }
          results.push({
            icon: 'plus',
            label: name,
            description: node.description,
            item: node
          });
        });
        callback(results);
      },
      execute: function (item) {
        addNode(item).call();
      }
    });
  };

}(Dataflow) );
