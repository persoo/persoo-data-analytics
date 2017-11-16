import { h, Component } from 'preact';
import style from './style';
import persooTemplates from 'persoo-templates';
import { getURLfromState } from '../../utils/urlUtils';
import { convertToReactComponent, createDefaultContentFromTemplate } from '../../utils/templateComponentsUtils';


function getSearchResultsHTML(context, searchResultsOfferTemplate, tableMetadata) {
    let offer = createDefaultContentFromTemplate(searchResultsOfferTemplate);
    let offerContent = offer.variants[0].content;

    let urlPrefix = getURLfromState(context, 'detail').replace(/detail\/.*$/, "detail/");

    // item template
    offerContent.itemTemplate = "<a href=\"<%= '" + urlPrefix + "/' + item.itemGroupID %>\" \
                onmousedown=\"event.button == 0 && paGlobalRouteFunction('<%= '" + urlPrefix + "/' + item.itemGroupID %>' + document.location.search) && false\" \
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

export default class SearchResults extends Component {
    shouldComponentUpdate(nextProps, nextState) {
        // Note: rerender (dom diff) will break external JS library running this component.
        // Remount component instead of rerender by sending diffrent 'key' to this component.
        return false;
    }
    componentDidMount() {
//        console.log('PSResults - componentDidMount() - Running script elements in searchResultsComponent.');
        runJavascriptInDOMSubTree('persoo--randomOfferID');
    }

    render(props) {
//        console.log('PSResults - render()');
        const tableMetadata = props.metadata[props.context.tableID]

        /* Notes:
        - <script> element se vlozi jako rawHTML, ale neozivi (tedy nicemu nevadi}
        */
        let InnerSearchComponent = convertToReactComponent(getSearchResultsHTML.bind(this, props.context, props.searchResultsOfferTemplate, tableMetadata));
        return (
            <InnerSearchComponent />
        );
    }
}
