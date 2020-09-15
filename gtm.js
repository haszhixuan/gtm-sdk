const log = require("logToConsole");
const inject = require("injectScript");
const setWindow = require("setInWindow");
const getWindow = require("copyFromWindow");

let onSuccess = function () {
    log("TUNE SDK: loaded SDK library");
};
let onFailure = function () {
    log("TUNE SDK: ERROR: failed to load SDK library");
    data.gtmOnFailure();
};

// A version of the "snippet" that is typically provided in the TUNE
// documentation, modified to work with Google's limited JS sandbox.
(function () {
    let tdl = getWindow("tdl") || [];
    if (!tdl.invoked) {
        tdl.invoked = true;
        tdl.methods = ["identify", "convert"];

        tdl.factory = function (method) {
            return function () {
                let newTdl = getWindow("tdl");
                let argArray = [];
                for (let i = 0; i < arguments.length; i++) {
                    argArray[i] = arguments[i];
                }
                argArray.unshift(method);
                newTdl.push(argArray);
                setWindow("tdl", newTdl, true);
                return newTdl;
            };
        };

        for (let i = 0; i < tdl.methods.length; i++) {
            var key = tdl.methods[i];
            tdl[key] = tdl.factory(key);
        }
        tdl.init = function (idAndDomain) {
            let newTdl = getWindow("tdl");
            newTdl.domain = idAndDomain;
            setWindow("tdl", newTdl, true);
            return newTdl;
        };

        setWindow("tdl", tdl, true);
        inject("https://js.go2sdk.com/v2/tune.js", onSuccess, onFailure);
    }
})();

// Get a copy of the tdl object and use it to initialize the SDK with one or
// more network IDs and tracking domains.
let tdl = getWindow("tdl");
let initObject = {};
data.init_fields.forEach((el) => {
    initObject[el.network_id] = el.tracking_domain;
});
tdl = tdl.init(initObject);

// Depending on the action chosen by the user of this template, grab any
// parameters provided in the tag definition and perform the requested action.
if (data.action === "identify") {
    // Parameters have to be converted from the format provided by the tag manager
    // to the format expected by the TUNE SDK methods.
    let defaults = data.click_default_fields === undefined ?
        {} : 
        data.click_default_fields.reduce((acc, curr) => { 
            acc[curr.click_default_name] = curr.click_default_value;
            return acc;
        }, {});
    let overrides = data.click_override_fields === undefined ? 
        {} : 
        data.click_override_fields.reduce((acc, curr) => {
            acc[curr.click_override_name] = curr.click_override_value;
            return acc;
        }, {});

    tdl.identify(defaults, overrides);
} else if (data.action === "convert") {
    let params = data.conversion_fields === undefined ? 
        {} :
        data.conversion_fields.reduce((acc, curr) => {
            acc[curr.conversion_name] = curr.conversion_value;
            return acc;
        }, {});

    tdl.convert(params);
}

data.gtmOnSuccess();
