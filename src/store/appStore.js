import createStore from './createStore';


export function getInitialState(options) {
    const state = {
        options: null,
        context: {
            cloudID: "test-a",

            environmentID: "p",
            environmentIndex: 0,
            environments: [
                {id: "p", name: "production             ."},
                {id: "test", name: "test             ."}
            ],

            accountID: null,
            accountIndex: null,
            accounts: [],
            accountsLoaded: false,

            tableID: null,
            tableIndex: null,
            tables: [],
            tablesLoaded: false
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
