import { Router, route } from 'preact-router';
import { getSearchResultsURL } from '../utils/urlUtils';
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
            var context = store.getState().context;
            context.accountsLoaded = true;
            context.accounts = response.body;
            if (response.body.length > 0) {
                context.accountIndex = 0;
                context.accountID = response.body[0].id;
            }
            store.updateState({context: context});
            if (context.accountID) {
                loadMetaDataTables();
                loadSearchResultsWidgetTemplate();

                route(getSearchResultsURL(context));
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
            context.tables = response.body.map((str) => ({id: str, name: str}));
            if (context.tables.length <= 0) {
                console.log('TODO handle case, when "tables==[]".');
            }
            /* set "ads.products" as default if exists */
            let tableID = 'ads.products';
            context.tableIndex = _findIndexByID(context.tables, tableID);
            context.tableID = tableID;

            store.updateState({context:context});
            loadMetaDataVariableForTable();
            route(getSearchResultsURL(context));
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
            var context = store.getState().context;
            if (context.accountID !== accountID ||
                context.environmentID !== environmentID ||
                context.tableID !== tableID) {

                context.accountID = accountID;
                context.accountIndex = _findIndexByID(context.accounts, accountID);
                context.environmentID = environmentID;
                context.environmentIndex = _findIndexByID(context.environments, environmentID);
                context.tableID = tableID;
                context.tableIndex = _findIndexByID(context.tables, tableID);
                store.updateState({context: context});
            }
        },
        setAccountAction(index) {
            var context = store.getState().context;
            context.accountID = context.accounts[index].id;
            context.accountIndex = index;
            store.updateState({
                context: context,
                metadata: {}
            });
            loadMetaDataTables();
            loadSearchResultsWidgetTemplate();

            route(getSearchResultsURL(context));
        },
        setEnvironmentAction(index) {
            var context = store.getState().context;
            context.environmentID = context.environments[index].id;
            context.environmentIndex = index;

            context.tables = [];
            context.tableID = null;
            context.tableIndex = null;
            store.updateState({
                context: context,
                metadata: {}
            });
            loadMetaDataTables();

            route(getSearchResultsURL(context));
        },
        setTableAction(index) {
            var context = store.getState().context;
            context.tableID = context.tables[index].id;
            context.tableIndex = index;
            store.updateState({context: context});
            loadMetaDataVariableForTable();

            route(getSearchResultsURL(context));
        }
    };
}
