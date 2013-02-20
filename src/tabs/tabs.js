angular.module('ui.bootstrap.tabs', [])
.controller('TabsController', ['$scope', '$element', function($scope, $element) {
  var paneRecords = [];
  var panes = $scope.panes = [];

  this.select = $scope.select = function selectPane(pane) {
    angular.forEach(panes, function(pane) {
      pane.selected = false;
    });
    pane.selected = true;
  };

  this.sortPaneRecords = function sortPaneRecords() {
    var indexing = [];

    // for pane record return array of indexes for sorting
    // the function walks up the DOM from passed pane up to <tabs> element
    // and collects order index of element on each DOM level
    var computeIndexing = function computeIndexing(record) {
      if (!record.element) {
        return [];
      }
      var node = record.element.get(0);
      var res = [];
      var rawTabsRootElement = $element.get(0);
      while (node) {
        var index = Array.prototype.indexOf.call(node.parentNode.childNodes, node);
        res.push(index);
        node = node.parentNode;
        if (node==rawTabsRootElement) {
          break;
        }
      }
      return res.reverse(); // indices go in order from [tabs's 1st child, 2nd child, ..., pane]
    };

    // pre-compute indexing structure for each record
    angular.forEach(paneRecords, function(record) {
      record.indexing = computeIndexing(record);
    });

    // indexing structure gives us effectively global order index of an element in the DOM tree
    // this function orders records in the order of their appearance in the DOM (top-bottom)
    var byIndexing = function byIndexing(a, b) {
      var i = 0;
      a = a.indexing;
      b = b.indexing;
      while (true) {
        if (b[i]<a[i] || (b[i]===undefined && a[i]!==undefined)) {
          return true;
        }
        if (b[i]>a[i] || a[i]===undefined) {
          return false;
        }
        i++;
      }
      return false;
    };

    paneRecords.sort(byIndexing);
  };

  this.updatePanes = function updatePanes() {
    panes.splice(0, panes.length);
    angular.forEach(paneRecords, function(record) {
      panes.push(record.pane);
    });
  };

  this.addPane = function addPane(pane, element) {
    if (!panes.length) {
      $scope.select(pane);
    }
    paneRecords.push({
      pane: pane,
      element: element
    });
    // we need to sort panes array to match the DOM order, see https://github.com/angular-ui/bootstrap/pull/153
    this.sortPaneRecords();
    this.updatePanes();
  };

  this.removePane = function removePane(pane) {
    var index = panes.indexOf(pane);
    panes.splice(index, 1);
    paneRecords.splice(index, 1);
    //Select a new pane if removed pane was selected
    if (pane.selected && panes.length > 0) {
      $scope.select(panes[index < panes.length ? index : index-1]);
    }
  };
}])
.directive('tabs', function() {
  return {
    restrict: 'EA',
    transclude: true,
    scope: {},
    controller: 'TabsController',
    templateUrl: 'template/tabs/tabs.html',
    replace: true
  };
})
.directive('pane', ['$parse', function($parse) {
  return {
    require: '^tabs',
    restrict: 'EA',
    transclude: true,
    scope:{
      heading:'@'
    },
    link: function(scope, element, attrs, tabsCtrl) {
      var getSelected, setSelected;
      scope.selected = false;
      if (attrs.active) {
        getSelected = $parse(attrs.active);
        setSelected = getSelected.assign;
        scope.$watch(
          function watchSelected() {return getSelected(scope.$parent);},
          function updateSelected(value) {scope.selected = value;}
        );
        scope.selected = getSelected ? getSelected(scope.$parent) : false;
      }
      scope.$watch('selected', function(selected) {
        if(selected) {
          tabsCtrl.select(scope);
        }
        if(setSelected) {
          setSelected(scope.$parent, selected);
        }
      });
      tabsCtrl.addPane(scope, element);
      scope.$on('$destroy', function() {
        tabsCtrl.removePane(scope);
      });
    },
    templateUrl: 'template/tabs/pane.html',
    replace: true
  };
}]);
