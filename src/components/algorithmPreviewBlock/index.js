import { h, Component } from 'preact';
import { getURLfromState } from '../../utils/urlUtils';
import Card from 'preact-material-components/Card';
import LayoutGrid from 'preact-material-components/LayoutGrid';
import List from 'preact-material-components/List';
import Select from 'preact-material-components/Select';
import Icon from 'preact-material-components/Icon';
import 'preact-material-components/Select/style.css';
import 'preact-material-components/List/style.css';
import 'preact-material-components/LayoutGrid/style.css';
import 'preact-material-components/Card/style.css';
import 'preact-material-components/Button/style.css';
import style from './style';

export default class AlgorithmPreviewBlock extends Component {
    render(props) {
        let { context, currentItem, algorithms, algorithmPreviews, algorithmPreviewSlotIndex, changeAlgorithmPreview, removeAlgorithmPreview } = props;
        const algorithmID = context.selectedAlgorithmIDs[algorithmPreviewSlotIndex];
        const algorithmPreviewData = algorithmPreviews[algorithmID];
        const algorithmSelectIndex = (algorithmPreviewData && algorithmPreviewData.algorithmIndex) || -1; // fallback for the case "no algorithm selected"
        const urlPrefix = getURLfromState(context, 'detail').replace(/detail\/.*$/, "detail/");

        return (
                <div>
                    <Card>
                        <Card.Primary>
                            <Card.Title>
                                Algorithm:&nbsp;
                                <Select
                                    hintText={"Select algorithm"}
                                    selectedIndex={algorithmSelectIndex}
                                    onChange={(e) => changeAlgorithmPreview(e.selectedIndex)}
                                    style={{width:"300px"}}
                                >
                                {
                                   algorithms.map((item) => (<Select.Item>{item.name}</Select.Item>))
                                }
                            </Select>
                            {
                                removeAlgorithmPreview &&  // null value for the last slot without remove cross
                                <Icon onClick={(e) => removeAlgorithmPreview(e.selectedIndex)}>close</Icon>
                            }
                            </Card.Title>
                        </Card.Primary>
                        <Card.SupportingText>
                            { !algorithmPreviewData || algorithmPreviewData.loadingStatus == 'loading' && <div>
                                    Loading ...
                                </div>
                            }
                            { algorithmPreviewData && algorithmPreviewData.loadingStatus == 'loaded' &&
                                <div class={style.algorithmPreviewContainer}>
                                    {
                                        algorithmPreviewData.items.map( (currentItem, index) => (
                                            <div class={style.algorithmPreviewItem}>
                                                <a href={urlPrefix + currentItem.itemGroupID }>
                                                    <img src={currentItem.imageLink} class={style.algorithmPreviewItemImage}/>
                                                    <div>{currentItem.title}</div>
                                                </a>
                                                <div><span class={style.label}>categoryID:</span> {
                                                    currentItem.categoryID +
                                                    ((currentItem.category || currentItem.categoryName) ? ' / ' + (currentItem.category || currentItem.categoryName) : '')
                                                }</div>
                                                <div><span class={style.label}>productType:</span> {currentItem.productType}</div>
                                                <div><span class={style.label}>brand:</span> {currentItem.brand}</div>
                                                <div><span class={style.label}>price:</span> {currentItem.price}</div>
                                            </div>
                                        ))
                                    }
                                </div>
                            }
                        </Card.SupportingText>
                    </Card>
                </div>
        );
    }
}
