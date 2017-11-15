import { h, Component } from 'preact';
import style from './style';


import {
    convertToReactComponent,
    getSearchResultsHTML,
    runJavascriptInDOMSubTree
} from '../../utils/templateComponentsUtils';


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
