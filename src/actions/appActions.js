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
        return null;
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
                if (context.accountIndex == null) {
                    context.accountIndex = 0;
                    context.accountID = accounts[0].id;
                }
            }
            store.updateState({
                accounts,
                context
            });
            if (context.accountID) {
                loadMetaDataTables();
                loadSearchResultsWidgetTemplate();
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


    return {
        loadAccounts: loadAccounts,
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
        setAccountAction(index) {
            const { context, accounts } = store.getState();
            context.accountID = accounts[index].id;
            context.accountIndex = index;
            store.updateState({
                context: context,
                metadata: {}
            });
            loadMetaDataTables();
            loadSearchResultsWidgetTemplate();

            route(getURLfromState(context));
        },
        setEnvironmentAction(index) {
            const { context, environments } = store.getState();
            context.environmentID = environments[index].id;
            context.environmentIndex = index;
            context.tableID = null;
            context.tableIndex = null;
            store.updateState({
                context: context,
                metadata: {},
                tables: []
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
