const packageJSON = require("../package.json");

module.exports = {
    info: {
        title: "THX API Specification",
        version: packageJSON.version,
    },
    apis: ["src/controllers/**/*.ts"],
    basePath: "https://dev.api.thx.network/v1",
};
