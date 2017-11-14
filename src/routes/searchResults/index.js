import { h, Component } from 'preact';
import style from './style';

import PersooSearchResults from '../../components/persooSearchResults';

export default class SearchResults extends Component {

	render(props) {
        console.log('Route <SearchResults>.render()');
        var haveData = props.context.accountID !== null &&
            props.context.environmentID !== null &&
            props.context.tableID !== null &&
            props.searchResultsOfferTemplate &&
            props.metadata[props.context.tableID];

		return (
			<div class={style.home}>
				<h1>Search Results</h1>
                {
                    haveData && <PersooSearchResults {...props} />
                }
			</div>
		);
	}
}
