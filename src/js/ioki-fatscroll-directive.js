angular.module('ioki.fatscroll', [])
    .directive('fatscroll', ['$document', '$timeout', 'fatscrollsService', function ($document, $timeout, fatscrollsService) {
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

                    realTop = 0,

                    hide;

                scope.scrollContentHeight = element.find('scroll-content')[0];

                /* Add listeners */
                element.on('mousewheel', mousewheel);
                element.on('DOMMouseScroll', mousewheel);
                thumb.on('mousedown touchstart', startDrag);

                /* Initialize */
                init();
                /*
                    Watch for the changes in the content height and if there are any
                    run init method again to get proper element heights
                 */
                scope.$watch('scrollContentHeight.clientHeight', function (newVal, oldVal) {
                    /* re-init when content is loaded */
                    if (newVal !== oldVal) {
                        init();
                    }
                });

                /**
                 * Method init
                 *
                 * Method invokes addScrollToList and showScroll methods,
                 * gets all the necessary heights and elements,
                 * so the scrolls can work as intended
                 */
                function init() {
                    /* Add all the scrolls and their scopes to the list  */
                    addScrollToList();
                    /* Show the scrolls */
                    showScroll();
                    /* get all the heights and elements needed */
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
                    /* Check if there's enough content to scroll */
                    if (scrollContentHeight <= scrollWrapperHeight) {
                        thumb.css('display', 'none');
                    } else {
                        thumb.css('display', 'block');
                    }

                }

                /**
                 * Method showScroll
                 *
                 * Method adds the class to the thumb in order to be visible
                 * then sets the timeout with the method that hides it,
                 * so if scroll is idle, it disappears
                 */
                function showScroll() {
                    thumb.addClass('visible');
                    hide = $timeout(hideScroll, 1500);
                }

                /**
                 * Method hideScroll
                 *
                 * Method removes the class from the thumb, so it can disappear
                 */
                function hideScroll() {
                    thumb.removeClass('visible');
                }

                /**
                 * Method addScrollToList
                 *
                 * Method adds all the fatscrolls on the view
                 * as well as their scopes using service method
                 */
                function addScrollToList() {
                    var scrollName = attrs.fatscrollName;

                    if (scrollName !== undefined) {
                        fatscrollsService.addFatscroll(scrollName, scope);
                    }
                }

                /**
                 * Method scrollTo
                 *
                 * Method responsible for all the scrolling
                 *
                 * @param element                      - element to which scroll should be moved
                 * @param additionalOffset             - optional additional offset
                 */
                function scrollTo(element, additionalOffset) {
                    var maxTopThumb = calculateMaxTop();

                    /*
                        Cancel timeout every time the scroll moves,
                        so fading effects don't overlap each other
                        and then run showScroll method
                     */
                    $timeout.cancel(hide);
                    showScroll();

                    maxTop = parseInt(maxTopThumb / viewRatio, 10);
                    element = parseInt(element, 10);

                    /*
                        Check the type of the passed element.
                        If the element is not a number the target is a DOM element,
                        so get its offset
                     */
                    if (typeof element !== 'number') {

                        if (typeof additionalOffset === 'number') {
                            element = element.offsetTop + additionalOffset;
                        } else {
                            element = element.offsetTop;
                        }

                    }
                    /*
                        Check if element is out of bounds,
                        if it is, set the thumb position in bounds
                     */
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

                /**
                 * Method mousewheel
                 *
                 * Method gets the delta from the scroll action
                 * then runs the scrollTo method
                 *
                 * @param ev
                 */
                function mousewheel(ev) {
                    var deltaY = ev.deltaY !== undefined ? ev.deltaY : ev.detail * 40;

                    scrollArea.scrollTop += deltaY;

                    scrollTo(scrollArea.scrollTop);
                }

                /**
                 * Method calculateThumbHeight
                 *
                 * Method returns thumb height depending on the ratio and the wrapper height
                 *
                 * @returns {number}
                 */
                function calculateThumbHeight() {
                    var thumbCalculatedHeight = viewRatio * scrollWrapperHeight;

                    thumb.css({ height: thumbCalculatedHeight + 'px' });

                    return thumbCalculatedHeight;
                }

                /**
                 * Method calculateMaxTop
                 *
                 * Method returns the max top position for the thumb,
                 * so it stops within viewport boundaries
                 *
                 * @returns {number}
                 */
                function calculateMaxTop() {
                    thumbHeight = calculateThumbHeight();

                    return scrollWrapperHeight - thumbHeight;
                }

                /**
                 * Method startDrag
                 *
                 * Method attaches listeners for dragging and stop dragging the thumb
                 * and gets the starting position for dragging
                 *
                 * @param ev
                 */
                function startDrag(ev) {
                    dragStartPos = ev.y || ev.clientY;
                    thumbTopStartPos = parseInt(thumb.css('top') || 0, 10);
                    scrollAreaStartPosition = scrollArea.scrollTop;

                    $document.on('mousemove', dragTheThumb);
                    $document.on('mouseup', dragStop);
                }

                /**
                 * Method dragStop
                 *
                 * Method removes the event handler responsible for dragging
                 */
                function dragStop() {
                    $document.off('mousemove', dragTheThumb);
                    bodyEl.removeClass('no-select');
                }

                /**
                 * Method dragTheThumb
                 *
                 * Method turns off the selection on the whole document
                 * and drags the thumb within the viewport
                 *
                 * @param ev
                 */
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