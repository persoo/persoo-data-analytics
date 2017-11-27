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
            let accounts = response.body;
            accounts.sort(function(a,b) {
                var x = a.name.toLowerCase();
                var y = b.name.toLowerCase();
                return x < y ? -1 : x > y ? 1 : 0;
            });
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
                loadScenarios();
            }
        })
        .catch(_handleAPIError);
    }
    function loadMetaDataTables() {
        const { cloudID, accountID, environmentID } = store.getState().context;

        if (accountID == null || environmentID == null) {
            console.log('Action: loadMetaDataTables(): cannot load tables for acccount "null"');
            return;
        }

        jsonFetch( cloudConfig.clouds[cloudID].adminAPIEndpoint + '/accounts/' + accountID + '/metadata?environment=' + environmentID, {
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
        const { cloudID, accountID, environmentID, tableID } = store.getState().context;

        jsonFetch( cloudConfig.clouds[cloudID].adminAPIEndpoint + '/accounts/' + accountID + '/metadata/' + tableID + '/listVariables?environment=' + environmentID, {
            method: 'GET',
            // body: {},
            expectedStatuses: [200],
        })
        .then((response) => {
            let { algorithms, scenarios, metadata, currentItem } = store.getState();
            const metaVariables = response.body;
            metadata[tableID] = metaVariables;
            algorithms = _addFakeAlgorithmsFromMetadata(algorithms, scenarios, metaVariables, currentItem);
            store.updateState({metadata, algorithms});
        })
        .catch(_handleAPIError);
    }
    function loadSearchResultsWidgetTemplate() {
        const { cloudID, accountID, environmentID } = store.getState().context;

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
        const { cloudID, browserID, accountID, environmentID, tableID } = store.getState().context;

        if (tableID) {
            var adsTableID = tableID.replace(/ads./,'');

            store.updateState({
                currentItemLoading: itemID
            });
            jsonFetch( 'https://' + cloudConfig.clouds[cloudID].rtpAPIEndpoint + '/' + accountID + '/' + environmentID + '/workflow.json' +
                '?_e=getRecommendation&_vid=%22' + browserID + '%22&_v=%220.1.0%22&_a=persooAnalytics' +
                '&algorithmID=%22' + adsTableID + 'DebugAlgorithm%22&itemGroupID=%22' + itemID + '%22' +
                '&boolQuery=' + encodeURIComponent(JSON.stringify({
                    must:[
                        {
                            type:"customRule",
                            fields: ["itemGroupID", "$eq", "value", JSON.stringify(itemID.toString())]
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
                    let currentItem = response.body.data.items[0];
                    const { algorithms, scenarios, metadata, context } = store.getState();
                    const metaVariables = metadata && metadata[context.tableID];
                    let enrichedAlgorithms = _addFakeAlgorithmsFromMetadata(algorithms, scenarios, metaVariables, currentItem);
                    store.updateState({
                        algorithms: enrichedAlgorithms,
                        currentItem: currentItem,
                        currentItemLoaded: itemID
                    });
                    loadAlgorithmPreviews(itemID);
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
        const { cloudID, accountID, environmentID } = store.getState().context;

        jsonFetch( cloudConfig.clouds[cloudID].adminAPIEndpoint + '/accounts/' + accountID + '/algorithms', {
            method: 'GET',
            // body: {},
            expectedStatuses: [200],
        })
        .then((response) => {
            let algorithms = response.body;
            const { scenarios, metadata, context, currentItem } = store.getState();
            const metaVariables = metadata[context.tableID];
            algorithms = _addFakeAlgorithmsFromMetadata(algorithms, scenarios, metaVariables, currentItem);
            store.updateState({algorithms: algorithms});
        })
        .catch(_handleAPIError);
    }

    function loadScenarios() {
        const { cloudID, accountID, environmentID } = store.getState().context;

        jsonFetch( cloudConfig.clouds[cloudID].adminAPIEndpoint + '/accounts/' + accountID + '/scenarios', {
            method: 'GET',
            // body: {},
            expectedStatuses: [200],
        })
        .then((response) => {
            let scenarios = response.body;
            const { algorithms, metadata, context, currentItem } = store.getState();
            const metaVariables = metadata[context.tableID];
            let enrichedAlgorithms = _addFakeAlgorithmsFromMetadata(algorithms, scenarios, metaVariables, currentItem);
            store.updateState({algorithms: enrichedAlgorithms, scenarios: scenarios});
        })
        .catch(_handleAPIError);
    }

    function _addFakeAlgorithmsFromMetadata(algorithms, scenarios, metaVariables, currentItem) {
        if (algorithms && currentItem && metaVariables) {
            console.log('Updating algorithms');

            // remove old fakes and scenarios
            algorithms = algorithms.filter( alg => (alg.class != "fieldPreview" && alg.class != "scenario"));

            // add prefixes to algorithms
            algorithms.map( algorithm => {
                if (!algorithm.name.match(/^Algorithm/)) {
                    algorithm.name = 'Algorithm: ' + algorithm.name;
                }
            });

            // add scenarios
            const scenarioIDs = Object.keys(scenarios);
            scenarios.map (scenario => {
                algorithms.push({
                    class: "scenario",
                    name: "Scenario: " + scenario.name,
                    id: "scenario_" + scenario.id
                });
            });

            // add new fake algorithms
            const variableIDs = Object.keys(metaVariables);
            variableIDs.map( variableID => {
                const variable = metaVariables[variableID];
                if (variable.type == 'productList' || variableID.match(/^also/)) {
                    algorithms.push({
                        class: "fieldPreview",
                        name: "Preview for field: " + variable.name,
                        id: "fakeAlgFor" + variableID,
                        config: {
                            must: [
                                {
                                    type:"customRule",
                                    fields: ["itemGroupID", "$in", "value", JSON.stringify(currentItem[variableID])]
                                }
                            ],
                            mustNot: [],
                            should: []
                        }
                    });
                    algorithms.push({
                        class: "fieldPreview",
                        name: "preview for field: " + variable.name + " | the same brand",
                        id: "fakeAlgFor" + variableID + "SameBrand",
                        config: {
                            must: [
                                {
                                    type:"customRule",
                                    fields: ["itemGroupID", "$in", "value", JSON.stringify(currentItem[variableID])]
                                },
                                {
                                    type:"customRule",
                                    fields: ["brand", "$eq", "value", JSON.stringify(currentItem.brand)]
                                }
                            ],
                            mustNot: [],
                            should: []
                        }
                    });
                    algorithms.push({
                        class: "fieldPreview",
                        name: "preview for field: " + variable.name + " | the same productType",
                        id: "fakeAlgFor" + variableID + "SameProductType",
                        config: {
                            must: [
                                {
                                    type:"customRule",
                                    fields: ["itemGroupID", "$in", "value", JSON.stringify(currentItem[variableID])]
                                },
                                {
                                    type:"customRule",
                                    fields: ["productType", "$eq", "value", JSON.stringify(currentItem.productType)]
                                }
                            ],
                            mustNot: [],
                            should: []
                        }
                    });
                }
            });
        }
        return algorithms;
    }

    function loadAlgorithmPreviewForDetailItem(previewIndex, algorithmID, itemID) {
        console.log('Load algorithm preview for detail itemID ' + itemID);
        var state = store.getState();
        const algorithms = state.algorithms;
        const algorithm = algorithms && algorithms[_findIndexByID(algorithms, algorithmID)];
        const { cloudID, browserID, accountID, environmentID, tableID } = state.context;

        if (tableID) {
            const adsTableID = tableID.replace(/ads./,'');

            let { algorithmPreviews } = store.getState();
            algorithmPreviews[algorithmID] = {
                items: [],
                loadingStatus: 'loading',
                algorithmIndex: _findIndexByID(algorithms, algorithmID)
            };
            store.updateState({ algorithmPreviews });

            let promise;
            let queryAlgorithmID = algorithmID;
            if (algorithm && algorithm.class == "scenario") {
                queryAlgorithmID = algorithmID.replace(/^scenario_/, '');
                promise = jsonFetch( 'https://' + cloudConfig.clouds[cloudID].rtpAPIEndpoint + '/' + accountID + '/' + environmentID + '/workflow.json' +
                    '?_e=getScenario&_vid=%22' + browserID + '%22&_v=%220.1.0%22&_debug=1&_a=persooAnalytics' +
                    '&scenarioID=%22' + queryAlgorithmID + '%22&itemGroupID=%22' + itemID + '%22',
                    {
                        method: 'GET',
                        expectedStatuses: [200],
                    }
                );
            } else {
                // prepare request changes for "preview fields algorithms"
                let boolQueryParam = "";
                if (algorithm && algorithm.class == "fieldPreview") {
                    queryAlgorithmID = 'productsDebugAlgorithm';
                    boolQueryParam = '&boolQuery=' + encodeURIComponent(JSON.stringify(algorithm.config));
                }

                promise = jsonFetch( 'https://' + cloudConfig.clouds[cloudID].rtpAPIEndpoint + '/' + accountID + '/' + environmentID + '/workflow.json' +
                    '?_e=getRecommendation&_vid=%22' + browserID + '%22&_v=%220.1.0%22&_debug=1&_a=persooAnalytics' +
                    '&algorithmID=%22' + queryAlgorithmID + '%22&itemGroupID=%22' + itemID + '%22' + boolQueryParam,
                    {
                        method: 'GET',
                        expectedStatuses: [200],
                    }
                );
            }
            promise.then((response) => {
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
        const { algorithmPreviews, context, algorithms, scenarios, metadata } = store.getState();
        const { selectedAlgorithmIDs, tableID } = context;
        const metaVariables = metadata && metadata[tableID];
        if (metaVariables && algorithms && algorithms.length > 0 && scenarios && scenarios.length > 0) {
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
            loadScenarios();

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
