

export default {
    clouds: {
        'production': {
            rtpAPIEndpoint: 'rtp.persoo.cz',
            adminAPIEndpoint: 'https://adminapi.persoo.cz',
            scriptsEndpoint: 'https://scripts.persoo.cz/',
            adminEndpoint: 'https://admin.persoo.cz'
        },
        'test-a': {
            rtpAPIEndpoint: 'rtp-test-a.persoo.cz',
            adminAPIEndpoint: 'https://adminapi-test-a.persoo.cz',
            scriptsEndpoint: 'https://s3-eu-west-1.amazonaws.com/cz.persoo.test-a.javascripts/',
            adminEndpoint: 'https://admin-test-a.persoo.cz'
        }
    }
};
