export function getURLfromState(context, pageType) {
    let resultURL = ['', context.accountID, context.environmentID, context.tableID, pageType || context.pageType]
            .map( (a) => (a == null ? 'null' : a) )
            .join('/');
    if (context.itemID && (context.pageType) == 'detail' && (!pageType || pageType == 'detail')) {
        resultURL += '/' + context.itemID;
    }
    return resultURL;
}

function parseIDorNull(str) {
    return str == 'null' ? null : str;
}

export function parseURLToContext() {
    const url = document.location.pathname;
    let contextIncrement = {};
    let urlParts = url.split('/');
    if (urlParts.length >= 5) {
        contextIncrement = {
            accountID: parseIDorNull(urlParts[1]),
            environmentID: parseIDorNull(urlParts[2]),
            tableID: parseIDorNull(urlParts[3]),
            pageType: parseIDorNull(urlParts[4])
        }
    }
    if (urlParts.length >= 6) {
        contextIncrement.itemID = urlParts[5];
    }
    return contextIncrement;
}
