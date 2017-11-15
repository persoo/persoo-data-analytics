import { h, Component } from 'preact';
import { route } from 'preact-router';
import cloudConfig from '../../cloudConfig';

/*
    Load Persoo JS client
    and maintain it updated for currently selected account.

    Load Persoo only when accountID/apikey is known,
    otherwise persoo.js will not exist on CDN for the account.
*/
export default class PersooClient extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoaded: false,
            loadedAccountID: null
        };
    }
    _initPersooClient(cloudID, accountID) {
        window.persooConfig = {
            apikey: accountID, // variable from globalConfig.js
            persooName: 'persoo',
            dataLayerName: 'dataLayer', // we recommend to share dataLayer with GTM to measure new events to all systems
            scriptsHostname: cloudConfig.clouds[cloudID].scriptsEndpoint,
            rtpHostname: cloudConfig.clouds[cloudID].rtpAPIEndpoint,
            settings_tolerance: 0,  // for loading persoo.js
            personalizations_tolerance: 2500,    // for showing personalizations
        };

        /*! Persoo js client 2015-03-16 */
        var persooLoader=function(a,b,c,d,e){var f=d.persooName,g='_persoo_hide_body';return{hideBody:
        function(){var b=a.createElement('style'),c='body{opacity:0 !important;filter:alpha(opacity=0)'
        +' !important;background:none !important;}',d=a.getElementsByTagName('head')[0];b.setAttribute(
        'id',g),b.setAttribute('type','text/css'),b.styleSheet?b.styleSheet.cssText=c:b.appendChild(
        a.createTextNode(c)),d.appendChild(b)},finish:function(){if(!c){c=!0;var b=a.getElementById(g);b&&
        b.parentNode.removeChild(b)}},loadScript:function(b){var c=a.createElement('script');c.src=b,c.type
        ='text/javascript',c.onerror=function(){persooLoader.finish()},a.getElementsByTagName('head')[0
        ].appendChild(c)},init:function(){b[f]=b[f]||function(){(b[f].q=b[f].q||[]).push([].slice.call(
        arguments))},b[f].l=1*new Date,b[f].apikey=d.apikey,b[f].dataLayerName=d.dataLayerName;var c=
        a.cookie.match('(^|; )'+e+'=([^;]*)'),g=location.search.match('[?&]'+e+'=([^&]*)'),h=g?g[1]:c?c[2]:
        'p';d.settings_tolerance>0&&(setTimeout(this.finish,d.settings_tolerance),this.hideBody());var i=(
        d.scriptsHostname||'http://scripts.persoo.cz/')+d.apikey+'/'+h;this.loadScript(i+'/actions.js'),
        this.loadScript(i+'/persoo.js')}}}(document,window,!1,persooConfig,'persooEnvironment');persooLoader.init();

        persoo.ignoreDefaultSendPageview = true;
    }

    componentWillReceiveProps(nextProps) {
        const {context} = nextProps;
        if (!this.state.isLoaded && context.accountID != null) {
            console.log('Loading Persoo client for account ' + context.accountID);
            this._initPersooClient(context.cloudID, context.accountID);
            this.setState({
                isLoaded: true,
                loadedAccountID: context.accountID
            });
        } else if (context.accountID != this.state.loadedAccountID) {
            console.log('Reloading Persoo client from account ' + this.state.loadedAccountID + ' to account ' + context.accountID);
            window.persooConfig.apikey = context.accountID;
            window.persoo.apikey = context.accountID; // FIX this in persoo clinet
            this.setState({
                loadedAccountID: context.accountID
            });
            window.persoo.reloadPersoo(document, window);
        }
    }

    render(props) {
        return null;
    }
}
