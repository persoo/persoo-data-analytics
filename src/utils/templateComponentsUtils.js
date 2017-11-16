import { h, Component } from 'preact';
import { PureComponent } from 'react';
import EJS from 'persoo-templates/lib/embeddedjs';


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

export {
    convertToReactComponent,
    throttle,
    createDefaultContentFromTemplate
}
