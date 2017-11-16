import { h, Component } from 'preact';
import { Router } from 'preact-router';
import AsyncRoute from 'preact-async-route';

import Header from './header';
import PersooClient from './persooClient';
import Login from '../routes/login';
import SearchResults from '../routes/searchResults';
import Detail from '../routes/detail';
import Profile from '../routes/profile';
import Debug from '../routes/debug';
import Redirect from '../routes/redirect';


import { getInitialState, createAppStore } from '../store/appStore';
import { createAppActions } from '../actions/appActions';
import { getURLfromState } from '../utils/urlUtils';

/*
   TODO plan

       * on App Init -- get state from URL + check URL not changed
       * Finish: global endpoints config for all clouds

*/


export default class App extends Component {
    constructor(args) {
        super(args);

        // Note: we need different store for each "autocomplete" instance in a page
        this.store = createAppStore(getInitialState(args.options || {}));
        this.unsubcribe = this.store.subscribe(this._updateLocalStateFromStore.bind(this));
        this.setState(this.store.getState());

        // can be moved to on ComponentWillMount
        this.actions = createAppActions(this.store);

        /* main */
        this.actions.loadAccounts();

        // to be able to call "preact-router" directly from my EJS tempates.
        window.paGlobalRouteFunction = Router.route;
    }

    _updateLocalStateFromStore() {
        this.setState(this.store.getState());
    }

    /** Gets fired when the route changes.
     *    @param {Object} event        "change" event from [preact-router](http://git.io/preact-router)
     *    @param {string} event.url    The newly routed URL
     */
    handleRoute = e => {
        console.log('Changing Route to:' + e.url);
        this.currentUrl = e.url;
        if (this.store) {
            const pageType = e.current.attributes.pageType
            const url = e.url;
            const { context } = this.store.getState();
            context.pageType = pageType;
            if (pageType == 'detail') {
                context.itemID = e.current.attributes.matches.itemID;
            }
            this.store.updateState({url, context});
        }
    };

    getProfile() {
        return new Promise(resolve=>{
            setTimeout(()=>{
                resolve(() => <div>LOADED</div>);
            },2000);
        });
    }
    render() {
        let { context, accounts, environments, tables, metadata } = this.state;

        let logState = {
            cloudID: context.cloudID,
            accountID: context.accountID,
            environmentID: context.environmentID,
            tableID: context.tableID
        };
        console.log('Render App: ' + JSON.stringify(logState));

        const searchResultsOfferTemplate = this.state.searchResultsOfferTemplate;
        const searchResultsURL = getURLfromState(context, 'list');
        return (
            <div id="app">
                <PersooClient context={context} />
                {
                    context.accountsLoaded &&
                     <Header
                        context={context}
                        accounts={accounts}
                        environments={environments}
                        tables={tables}
                        actions={this.actions}
                        searchResultsURL={searchResultsURL}
                    />
                }
                <Router onChange={this.handleRoute.bind(this)}>
                    <Redirect path="/" to={searchResultsURL} />
                    <Login path="/login" cloudID={context.cloudID} pageType="login" />
                    <Profile path="/profile/" user="me" pageType='profile' />
                    <Profile path="/profile/:user" pageType='profile' />
                    <AsyncRoute
                        path="/detail/:itemID"
                        getComponent={this.getProfile}
                    />
                    <SearchResults path="/:accountID/:env/:adsTable/list" pageType="list"
                        context={context}
                        metadata={metadata}
                        searchResultsOfferTemplate={searchResultsOfferTemplate}
                    />
                    <Detail path="/:accountID/:env/:adsTable/detail/:itemID?" pageType="detail"
                        context={context}
                    />
                    <Debug default pageType="404"
                        accountsLoaded={context.accountsLoaded} />
                </Router>
            </div>
        );
    }
}
