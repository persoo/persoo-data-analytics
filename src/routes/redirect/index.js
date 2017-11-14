import { h, Component } from 'preact';
import { route } from 'preact-router';
import style from './style';

export default class Redirect extends Component {
    componentDidMount() {
        route(this.props.to, true);
    }

    render() {
        return null;
    }
}
