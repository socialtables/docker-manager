const req = require("request-promise");
const YAML = require("node-yaml");
const Promise = require("bluebird");
const readFile = Promise.promisify(require("fs").readFile);
const path = require("path");
const assert = require("assert");
const arrayIncludes = require("array-includes");

/**
 * _getComposeServices
 * Parses the docker compose file and returns all the service names for future checks
 * 
 * @param {string} dir 
 * @returns a promise that resolves to the list of services in the compose file
 */
function _getComposeServices(dir) {
    return Promise.resolve(true)
        .then(() => {
            return readFile(path.join(dir, "docker-compose.yml"), "utf8");
        })
        .then(txt => {
            return YAML.parse(txt);
        })
        .then(compose => {
           return Object.keys(compose.services);
        });
}

/**
 * _serviceHealth
 * Checks the docker api and sees if all the services are healthy
 * 
 * @param {any} services
 * @returns a promise that resolves to an array of service names and their health status
 */
function _serviceHealth(services) {
    const dockSock = "http://unix:/var/run/docker.sock:";
    var containersOpts = {
        uri: `${dockSock}/containers/json`,
        headers: {
            "Host": "" //YOU HAVE TO DO THIS SO DOCKER DOESNT COMPLAIN ABOUT A MALFORMED HOST HEADER
        },
        json: true
    };
    
    return req(containersOpts)
        .then(res => {
            let serviceHealth = [];
            res.map(c => {
                let composeService = c.Labels["com.docker.compose.service"];
                if (composeService && arrayIncludes(services, composeService)) {
                    serviceHealth.push({
                        name: composeService,
                        healthy: c.Status.indexOf("(healthy)") > -1
                    });
                }
            });
            return serviceHealth;
        });
}

/**
 * ImplicitHealth
 * 1. checks the docker compose file for services
 * 2. queries the docker api for health info on said services
 * 
 * @param {any} dir
 * @returns a promise that resolves to true if all compose services are registering as healthy
 */
function ImplicitHealth(dir) {
    let numServices = 0;
    return Promise.resolve(true)
        .then(() => {
            return _getComposeServices(dir);
        })
        .then(sNames => {
            numServices = sNames.length;
            return _serviceHealth(sNames);
        })
        .then(health => {
            assert.equal(health.length, numServices);
            assert.ok(!health.some(h => { return h.healthy == false; }));
            return health;
        });
}

module.exports = ImplicitHealth;