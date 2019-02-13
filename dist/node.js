'use strict';

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _createReactClass = require('create-react-class');

var _createReactClass2 = _interopRequireDefault(_createReactClass);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Node = (0, _createReactClass2.default)({
  displayName: 'UITreeNode',

  renderCollapse: function renderCollapse() {
    var index = this.props.index;


    if (index.children && index.children.length || index.node && index.node.isParent === true) {
      var collapsed = index.node.collapsed;

      var cssClasses = (0, _classnames2.default)('nrby-tree-collapse', collapsed ? 'caret-right' : 'caret-down');
      return _react2.default.createElement('span', {
        className: cssClasses,
        onMouseDown: function onMouseDown(e) {
          e.stopPropagation();
        },
        onClick: this.handleCollapse });
    }

    return null;
  },
  renderChildren: function renderChildren() {
    var _props = this.props,
        index = _props.index,
        tree = _props.tree,
        dragging = _props.dragging,
        paddingLeft = _props.paddingLeft,
        onCollapse = _props.onCollapse,
        onDragStart = _props.onDragStart;


    if (index.children && index.children.length) {
      var childrenStyles = {};
      if (index.node.collapsed) childrenStyles.display = 'none';
      childrenStyles['paddingLeft'] = this.props.paddingLeft + 'px';

      return _react2.default.createElement(
        'div',
        { className: 'children', style: childrenStyles },
        index.children.map(function (child) {
          var childIndex = tree.getIndex(child);
          return _react2.default.createElement(Node, {
            tree: tree,
            index: childIndex,
            key: childIndex.id,
            dragging: dragging,
            paddingLeft: paddingLeft,
            onCollapse: onCollapse,
            onDragStart: onDragStart
          });
        })
      );
    }

    return null;
  },
  render: function render() {
    var _props2 = this.props,
        tree = _props2.tree,
        index = _props2.index,
        dragging = _props2.dragging;

    var cssClasses = (0, _classnames2.default)('m-node', { 'placeholder': index.id === dragging });

    return _react2.default.createElement(
      'div',
      { className: cssClasses },
      _react2.default.createElement(
        'div',
        { className: 'inner', ref: 'inner', onMouseDown: this.handleMouseDown },
        this.renderCollapse(),
        tree.renderNode(index, tree)
      ),
      this.renderChildren()
    );
  },
  handleCollapse: function handleCollapse(e) {
    e.stopPropagation();
    var _props3 = this.props,
        index = _props3.index,
        onCollapse = _props3.onCollapse;

    if (onCollapse) onCollapse(index.id);
  },
  handleMouseDown: function handleMouseDown(e) {
    var _props4 = this.props,
        index = _props4.index,
        onDragStart = _props4.onDragStart;
    // TODO: shouldn't be handling refs like this

    var dom = this.refs.inner;

    if (onDragStart && !window.dragMode) {
      onDragStart(index.id, dom, e);
    }
  }
});

module.exports = Node;