import { h, Component } from 'preact';
import style from './style';


import {
    convertToReactComponent,
    getSearchResultsHTML,
    runJavascriptInDOMSubTree
} from '../../utils/templateComponentsUtils';


export default class SearchResults extends Component {
    constructor (props) {
        super(props);

        console.log('PSResults - constructor() with props:' );
        this.state = {
            context: {},
        }
    }

    componentWillReceiveProps(nextProps) {
        this.setState({context: JSON.parse(JSON.stringify(nextProps.context))});
    }
    shouldComponentUpdate(nextProps, nextState) {
        const state = this.state;
        /* rerender only if account context has changed */
        if (state.context.cloudID == nextState.context.cloudID &&
            state.context.accountID == nextState.context.accountID &&
            state.context.environmentID == nextState.context.environmentID &&
            state.context.tableID == nextState.context.tableID) {

            return false;
        }
        return true;
    }
    componentDidMount() {
        console.log('Running script elements in searchResultsComponent.');
        runJavascriptInDOMSubTree('persoo--randomOfferID');
    }
    componentDidUpdate() {
        console.log('Running script elements in searchResultsComponent.');
        runJavascriptInDOMSubTree('persoo--randomOfferID');
    }

	render(props) {
        console.log('PSResults - render()');
        const tableMetadata = props.metadata[props.context.tableID]

        /* Notes:
        - <script> element se vlozi jako rawHTML, ale neozivi (tedy nicemu nevadi}
        */
        let InnerSearchComponent = convertToReactComponent(getSearchResultsHTML.bind(this, props.searchResultsOfferTemplate, tableMetadata));
        return (
            <InnerSearchComponent />
		);
	}
}
