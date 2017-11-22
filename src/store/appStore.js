import createStore from './createStore';
import cloudConfig from '../cloudConfig';

function getClouds() {
    var cloudIDs = Object.keys(cloudConfig.clouds);
    return cloudIDs.map( (cloudID) => ({id: cloudID, name: cloudID}));
}

export function getInitialState(options) {
    const state = {
        options: null,
        clouds: getClouds(),
        accounts: [],
        environments: [
            {id: "p", name: "production             ."},
            {id: "test", name: "test             ."}
        ],
        tables: [],
        context: {
            cloudID: getClouds()[0].id,
            cloudIndex: 0,

            environmentID: "p",
            environmentIndex: 0,

            accountID: null,
            accountIndex: null,
            accountsLoaded: false,

            tableID: null,
            tableIndex: null,
            tablesLoaded: false,

            pageType: 'list',

            itemID: null,
            selectedAlgorithmIDs: options.selectedAlgorithmIDs || [] // do show cards for each algorithm on product detail
        },
        algorithms: [],
        algorithmPreviews: {
            // algorithmID: {
            //     items: []
            //     loadingStatus:
            //     context: {itemID, categoryID,...}
            // }
        },
        metadata: {}
    };

    return state;
}

// Note: we need to create independent store for each instance of autocomplete in a page
export function createAppStore(initialState) {

    // general store provides methods
    //     getState(),
    //     setState(nextState),
    //     updateState(increment),
    //     subscribe(listenerFunc)
    let store = createStore(initialState);

    /* custom methods working with store */
    return Object.assign(store, {

        hasItems() { // in any dataset
            let hasItems = false;
            store.getState().datasets.forEach(
                    dataset => {if (dataset.items && dataset.items.length > 0) {hasItems = true;}}
            );
            return hasItems;
        }
    });
}
