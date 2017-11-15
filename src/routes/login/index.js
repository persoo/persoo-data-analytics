import { h, Component } from 'preact';
import Card from 'preact-material-components/Card';
import 'preact-material-components/Card/style.css';
import 'preact-material-components/Button/style.css';
import style from './style';

export default class Login extends Component {
    render() {
        return (
            <div class={style.home}>
                <h1>Persoo Data Analytics</h1>
                <Card>
                    <Card.Primary>
                        <Card.Title>You are not logged-in.</Card.Title>
                    </Card.Primary>
                    <Card.SupportingText>
                        Login first and then come back and refresh this page.
                    </Card.SupportingText>
                    <Card.Actions>
                        <Card.Action><a href="https://adminapi-test-a.persoo.cz">Login</a></Card.Action>
                    </Card.Actions>
                </Card>
            </div>
        );
    }
}
