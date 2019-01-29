'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createReactClass = require('create-react-class');

var _createReactClass2 = _interopRequireDefault(_createReactClass);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _tree = require('./tree');

var _tree2 = _interopRequireDefault(_tree);

var _node = require('./node');

var _node2 = _interopRequireDefault(_node);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = (0, _createReactClass2.default)({
  displayName: 'UITree',

  propTypes: {
    tree: _propTypes2.default.object.isRequired,
    paddingLeft: _propTypes2.default.number,
    renderNode: _propTypes2.default.func.isRequired
  },

  getDefaultProps: function getDefaultProps() {
    return {
      paddingLeft: 20
    };
  },
  getInitialState: function getInitialState() {
    return this.init(this.props);
  },
  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (!this._updated) this.setState(this.init(nextProps));else this._updated = false;
  },
  init: function init(props) {
    var tree = new _tree2.default(props.tree);
    tree.isNodeCollapsed = props.isNodeCollapsed;
    tree.renderNode = props.renderNode;
    tree.changeNodeCollapsed = props.changeNodeCollapsed;
    tree.updateNodesPosition();

    if (props.afterInitialize) props.afterInitialize(this);

    return {
      tree: tree,
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null
      }
    };
  },
  getDraggingDom: function getDraggingDom() {
    var _state = this.state,
        tree = _state.tree,
        dragging = _state.dragging;
    var paddingLeft = this.props.paddingLeft;


    if (dragging && dragging.id) {
      var draggingIndex = tree.getIndex(dragging.id);
      var draggingStyles = {
        top: dragging.y,
        left: dragging.x,
        width: dragging.w
      };

      return _react2.default.createElement(
        'div',
        { className: 'm-draggable', style: draggingStyles },
        _react2.default.createElement(_node2.default, {
          tree: tree,
          index: draggingIndex,
          paddingLeft: paddingLeft
        })
      );
    }

    return null;
  },
  render: function render() {
    var _state2 = this.state,
        tree = _state2.tree,
        dragging = _state2.dragging;
    var paddingLeft = this.props.paddingLeft;

    var draggingDom = this.getDraggingDom();

    return _react2.default.createElement(
      'div',
      { className: 'm-tree' },
      draggingDom,
      _react2.default.createElement(_node2.default, {
        tree: tree,
        index: tree.getIndex(1),
        key: 1,
        paddingLeft: paddingLeft,
        onDragStart: this.dragStart,
        onCollapse: this.toggleCollapse,
        dragging: dragging && dragging.id
      })
    );
  },
  dragStart: function dragStart(id, dom, e) {
    this.dragging = {
      id: id,
      w: dom.offsetWidth,
      h: dom.offsetHeight,
      x: dom.offsetLeft,
      y: dom.offsetTop
    };

    this._startX = dom.offsetLeft;
    this._startY = dom.offsetTop;
    this._offsetX = e.clientX;
    this._offsetY = e.clientY;
    this._start = true;

    this.oldIndex = this.state.tree.getIndex(id);

    window.addEventListener('mousemove', this.drag);
    window.addEventListener('mouseup', this.dragEnd);
  },


  // oh
  drag: function drag(e) {
    if (this._start) {
      this.setState({
        dragging: this.dragging
      });
      this._start = false;
    }

    var _state3 = this.state,
        tree = _state3.tree,
        dragging = _state3.dragging;
    var paddingLeft = this.props.paddingLeft;

    var newIndex = null;
    var index = tree.getIndex(dragging.id);
    var collapsed = index.node.collapsed;

    var _startX = this._startX;
    var _startY = this._startY;
    var _offsetX = this._offsetX;
    var _offsetY = this._offsetY;

    var pos = {
      x: _startX + e.clientX - _offsetX,
      y: _startY + e.clientY - _offsetY
    };
    dragging.x = pos.x;
    dragging.y = pos.y;

    var diffX = dragging.x - paddingLeft / 2 - (index.left - 2) * paddingLeft;
    var diffY = dragging.y - dragging.h / 2 - (index.top - 2) * dragging.h;

    if (diffX < 0) {
      // left
      if (index.parent && !index.next) {
        newIndex = tree.move(index.id, index.parent, 'after');
      }
    } else if (diffX > paddingLeft) {
      // right
      if (index.prev) {
        var prevNode = tree.getIndex(index.prev).node;
        if (!prevNode.collapsed && !prevNode.leaf) {
          newIndex = tree.move(index.id, index.prev, 'append');
        }
      }
    }

    if (newIndex) {
      index = newIndex;
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    if (diffY < 0) {
      // up
      var above = tree.getNodeByTop(index.top - 1);
      newIndex = tree.move(index.id, above.id, 'before');
    } else if (diffY > dragging.h) {
      // down
      if (index.next) {
        var below = tree.getIndex(index.next);
        if (below.children && below.children.length && !below.node.collapsed) {
          newIndex = tree.move(index.id, index.next, 'prepend');
        } else {
          newIndex = tree.move(index.id, index.next, 'after');
        }
      } else {
        var _below = tree.getNodeByTop(index.top + index.height);
        if (_below && _below.parent !== index.id) {
          if (_below.children && _below.children.length) {
            newIndex = tree.move(index.id, _below.id, 'prepend');
          } else {
            newIndex = tree.move(index.id, _below.id, 'after');
          }
        }
      }
    }

    if (newIndex) {
      newIndex.node.collapsed = collapsed;
      dragging.id = newIndex.id;
    }

    this.setState({ tree: tree, dragging: dragging });
  },
  dragEnd: function dragEnd() {
    var tree = this.state.tree;
    var onParentChange = this.props.onParentChange;

    var index = tree.getIndex(this.dragging.id);
    var oldIndex = this.oldIndex;
    var self = this;
    this.setState({
      dragging: {
        id: null,
        x: null,
        y: null,
        w: null,
        h: null
      }
    });

    this.change(tree);
    window.removeEventListener('mousemove', this.drag);
    window.removeEventListener('mouseup', this.dragEnd);

    if (oldIndex.parent != index.parent) {
      var node = index.node;
      var parentId = tree.getIndex(index.parent).node.id;

      // The parent node was changed and we should update the server
      if (onParentChange) {
        window.dragMode = true;
        onParentChange(node, parentId, function () {
          tree.resetPosition(index.id, oldIndex);
          self.setState({ tree: tree });
          window.dragMode = false;
        });
      }
    }
  },
  change: function change(tree) {
    this._updated = true;
    if (this.props.onChange) this.props.onChange(tree.obj);
  },
  toggleCollapse: function toggleCollapse(nodeId) {
    var tree = this.state.tree;
    var index = tree.getIndex(nodeId);
    var node = index.node;
    node.collapsed = !node.collapsed;
    tree.updateNodesPosition();

    this.setState({
      tree: tree
    });

    this.change(tree);
  },
  removeNode: function removeNode(indexId) {
    var tree = this.state.tree;

    tree.remove(indexId);

    this.setState({ tree: tree });
    this.change(tree);
  }
});