'use strict';

angular.module('app').controller('WorkareaController', ['$scope', 'fatscrollsService', function ($scope, fatscrollsService) {
    $scope.company = {
        name: 'IOKI'
    };

    $scope.scrolls = fatscrollsService.getFatscrolls();

    $scope.scrollTo = function () {
        fatscrollsService.moveMeTo($scope.currentScroll.name, $scope.scrollVal);
    };
}]);