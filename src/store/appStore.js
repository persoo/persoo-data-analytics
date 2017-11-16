import createStore from './createStore';


export function getInitialState(options) {
    const state = {
        options: null,
        accounts: [],
        environments: [
            {id: "p", name: "production             ."},
            {id: "test", name: "test             ."}
        ],
        tables: [],
        context: {
            cloudID: "test-a",

            environmentID: "p",
            environmentIndex: 0,

            accountID: null,
            accountIndex: null,
            accountsLoaded: false,

            tableID: null,
            tableIndex: null,
            tablesLoaded: false,

            pageType: 'list',

            itemID: null
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
