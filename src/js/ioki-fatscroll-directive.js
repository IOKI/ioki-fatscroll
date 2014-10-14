angular.module('ioki.fatscroll', [])
    .directive('fatscroll', ['$document','fatscrollsService',function ($document, fatscrollsService) {
        'use strict';

        return {
            restrict: 'A',
            transclude: true,
            templateUrl: 'templates/ioki-fatscroll',
            scope: {},

            link: function (scope, element, attrs) {

                var scrollWrapper, scrollWrapperHeight,

                    scrollArea, scrollAreaEl,

                    scrollContentHeight,

                    thumb = element.find('thumb'), thumbHeight, thumbTopStartPos,

                    dragStartPos, scrollAreaStartPosition,

                    viewRatio,

                    bodyEl = $document.find('body'),

                    newTop, maxTop,

                    realTop = 0;

                scope.scrollContentHeight = element.find('scroll-content')[0];

                /* Add listeners */
                element.on('mousewheel', mousewheel);
                element.on('DOMMouseScroll', mousewheel);
                thumb.on('mousedown touchstart', startDrag);

                init();

                scope.$watch('scrollContentHeight.clientHeight', function (newVal, oldVal) {
                    /* re-init when content is loaded */
                    if (newVal !== oldVal) {
                        init();
                    }
                });

                function init() {
                    addScrollToList();

                    scrollWrapper = element[0];
                    scrollWrapperHeight = element[0].clientHeight;

                    scrollArea = scrollWrapper.firstChild;
                    scrollAreaEl = element.find('scroll-area');

                    scrollContentHeight = element.find('scroll-content')[0].clientHeight;

                    viewRatio = scrollWrapperHeight / scrollContentHeight;

                    bodyEl = $document.find('body');

                    /* Adjust thumb height to the content size */
                    calculateThumbHeight();

                    /* set height of area on the base of the parent element */
                    scrollAreaEl.css('height', scrollWrapperHeight + 'px');

                    if (scrollContentHeight <= scrollWrapperHeight) {
                        thumb.css('display', 'none');
                    } else {
                        thumb.css('display', 'block');
                    }

                }

                function addScrollToList() {
                    var scrollName = attrs.fatscrollName;

                    if (scrollName !== undefined) {
                        fatscrollsService.addFatscroll(scrollName, scope);
                    }
                }

                function scrollTo(element, additionalOffset) {
                    var maxTopThumb = calculateMaxTop();

                    maxTop = parseInt(maxTopThumb / viewRatio, 10);

                    element = parseInt(element, 10);

                    if (typeof element !== 'number') {

                        if (typeof additionalOffset === 'number') {
                            element = element.offsetTop + additionalOffset;
                        } else {
                            element = element.offsetTop;
                        }

                    }

                    if (element > maxTop) {
                        thumb.css('top', maxTopThumb + 'px');
                        realTop = maxTopThumb;
                        scrollArea.scrollTop = maxTop;
                    } else if (element < 0) {
                        thumb.css('top', '0');
                        realTop = 0;
                        scrollArea.scrollTop = 0;
                    } else {
                        thumb.css('top', +(element * viewRatio) + 'px');
                        realTop = element * viewRatio;
                        scrollArea.scrollTop = element;
                    }

                }

                function mousewheel(ev) {
                    var deltaY = ev.deltaY !== undefined ? ev.deltaY : ev.detail * 40;

                    scrollArea.scrollTop += deltaY;

                    scrollTo(scrollArea.scrollTop);
                }

                function calculateThumbHeight() {
                    var thumbCalculatedHeight = viewRatio * scrollWrapperHeight;

                    thumb.css({ height: thumbCalculatedHeight + 'px' });

                    return thumbCalculatedHeight;
                }

                function calculateMaxTop() {
                    thumbHeight = calculateThumbHeight();

                    return scrollWrapperHeight - thumbHeight;
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
                    bodyEl.removeClass('no-select');
                }

                function dragTheThumb(ev) {
                    newTop = (thumbTopStartPos + ev.pageY - dragStartPos);

                    thumbHeight = calculateThumbHeight();

                    bodyEl.addClass('no-select');

                    scrollTo(scrollAreaStartPosition + ((ev.pageY - dragStartPos) / viewRatio));
                }

                scope.scrollTo = scrollTo;

            }
        };
    }]);