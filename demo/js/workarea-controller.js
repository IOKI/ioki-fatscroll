'use strict';

angular.module('app').controller('WorkareaController', ['$scope', 'fatscrollsService', function ($scope, fatscrollsService) {
    $scope.company = {
        name: 'IOKI'
    };

    $scope.scrolls = fatscrollsService.getFatscrolls();

    $scope.scrollTo = function () {
        fatscrollsService.moveMeTo($scope.currentScroll.name, $scope.scrollVal);
    };

    $scope.paragraphExample = 'Lorem ipsum dolor sit amet, quo error aperiri recteque ea,quo augue dicunt ut, mei et debet latine.Ei pri aperiam intellegebat, ludus disputando ius no.Eos te idque intellegam, usu in elitr conclusionemque. Vix meis fastidii cu. Usu mutat senserit petentium an. Timeam intellegat vituperata ex vis, te vel modus explicari.';
    $scope.paragraphs = [];

    $scope.addExampleParagraph = function () {
        $scope.paragraphs.push($scope.paragraphExample);
    };

    for (var i = 0; i < 2; i++) {
        $scope.addExampleParagraph();
    }
}]);