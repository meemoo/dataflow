/*! backbone.collectionview - v0.1.1 - 2012-09-14
* https://github.com/anthonyshort/backbone.collectionview
* Copyright (c) 2012 Anthony Short; Licensed MIT */

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Backbone.CollectionView = (function(_super) {

    __extends(CollectionView, _super);

    CollectionView.extend = Backbone.Model.extend;

    CollectionView.prototype.itemView = null;

    CollectionView.prototype.emptyClass = 'is-empty';

    CollectionView.prototype.loadingClass = 'is-loading';

    CollectionView.prototype.itemSelector = null;

    CollectionView.prototype.listSelector = null;

    CollectionView.prototype.list = null;

    CollectionView.prototype.viewsByCid = null;

    function CollectionView(options) {
      if (options == null) {
        options = {};
      }
      this.onReset = __bind(this.onReset, this);

      this.onRemove = __bind(this.onRemove, this);

      this.onAdd = __bind(this.onAdd, this);

      this.onReady = __bind(this.onReady, this);

      this.onLoad = __bind(this.onLoad, this);

      CollectionView.__super__.constructor.apply(this, arguments);
      if (!options.collection) {
        throw "Backbone.CollectionView requires a collection";
      }
      _(options).defaults({
        render: false,
        renderItems: false
      });
      this.viewsByCid = {};
      this.collectionEvents || (this.collectionEvents = {});
      this.addCollectionListeners(options.collection);
      this.viewEvents || (this.viewEvents = {});
      this.itemView = options.itemView || this.itemView;
      if (options.render) {
        this.render();
      }
      if (options.renderItems) {
        this.renderAllItems();
      }
    }

    CollectionView.prototype.addCollectionListeners = function(collection) {
      var handler, name, _ref;
      collection.on('add', this.onAdd, this);
      collection.on('remove', this.onRemove, this);
      collection.on('reset', this.onReset, this);
      collection.on('loading', this.onLoad, this);
      collection.on('ready', this.onReady, this);
      _ref = this.collectionEvents;
      for (name in _ref) {
        handler = _ref[name];
        collection.on(name, this[handler], this);
      }
      return collection;
    };

    CollectionView.prototype.addViewListeners = function(view) {
      var handler, name, _ref;
      _ref = this.viewEvents;
      for (name in _ref) {
        handler = _ref[name];
        view.on(name, this[handler], this);
      }
      return view;
    };

    CollectionView.prototype.onLoad = function() {
      return this.$el.addClass(this.loadingClass);
    };

    CollectionView.prototype.onReady = function() {
      this.$el.removeClass(this.loadingClass);
      return this.initFallback();
    };

    CollectionView.prototype.onAdd = function(model) {
      return this.addModelView(model);
    };

    CollectionView.prototype.onRemove = function(model) {
      return this.removeModelView(model);
    };

    CollectionView.prototype.onReset = function() {
      return this.renderAllItems();
    };

    CollectionView.prototype.add = function(data, options) {
      var model;
      if (data == null) {
        data = {};
      }
      if (options == null) {
        options = {};
      }
      model = new this.collection.model(data);
      this.collection.add(model, options);
      return this.getViewByModel(model);
    };

    CollectionView.prototype.render = function() {
      CollectionView.__super__.render.apply(this, arguments);
      this.list = this.listSelector ? this.$(this.listSelector) : this.$el;
      return this.initFallback();
    };

    CollectionView.prototype.initFallback = function() {
      if (this.collection.length === 0) {
        return this.$el.addClass(this.emptyClass);
      } else {
        return this.$el.removeClass(this.emptyClass);
      }
    };

    CollectionView.prototype.renderAllItems = function() {
      var _this = this;
      this.render();
      this.clear();
      return this.collection.each(function(model) {
        return _this.addModelView(model);
      });
    };

    CollectionView.prototype.clear = function() {
      var cid, model, view, _ref, _results;
      this.list.empty();
      _ref = this.viewsByCid;
      _results = [];
      for (cid in _ref) {
        if (!__hasProp.call(_ref, cid)) continue;
        view = _ref[cid];
        model = this.collection.get(cid);
        if (model) {
          _results.push(this.removeModelView(model));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    CollectionView.prototype.getItemView = function(model) {
      if (!this.itemView) {
        throw 'Backbone.CollectionView needs an itemView property set. Alternatively override the getItemView method';
      }
      return new this.itemView({
        model: model,
        collection: this.collection
      });
    };

    CollectionView.prototype.addModelView = function(model) {
      var view;
      view = this.getItemView(model);
      this.addViewListeners(view);
      view.render();
      this.viewsByCid[model.cid] = view;
      this.initFallback();
      this.renderItem(view, model);
      return view;
    };

    CollectionView.prototype.getViewByModel = function(model) {
      return this.viewsByCid[model.cid];
    };

    CollectionView.prototype.removeModelView = function(model) {
      var view;
      view = this.viewsByCid[model.cid];
      if (!view) {
        return;
      }
      view.remove();
      delete this.viewsByCid[model.cid];
      return this.initFallback();
    };

    CollectionView.prototype.renderItem = function(view, model) {
      var children, position;
      children = this.list.children(this.itemSelector);
      position = this.collection.indexOf(model);
      if (position === 0) {
        this.list.prepend(view.$el);
      } else if (position < children.length) {
        children.eq(position).before(view.$el);
      } else {
        this.list.append(view.$el);
      }
      return this.afterRenderItem(view, model);
    };

    CollectionView.prototype.afterRenderItem = function(view, model) {};

    CollectionView.prototype.dispose = function() {
      var prop, _i, _len, _ref, _results;
      CollectionView.__super__.dispose.apply(this, arguments);
      _ref = ['list', 'viewsByCid', 'collection'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        prop = _ref[_i];
        _results.push(delete this[prop]);
      }
      return _results;
    };

    return CollectionView;

  })(Backbone.View);

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Backbone.CollectionView;
  }

}).call(this);
