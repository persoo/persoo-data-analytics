export function getURLfromState(context, pageType) {
    let resultURL = ['', context.accountID, context.environmentID, context.tableID, pageType || context.pageType]
            .map( (a) => (a == null ? 'null' : a) )
            .join('/');
    if (context.itemID && (context.pageType) == 'detail' && (!pageType || pageType == 'detail')) {
        resultURL += '/' + context.itemID;
    }
    return resultURL;
}

export function parseURLToContext() {
    const url = document.location.pathname;
    let contextIncrement = {};
    let urlParts = url.split('/');
    if (urlParts.length >= 5) {
        contextIncrement = {
            accountID: urlParts[1],
            environmentID: urlParts[2],
            tableID: urlParts[3],
            pageType: urlParts[4]
        }
    }
    if (urlParts.length >= 6) {
        contextIncrement.itemID = urlParts[5];
    }
    return contextIncrement;
}
