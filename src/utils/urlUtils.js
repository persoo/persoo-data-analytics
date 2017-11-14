export function getSearchResultsURL(context) {
    const searchResultsURL = ['', context.accountID, context.environmentID, context.tableID, 'list']
            .map( (a) => (a == null ? 'null' : a) )
            .join('/');
    return searchResultsURL;
}
