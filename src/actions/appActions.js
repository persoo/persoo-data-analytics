import { Router, route } from 'preact-router';
import { getURLfromState, parseURLToContext } from '../utils/urlUtils';
import jsonFetch from 'json-fetch';
import cloudConfig from '../cloudConfig';

export function createAppActions(store) {
    function _handleAPIError(err) {
        console.log('API call caused error:');
        console.log(err.name);
        console.log(err.message);
        console.log(err.response.body);

        askForLogin();
    }
    function _findIndexByID(list, id) {
        for (let i = 0; i < list.length; i++) {
            if (list[i].id == id) {
                return i;
            }
        }
        return -1;
    }

    function askForLogin() {
        console.log('Please, login first.');
        Router.route('/login');
    }

    function loadAccounts() {
        let cloudID = store.getState().context.cloudID;

        jsonFetch( cloudConfig.clouds[cloudID].adminAPIEndpoint + '/accounts', {
            method: 'GET',
            // body: {},
            expectedStatuses: [200],
        })
        .then((response) => {
            let context = store.getState().context;
            Object.assign(context, parseURLToContext());

            context.accountsLoaded = true;
            const accounts = response.body;
            if (response.body.length > 0) {
                /* guess selected accountID from URL */
                context.accountIndex = _findIndexByID(accounts, context.accountID);
            }
            store.updateState({
                accounts,
                context
            });
            if (context.accountID) {
                loadMetaDataTables();
                loadSearchResultsWidgetTemplate();
                loadAlgorithms();
            }
        })
        .catch(_handleAPIError);
    }
    function loadMetaDataTables() {
        let state = store.getState();
        let cloudID = state.context.cloudID;
        let accountID = state.context.accountID;
        let envID = state.context.environmentID;

        if (accountID == null || envID == null) {
            console.log('Action: loadMetaDataTables(): cannot load tables for acccount "null"');
            return;
        }

        jsonFetch( cloudConfig.clouds[cloudID].adminAPIEndpoint + '/accounts/' + accountID + '/metadata?environment=' + envID, {
            method: 'GET',
            // body: {},
            expectedStatuses: [200],
        })
        .then((response) => {
            let context = store.getState().context;

            context.tablesLoaded = true;
            let tables = response.body
                .filter((str) => (str.match(/ads\./)))
                .map((str) => ({id: str, name: str}));
            if (tables.length <= 0) {
                console.log('TODO handle case, when "tables==[]".');
            }
            /* set "ads.products" as default if exists */
            let tableID = 'ads.products';
            context.tableIndex = _findIndexByID(tables, tableID);
            context.tableID = tableID;

            store.updateState({
                context,
                tables
            });
            loadMetaDataVariableForTable();
            route(getURLfromState(context));
        })
        .catch(_handleAPIError);
    }
    function loadMetaDataVariableForTable() {
        var state = store.getState();
        let cloudID = state.context.cloudID;
        var accountID = state.context.accountID;
        var envID = state.context.environmentID;
        var tableID = state.context.tableID;

        jsonFetch( cloudConfig.clouds[cloudID].adminAPIEndpoint + '/accounts/' + accountID + '/metadata/' + tableID + '/listVariables?environment=' + envID, {
            method: 'GET',
            // body: {},
            expectedStatuses: [200],
        })
        .then((response) => {
            var metadata = store.getState().metadata;
            metadata[tableID] = response.body;
            store.updateState({metadata:metadata});
        })
        .catch(_handleAPIError);
    }
    function loadSearchResultsWidgetTemplate() {
        var state = store.getState();
        let cloudID = state.context.cloudID;
        var accountID = state.context.accountID;
        var envID = state.context.environmentID;

        /* System template always exists and are the same for all accounts. We read them form API, so we need not to maintain
           template bugfixes in this app.   */
        jsonFetch( cloudConfig.clouds[cloudID].adminAPIEndpoint + '/accounts/' + accountID + '/templates/searchResultsV1', {
            method: 'GET',
            // body: {},
            expectedStatuses: [200],
        })
        .then((response) => {
            store.updateState({searchResultsOfferTemplate: response.body});
        })
        .catch(_handleAPIError);
    }
    function loadDetailItem(itemID) {
        console.log('Load detail itemID ' + itemID);
        var state = store.getState();
        let cloudID = state.context.cloudID;
        var accountID = state.context.accountID;
        var envID = state.context.environmentID;
        var tableID = state.context.tableID;
        if (tableID) {
            var adsTableID = tableID.replace(/ads./,'');

            store.updateState({
                currentItemLoading: itemID
            });
            jsonFetch( 'https://' + cloudConfig.clouds[cloudID].rtpAPIEndpoint + '/' + accountID + '/' + envID + '/workflow.json' +
                '?_e=getRecommendation&_vid=AAABXGgkcSIz5pScemhlisdj&_v=%220.1.0%22&_a=persooAnalytics' +
                '&algorithmID=%22' + adsTableID + 'DebugAlgorithm%22&itemGroupID=%22' + itemID + '%22' +
                '&boolQuery=' + encodeURIComponent(JSON.stringify({
                    must:[
                        {
                            type:"customRule",
                            fields: ["itemGroupID", "$eq", "value", "\"" + itemID + "\""]
                        }
                    ]
                })),
                {
                    method: 'GET',
                    expectedStatuses: [200],
                }
            )
            .then((response) => {
                if (response.body.data && response.body.data.items && response.body.data.items.length > 0) {
                    store.updateState({
                        currentItem: response.body.data.items[0],
                        currentItemLoaded: itemID
                    });
                } else {
                    console.log('Cannot load item ' + itemID + ' - server did not return correct data structures.');
                    store.updateState({
                        currentItem: {
                            title: 'Item "'+ itemID + '" not found'
                        },
                        currentItemLoaded: itemID
                    });
                }
            })
            .catch(_handleAPIError);
        }
    }
    function loadAlgorithms() {
        var state = store.getState();
        let cloudID = state.context.cloudID;
        var accountID = state.context.accountID;
        var envID = state.context.environmentID;

        jsonFetch( cloudConfig.clouds[cloudID].adminAPIEndpoint + '/accounts/' + accountID + '/algorithms', {
            method: 'GET',
            // body: {},
            expectedStatuses: [200],
        })
        .then((response) => {
            var algorithms = response.body;
            store.updateState({algorithms: algorithms});
        })
        .catch(_handleAPIError);
    }

    function loadAlgorithmPreviewForDetailItem(previewIndex, algorithmID, itemID) {
        console.log('Load algorithm preview for detail itemID ' + itemID);
        var state = store.getState();
        const algorithms = state.algorithms;
        const cloudID = state.context.cloudID;
        const accountID = state.context.accountID;
        const envID = state.context.environmentID;
        const tableID = state.context.tableID;
        if (tableID) {
            const adsTableID = tableID.replace(/ads./,'');

            let { algorithmPreviews } = store.getState();
            algorithmPreviews[algorithmID] = {
                items: [],
                loadingStatus: 'loading',
                algorithmIndex: _findIndexByID(algorithms, algorithmID)
            };
            store.updateState({ algorithmPreviews });

            jsonFetch( 'https://' + cloudConfig.clouds[cloudID].rtpAPIEndpoint + '/' + accountID + '/' + envID + '/workflow.json' +
                '?_e=getRecommendation&_vid=AAABXGgkcSIz5pScemhlisdj&_v=%220.1.0%22&_a=persooAnalytics' +
                '&algorithmID=%22' + algorithmID + '%22&itemGroupID=%22' + itemID + '%22',
                {
                    method: 'GET',
                    expectedStatuses: [200],
                }
            )
            .then((response) => {
                if (response.body.data && response.body.data.items && response.body.data.items.length > 0) {
                    let { algorithmPreviews } = store.getState();
                    algorithmPreviews[algorithmID].items = response.body.data.items;
                    algorithmPreviews[algorithmID].loadingStatus = 'loaded';
                    store.updateState({ algorithmPreviews });
                } else {
                    console.log('Cannot load item ' + itemID + ' - server did not return correct data structures.');
                    let { algorithmPreviews } = store.getState();
                    algorithmPreviews[algorithmID].items = [{title: 'algorithm returns no data'}];
                    algorithmPreviews[algorithmID].loadingStatus = 'loaded';
                    store.updateState({ algorithmPreviews });
                }
            })
            .catch(_handleAPIError);
        }
    }
    function loadAlgorithmPreviews(itemID) {
        const { algorithmPreviews, context, algorithms } = store.getState();
        const { selectedAlgorithmIDs } = context;
        if (algorithms && algorithms.length > 0) {
            selectedAlgorithmIDs.map( (algorithmID, slotIndex) => {
                loadAlgorithmPreviewForDetailItem(slotIndex, algorithmID, itemID);
            })
        } else { // try it again, if algorithms metadata not loaded yet.
            setTimeout(loadAlgorithmPreviews.bind(this, itemID), 500);
        }
    }
    function changeAlgorithmInSlot(slot, algorithmIndex) {
        const { algorithmPreviews, context, algorithms } = store.getState();
        const { selectedAlgorithmIDs } = context;
        const oldAlgorithmID = selectedAlgorithmIDs[slot];
        const newAlgorithmID = algorithms[algorithmIndex].id;
        if (slot < selectedAlgorithmIDs.length) {
            selectedAlgorithmIDs[slot] = newAlgorithmID;
        } else {
            slot = selectedAlgorithmIDs.length;
            selectedAlgorithmIDs.push(newAlgorithmID);
        }
        delete algorithmPreviews[oldAlgorithmID];
        store.updateState({ algorithmPreviews, context });
        loadAlgorithmPreviewForDetailItem(slot, newAlgorithmID, context.itemID);
    }
    function removeAlgorithmInSlot(slot, algorithmIndex) {
        const { algorithmPreviews, context, algorithms } = store.getState();
        const { selectedAlgorithmIDs } = context;
        const oldAlgorithmID = selectedAlgorithmIDs[slot];
        delete algorithmPreviews[oldAlgorithmID];
        context.selectedAlgorithmIDs.splice(slot, 1);
        store.updateState({ algorithmPreviews, context });
    }

    return {
        loadAccounts: loadAccounts,
        loadDetailItem: loadDetailItem,
        loadAlgorithmPreviews: loadAlgorithmPreviews,
        changeAlgorithmInSlot: changeAlgorithmInSlot,
        removeAlgorithmInSlot: removeAlgorithmInSlot,
        updateContextFromURL(accountID, environmentID, tableID) {
            const { context, accounts, environments, tables } = store.getState();
            if (context.accountID !== accountID ||
                context.environmentID !== environmentID ||
                context.tableID !== tableID) {

                context.accountID = accountID;
                context.accountIndex = _findIndexByID(accounts, accountID);
                context.environmentID = environmentID;
                context.environmentIndex = _findIndexByID(environments, environmentID);
                context.tableID = tableID;
                context.tableIndex = _findIndexByID(tables, tableID);
                store.updateState({context});
            }
        },
        setCloudAction(index) {
            const { context, clouds } = store.getState();
            context.cloudID = clouds[index].id;
            context.cloudIndex = index;
            store.updateState({
                context: context,
                metadata: {},
                accounts: [],
                tables: [],
                algorithms:[]
            });
            loadAccounts();
        },
        setAccountAction(index) {
            const { context, accounts } = store.getState();
            context.accountID = accounts[index].id;
            context.accountIndex = index;
            context.tableID = null;
            context.tableIndex = -1;
            store.updateState({
                context: context,
                metadata: {},
                tables: [],
                algorithms:[]
            });
            loadMetaDataTables();
            loadSearchResultsWidgetTemplate();
            loadAlgorithms();

            route(getURLfromState(context));
        },
        setEnvironmentAction(index) {
            const { context, environments } = store.getState();
            context.environmentID = environments[index].id;
            context.environmentIndex = index;
            context.tableID = null;
            context.tableIndex = -1;
            store.updateState({
                context: context,
                metadata: {},
                tables: [],
                algorithms:[]
            });
            loadMetaDataTables();

            route(getURLfromState(context));
        },
        setTableAction(index) {
            var { context, tables } = store.getState();
            context.tableID = tables[index].id;
            context.tableIndex = index;
            store.updateState({context});
            loadMetaDataVariableForTable();

            route(getURLfromState(context));
        }
    };
}
