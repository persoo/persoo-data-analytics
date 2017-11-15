import { h, Component } from 'preact';
import { Link } from 'preact-router';
import { getSearchResultsURL } from '../../utils/urlUtils';
import style from './style';

export default class Detail extends Component {
    render(props) {
        let upURL = getSearchResultsURL(props.context) + document.location.search;
        return (
            <div class={style.home}>
                <Link href={upURL}>Go up</Link>
                <h1>We received pageType {props.pageType}</h1>
                <pre>
                    {JSON.stringify(props, false, 4)}
                </pre>
            </div>
        );
    }
}
