import { h, Component } from 'preact';
import style from './style';

import PersooSearchResults from '../../components/persooSearchResults';

export default class SearchResults extends Component {

    render(props) {
        console.log('Route <SearchResults>.render()');
        let context = props.context;
        let haveData = props.context.accountID !== null &&
            props.context.environmentID !== null &&
            props.context.tableID !== null &&
            props.searchResultsOfferTemplate &&
            props.metadata[props.context.tableID];
        let contextKey = [context.cloudID, context.accountID, context.environmentID, context.tableID].join('_');
        // Note: ContextKey to force re-mount because of external JS may modify DOM.

        return (
            <div class={style.home}>
                <h1>Search Results</h1>
                {
                    haveData && <PersooSearchResults {...props} key={contextKey} />
                }
            </div>
        );
    }
}
