import { h, Component } from 'preact';
import { PureComponent } from 'react';
import EJS from 'persoo-templates/lib/embeddedjs';
import persooTemplates from 'persoo-templates';
import { getSearchResultsURL } from '../utils/urlUtils';


/**
 * Convert simple HTML of result of template(props) call into React Component, which
 * can hold our classes, event listeners, ...
 * @param {string|function} template - HTML string or function retuning HTML string
 * @return {ReactComponent}
 */
function convertToReactComponent(template) {
    let renderTemplateFunction = template;
    if (typeof template == 'string') {
        if (template.indexOf('%>') >= 0) {
            // its EmbeddedJS template
            let ejsOptions = {
                escape: function (str) {return str;}
            };
            renderTemplateFunction = EJS.compile(template, ejsOptions);
        } else {
            // plain string
            renderTemplateFunction = function () { return template; };
        }
    }
    // Note: caching is not neccessary, each React Component (class) is defined
    // only once and remembers compiled template
    var TemplateComponent = class extends AbstractCustomTemplate {
        constructor(props) {
            super(renderTemplateFunction, props);
        }
    }
    return TemplateComponent;
}

class AbstractCustomTemplate extends PureComponent {
    constructor(renderTemplateFunction, props) {
        super(props);
        this.renderTemplateFunction = renderTemplateFunction;
    }
    render(props) {
        const {className, style, onMouseEnter, onMouseDown, onMouseLeave} = props;
        const rawHTML = this.renderTemplateFunction(props);
        if (rawHTML) {
            return <div
                dangerouslySetInnerHTML={{__html: rawHTML}}
                {...{className, style, onMouseEnter, onMouseDown, onMouseLeave}}
            />;
        } else {
            return null;
        }
    }
}

/**
 * Call callback() at most once in time interval. Call callback() at the end of interval
 * in case it was canceled during the interval. Use function arguments passed in the last call.
 * @param {function} callback
 * @param {number} limit in millis
 * @param {boolean} callOnLeadingEdgeToo ... call function on the leading edge of the interval, too.
 * @return {function} throttled function with the same arguments
 */
function throttle(callback, limit, callOnLeadingEdgeToo) {
    var callOnLeadingEdgeIndicator = callOnLeadingEdgeToo ? 1 : 0;
    var canceledCallsInInterval = 0;
    var lastArguments = null;
    var lastThis = null;
    return function () {
        lastThis = this;
        lastArguments = arguments;
        if (!canceledCallsInInterval) {
            if (callOnLeadingEdgeToo) {
                callback.apply(lastThis, lastArguments);
            }
            canceledCallsInInterval = 1;
            setTimeout(function () {
                if (canceledCallsInInterval > callOnLeadingEdgeIndicator) {
                    callback.apply(lastThis, lastArguments);
                }
                canceledCallsInInterval = 0;
            }, limit);
        } else {
            canceledCallsInInterval++;
        }
    }
}

/*************************************************************************/
/* Persoo Templates utils                                                */
/*************************************************************************/
function createDefaultContentFromTemplate(template) {
    let offer = {
            variants:[{
                templateID: template.id,
                content: {},
                scenarios: []
            }]
    };
    let offerContent = offer.variants[0].content;
    let offerScenarios = offer.variants[0].scenarios;

    if (template.fields) {
        for (var i = 0; i < template.fields.length; i++) {
            var field = template.fields[i];
            if (!field.id) {
                console.error(templateID, 'fields[' + i +'].id is missing.');
            }
            if (typeof field.defaultValue === 'undefined' && field.type != 'section') {
                console.error(templateID, 'fields[' + i +'].defaultValue is missing.');
            }
            if (field.id && typeof field.defaultValue !== 'undefined') {
                offerContent[field.id] = field.defaultValue;
            }
        }
    } else {
        console.error(templateID, 'has no fields.')
    }
    return offer;
}

function getSearchResultsHTML(context, searchResultsOfferTemplate, tableMetadata) {
    let offer = createDefaultContentFromTemplate(searchResultsOfferTemplate);
    let offerContent = offer.variants[0].content;

    let urlPrefix = getSearchResultsURL(context).replace('/list', '/detail/');

    // item template
    offerContent.itemTemplate = "<a href=\"<%= '" + urlPrefix + "' + item.itemGroupID %>\" \
                onmousedown=\"event.button == 0 && paGlobalRouteFunction('<%= '" + urlPrefix + "' + item.itemGroupID %>' + document.location.search) && false\" \
           class=\"persoo-result-item__link\"> \
            <div class=\"persoo-result-item__img-container\"> \
                <img src=<%= item.imageLink %>\
                     class=\"persoo-result-item__img\">\
            </div>\
            <div class=\"persoo-result-item__title\" title=<%= item.description %>>\
                <%= item.title %>\
            </div>\
            <div class=\"persoo-result-item__price\">\
                <span class=\"persoo-result-item__price__current\">\
                    <%= item.price %>&nbsp;Kč\
                </span>\
                <% if (item.priceOriginal && item.priceOriginal !== item.price) { %>\
                    <span class=\"persoo-result-item__price__original\">\
                        <%= item.priceOriginal %>&nbsp;Kč\
                    </span>\
                <% } %> \
            </div>\
            <div class=\"persoo-result-item__statistics\">\
                <div><span>buy1-90:</span>\
                    <%= item.buy1 %>,\
                    <%= item.buy7 %>,\
                    <%= item.buy30 %>,\
                    <%= item.buy90 %></div>\
                <div><span>view1-90:</span>\
                    <%= item.view1 %>,\
                    <%= item.view7 %>,\
                    <%= item.view30 %>,\
                    <%= item.view90 %></div>\
                <div><span>buyView1-90:</span>\
                    <%= Math.round(100*item.buyView1)/100 %>,\
                    <%= Math.round(100*item.buyView7)/100 %>,\
                    <%= Math.round(100*item.buyView30)/100 %>,\
                    <%= Math.round(100*item.buyView90)/100 %></div>\
                <div><span>crossellRank:</span> <%= item.crosssellRank %>,\
                    <span>crossviewRank:</span> <%= item.crossviewRank %></div>\
            </div>\
        </a>";

    offerContent.customCSS += '.persoo-result-item__statistics > div > span {color: #ccc;}';

    // get numeric fields
    let numericFieldIDs = [];
    for (let variableID in tableMetadata) {
        let variable = tableMetadata[variableID];
        if (['long', 'double', 'timestamp', 'duration', 'percent', 'currency'].indexOf(variable.type) >= 0) {
            numericFieldIDs.push(variableID);
        }
    }
    // sort options by all available numeric fields
    numericFieldIDs.sort().map( (numericFieldID) => {
        offerContent.sortByOptions.push( {attribute: numericFieldID, label: numericFieldID + ' (DESC)', order: "desc"});
        offerContent.sortByOptions.push( {attribute: numericFieldID, label: numericFieldID + ' (ASC)', order: "asc"});

        if (['crosssellRank','crossviewRank','buy1','buy7','buy30','buy90','view1','view7','view30','view90'].indexOf(numericFieldID) >= 0) {
            offerContent.filtersGroups.push( {attributeName: numericFieldID, collapsed: false,
                format: "<%= Math.round(rawValue*100)/100 %>", pips: false,
                headerTemplate: numericFieldID, type: "rangeSlider"});
        }
    });

    // TODO add refinment filters
    // {attributeName: "size", collapsed: false, headerTemplate: "Size", type: "refinementButtonList"}

    let offerContext = {
        offerID: "randomOfferID",
        locationID: "randoLocationID",
        profile: {
            db: {
                identifications: {}
            }
        }
    };
    return persooTemplates.render(searchResultsOfferTemplate.template, offer.variants[0], offerContext);
}

function runJavascriptInDOMSubTree(elementID) {
    // run javascripts contained in the html in iFrame context
    const searchContainerElement = document.getElementById(elementID);
    if (searchContainerElement) {
        const scriptElements = searchContainerElement.getElementsByTagName('script');
        for (let i = 0; i < scriptElements.length; i++) {
            window.eval(scriptElements[i].innerHTML);
        }
    }
}

export {
    convertToReactComponent,
    throttle,

    getSearchResultsHTML,
    runJavascriptInDOMSubTree
}
