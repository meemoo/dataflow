(function (Dataflow) {
  var Search = Dataflow.prototype.plugin("search");

  var SearchResult = Backbone.Model.extend({
    defaults: {
      source: '',
      icon: '',
      action: null,
      label: '',
      description: ''
    }
  });

  var SearchResults = Backbone.Collection.extend({
    model: SearchResult,
    initialize: function (models, options) {
      if (!options) {
        options = {};
      }
      this.search = options.search;
    }
  });

  var ResultView = Backbone.View.extend({
    tagName: 'li',
    template: '<i class="icon-<%- icon %>"></i><span class="name"><%- label %></span><span class="description"><%- description %></span>',
    events: {
      'click': 'clicked'
    },
    render: function () {
      this.$el.html(_.template(this.template, this.model.toJSON()));
    },
    clicked: function () {
      if (!this.model.get('action')) {
        return;
      }
      this.model.get('action')();
    }
  });

  Search.initialize = function (dataflow) {
    var $search = $('<div class="dataflow-plugin-search"><input type="search" results="5" /></div>');
    var $input = $search.find('input');
    dataflow.$el.prepend($search);

    $input.on('keyup', function (event) {
      if (!$input.val()) {
        return;
      }
      Search.search($input.val(), dataflow);
    });
  };

  Search.search = function (text, dataflow) {
    var Card = Dataflow.prototype.module('card');
    var results = new SearchResults([], {
      search: text
    });
    var ResultsView = new Backbone.CollectionView({
      tagName: 'ul',
      className: 'dataflow-plugin-search-results',
      collection: results
    });
    ResultsView.itemView = ResultView;
    var ResultsCard = new Card.Model({
      dataflow: dataflow,
      card: ResultsView,
      pinned: false
    });
    results.on('add', function () {
      dataflow.addCard(ResultsCard);
    });

    Search.results = results;

    for (name in dataflow.plugins) {
      if (!dataflow.plugins[name].onSearch) {
        continue;
      }
      Search.searchPlugin(results, text, dataflow.plugins[name]);
    }
  };

  Search.searchPlugin = function (results, text, plugin) {
    plugin.onSearch(text, function (pluginResults) {
      if (text !== Search.results.search) {
        // Search has changed, ignore results
        return;
      }

      pluginResults.forEach(function (result) {
        results.add(result);
      });
    });
  };

}(Dataflow));
