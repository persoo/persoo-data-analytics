import { h, Component } from 'preact';
import Card from 'preact-material-components/Card';
import LayoutGrid from 'preact-material-components/LayoutGrid';
import List from 'preact-material-components/List';
import 'preact-material-components/List/style.css';
import 'preact-material-components/LayoutGrid/style.css';
import 'preact-material-components/Card/style.css';
import 'preact-material-components/Button/style.css';
import style from './style';

export default class ItemDetailLarge extends Component {
    render(props) {
        let { context, currentItem } = props;
        return (
                <Card>
                    <Card.Primary>
                        <Card.Title>{currentItem.title || context.itemID}</Card.Title>
                    </Card.Primary>
                    <Card.SupportingText>
                        <LayoutGrid>
                            <LayoutGrid.Inner>
                                <LayoutGrid.Cell cols="4">
                                    <img src={currentItem.imageLink} class={style.image}/>
                                </LayoutGrid.Cell>
                                <LayoutGrid.Cell cols="4">
                                    <List>
                                        <List.Item>categoryID: {currentItem.categoryID}</List.Item>
                                        <List.Item>productType: {currentItem.productType}</List.Item>
                                        <List.Item>brand: {currentItem.brand}</List.Item>
                                        <List.Item>price: {currentItem.price}</List.Item>
                                        <List.Item><a href={currentItem.link}>See on eshop</a></List.Item>
                                    </List>
                                </LayoutGrid.Cell>
                            </LayoutGrid.Inner>
                        </LayoutGrid>
                    </Card.SupportingText>
                </Card>
        );
    }
}
