import { h, Component } from 'preact';
import style from './style';

export default class Debug extends Component {
	render(props) {
		return (
			<div class={style.home}>
				<h1>We received pageType {props.pageType}</h1>
                <pre>
                    {JSON.stringify(props, false, 4)}
                </pre>
			</div>
		);
	}
}
