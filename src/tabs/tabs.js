angular.module('ui.bootstrap.tabs', [])
.controller('TabsController', ['$scope', '$element', function($scope, $element) {
  var panes = $scope.panes = [];

  this.select = $scope.select = function selectPane(pane) {
    angular.forEach(panes, function(pane) {
      pane.selected = false;
    });
    pane.selected = true;
  };

  this.addPane = function addPane(pane, index) {
    if (!panes.length) {
      $scope.select(pane);
    }
    if (index === undefined) {
      index = panes.length;
    }
    panes.splice(index, 0, pane);
  };

  this.removePane = function removePane(pane) {
    var index = panes.indexOf(pane);
    panes.splice(index, 1);
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
      scope.__pane = true;
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

      var findIndexOfPane = function(el) {
        var rawEl = el.get(0);
        var siblings = el.parent().children();
        var index = 0; // index only children which are our panes
        for (var i=0; i<siblings.length; i++) {
          if (siblings.get(i) === rawEl) {
            return index;
          }
          var siblingScope = siblings.eq(i).scope();
          if (siblingScope && siblingScope.__pane) {
            index++;
          }
        }
      };

      tabsCtrl.addPane(scope, findIndexOfPane(element));
      scope.$on('$destroy', function() {
        tabsCtrl.removePane(scope);
      });
    },
    templateUrl: 'template/tabs/pane.html',
    replace: true
  };
}]);
