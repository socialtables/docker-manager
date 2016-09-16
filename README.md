# @socialtables/docker-manager

##Installation

```
$ npm install @socialtables/docker-manager
```

# Purpose

Can be used whenever you want to run docker compose and wait for it to be up, but specifically designed to be used as an integration test harness in combination with mocha.

# simple example

For example, used in a before and after blocks in a mocha test script

```javascript
before(function() {
    this.timeout(10000);
    console.log("Spinning up docker compose architecture...");
    return dockerManager.composeUp(__dirname, { }, { "to": 5000 })
        .then(function() {
            console.log("Done spinning up! Ready to test.");
        });
});
```

```javascript
after(function() {
    this.timeout(10000);
    console.log("Spinning down docker compose architecture...");
    return dockerManager.composeDown(__dirname)
        .then(function () {
            console.log("Done spinning down.");
        });
});
```

# Usage

dockerManager.composeUp(directory, options, health)

where: 

directory is where your docker-compose.yml file is located

options are options to pass to the docker-compose command

health is an object containing information on how to determine when the composed architecture is healthy
```javascript
{
    check: function() { /* your own healthcheck function, omit this property to do implcit */},
    to: 5000 // timeout
}
```
