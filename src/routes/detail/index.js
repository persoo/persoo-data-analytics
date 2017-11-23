import { h, Component } from 'preact';
import { Link } from 'preact-router';
import { getURLfromState } from '../../utils/urlUtils';
import ItemDetailLarge from '../../components/itemDetailLarge';
import AlgorithmPreviewBlock from '../../components/algorithmPreviewBlock';
import Tabs from 'preact-material-components/Tabs';
import 'preact-material-components/Tabs/style.css';
import style from './style';

export default class Detail extends Component {
    state = {
        tabID: 'algorithms'
    }
    changeTab = (tabID) => {
        this.setState({ tabID: tabID });
    };
    render(props, { tabID }) {
        console.log('Route <Detail>.render()');
        let upURL = getURLfromState(props.context, 'list') + document.location.search;
        let { context, currentItem, currentItemLoaded, currentItemLoading,
            loadDetailItem, loadAlgorithmPreviews, changeAlgorithmInSlot, removeAlgorithmInSlot,
            algorithms, algorithmPreviews } = props;
        let haveData = props.context.accountID !== null &&
            props.context.environmentID !== null &&
            props.context.tableID !== null &&
            props.metadata[props.context.tableID] &&
            props.curentItem;

        if (currentItemLoaded == context.itemID ) {
            return (
                <div class={style.home}>
                    <div>
                        <Link href={upURL}>Go up</Link> | Item detail
                    </div>

                    <ItemDetailLarge currentItem={currentItem} context={context} />
                    <Tabs className='item-detail-tabs' class={style.itemDetailTabs}>
                        <Tabs.Tab onClick={this.changeTab.bind(this, 'algorithms')}>Algorithms</Tabs.Tab>
                        <Tabs.Tab onClick={this.changeTab.bind(this, 'json')}>JSON</Tabs.Tab>
                        <Tabs.Tab onClick={this.changeTab.bind(this, 'reports')}>Reports</Tabs.Tab>
                    </Tabs>
                    {
                        tabID == 'json' && <div>
                            <h2>Internal item data stored at Persoo</h2>
                            <pre>
                                {JSON.stringify(currentItem, false, 4)}
                            </pre>
                        </div>
                    }
                    {
                        tabID == 'algorithms' && <div>
                            <h2>Algorithms (called with this itemGroupID)</h2>
                            {
                                context.selectedAlgorithmIDs.map( (algorithmID, algorithmPreviewSlotIndex) => (
                                    <AlgorithmPreviewBlock
                                        context={context}
                                        algorithmPreviewSlotIndex={algorithmPreviewSlotIndex}
                                        currentItem={currentItem}
                                        algorithms={algorithms}
                                        algorithmPreviews={algorithmPreviews}
                                        changeAlgorithmPreview = {changeAlgorithmInSlot.bind(this, algorithmPreviewSlotIndex)}
                                        removeAlgorithmPreview = {removeAlgorithmInSlot.bind(this, algorithmPreviewSlotIndex)}
                                    />
                                ))
                            }
                            <AlgorithmPreviewBlock
                                context={context}
                                algorithmPreviewSlotIndex={context.selectedAlgorithmIDs.length}
                                currentItem={currentItem}
                                algorithms={algorithms}
                                algorithmPreviews={algorithmPreviews}
                                changeAlgorithmPreview = {changeAlgorithmInSlot.bind(this, context.selectedAlgorithmIDs.length)}
                                removeAlgorithmPreview={null}
                            />
                        </div>
                    }
                    {
                        tabID == 'reports' && <div>
                            <h2>TODO</h2>
                            Show various product reports, graphs of buy, view, ... metrics in time ...
                        </div>
                    }
                </div>
            );
        }

        if (currentItemLoading != context.itemID) {
            loadDetailItem(context.itemID);
            loadAlgorithmPreviews(context.itemID);
        }

        return (
            <div class={style.home}>
                <Link href={upURL}>Go up</Link>
                <h1>Detail for {context.itemID}</h1>
                <div>Loading ...</div>
            </div>
        );
    }
}
