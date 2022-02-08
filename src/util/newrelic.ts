const isConfigured = () => process.env.NEW_RELIC_APP_NAME && process.env.NEW_RELIC_LICENSE_KEY;

const newrelic = isConfigured() ? require('newrelic') : null;

const ignoreTransaction = () => {
    if (!newrelic) return;

    newrelic.getTransaction().ignore();
};

export { ignoreTransaction };
