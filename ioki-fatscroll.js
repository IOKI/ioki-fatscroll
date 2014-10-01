angular.module('ioki.fatscroll', [])
    .directive('fatscroll', function ($document) {
        'use strict';

        return {
            restrict: 'A',
            transclude: true,
            templateUrl: 'templates/ioki-fatscroll',

            link: function (scope, element) {
                var scrollWrapper = element[0],
                    scrollArea = scrollWrapper.firstChild,
                    scrollAreaHeight = element.find('scroll-content')[0].clientHeight,
                    scrollbarViewportHeight = element.find('scroll-area')[0].clientHeight,

                    thumb = element.find('thumb'),
                    thumbHeight,
                    thumbTopStartPos,

                    dragStartPos,
                    scrollAreaStartPosition,

                    viewRatio = scrollbarViewportHeight / scrollAreaHeight;

                /* Hide the scroll when there isn't enough content to scroll,
                 if there is enough content, initialize pi-fatscroll */
                if (scrollAreaHeight > scrollbarViewportHeight) {
                    init();
                } else {
                    thumb.css('display', 'none');
                }

                function init() {
                    /* Adjust thumb height to the content size */
                    calculateThumbHeight();

                    /* Add listeners */
                    element.on('mousewheel', mousewheel);
                    element.on('DOMMouseScroll', mousewheel);
                    thumb.on('mousedown touchstart', startDrag);
                }

                function mousewheel(ev) {
                    var deltaY = ev.deltaY !== undefined ? ev.deltaY : ev.detail * 20;

                    scrollArea.scrollTop += deltaY;
                    moveTheThumb(deltaY);
                }

                function calculateThumbHeight() {
                    var thumbCalculatedHeight = viewRatio * scrollbarViewportHeight;

                    thumb.css({ height: thumbCalculatedHeight + 'px' });

                    return thumbCalculatedHeight;
                }

                function moveTheThumb(param) {
                    var maxTop = calculateMaxTop(),
                        oldTop = parseInt(thumb.css('top'), 10),
                        newTop;

                    /* set the height of the thumb */
                    thumbHeight = calculateThumbHeight();

                    /* rescale */
                    param *= viewRatio;

                    oldTop = (oldTop) ? oldTop : 0;

                    newTop = oldTop + param;

                    /* scrolling direction check */
                    if (param > 0) {
                        newTop = (newTop > maxTop ? maxTop : newTop) + 'px';
                    } else {
                        newTop = (newTop < 0 ? 0 : newTop) + 'px';
                    }

                    /* Update top position and move the thumb */
                    thumb.css({ top: newTop });
                }

                function calculateMaxTop() {
                    return scrollbarViewportHeight - thumbHeight;
                }

                function startDrag(ev) {
                    dragStartPos = ev.y || ev.clientY;
                    thumbTopStartPos = parseInt(thumb.css('top') || 0, 10);
                    scrollAreaStartPosition = scrollArea.scrollTop;

                    $document.on('mousemove', dragTheThumb);
                    $document.on('mouseup', dragStop);
                }

                function dragStop() {
                    $document.off('mousemove', dragTheThumb);
                    element.removeClass('no-select');
                }

                function dragTheThumb(ev) {
                    var newTop = (thumbTopStartPos + ev.pageY - dragStartPos),
                        maxTop;

                    thumbHeight = calculateThumbHeight();
                    maxTop = calculateMaxTop();

                    element.addClass('no-select');

                    if (newTop > maxTop) {
                        thumb.css('top', maxTop + 'px');
                    } else if (newTop < 0) {
                        thumb.css('top', '0');
                    } else {
                        thumb.css('top', +(newTop) + 'px');
                        scrollArea.scrollTop = scrollAreaStartPosition + ((ev.pageY - dragStartPos) / viewRatio);
                    }

                }
            }
        };
    });
angular.module('ioki.fatscroll').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/ioki-fatscroll',
    "<scroll-area>\n" +
    "    <scroll-content class=\"scroll-content\" ng-transclude></scroll-content>\n" +
    "</scroll-area>\n" +
    "<thumb></thumb>"
  );

}]);
