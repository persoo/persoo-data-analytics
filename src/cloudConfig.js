

export default {
    clouds: {
        'production': {
            rtpAPIEndpoint: 'rtp.persoo.cz',
            adminAPIEndpoint: 'https://adminapi.persoo.cz',
            scriptsEndpoint: 'https://scripts.persoo.cz/',
            adminEndpoint: 'https://admin.persoo.cz'
        },
        'o2': {
            rtpAPIEndpoint: 's.o2.cz',
            adminAPIEndpoint: 'https://adminapi-o2.persoo.cz',
            scriptsEndpoint: 'https://persoo-o2-310448.c.cdn77.org/',
            adminEndpoint: 'https://admin-o2.persoo.cz'
        },
        'test-a': {
            rtpAPIEndpoint: 'rtp-test-a.persoo.cz',
            adminAPIEndpoint: 'https://adminapi-test-a.persoo.cz',
            scriptsEndpoint: 'https://s3-eu-west-1.amazonaws.com/cz.persoo.test-a.javascripts/',
            adminEndpoint: 'https://admin-test-a.persoo.cz'
        }
    }
};
