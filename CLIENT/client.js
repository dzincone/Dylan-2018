'use strict';

const http = require('http');
const querystring = require('querystring');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let internals = {
    publicMenuOptions: {
        // Main menu
        "0": (internals) => {
            return new Promise((resolve, reject) => {
                rl.question(`\nMain Menu - Please select a menu option 1-5: \n1: Set a new password \n2: Authorize and set public key \n3: Send a signed message \n`, (menuOption) => {
                    if (["1", "2", "3"].indexOf(menuOption) === -1) resolve("0")
                    resolve(menuOption);
                });
            });
        },
        // Set Password
        "1": (internals) => {
            return new Promise((resolve, reject) => {
                let question = internals.data.password ? '\nYour new password will overwrite your previous password. Please set a new password: ' : '\nPlease set a password: '
                rl.question(question, (response) => {
                    if (!response) {
                        console.log("You didn't type anything...");
                        resolve(internals.publicMenuOptions["1"](internals));
                    } else {
                        internals.data.password = response;

                        // HTTP Request with post data
                        let postData = querystring.stringify({
                            'password': internals.data.password,
                        });

                        let options = {
                            host: "localhost",
                            path: "/password",
                            port: 3000,
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            }
                        };

                        let req = http.request(options, (res) => {
                            let responseString = "";
                            res.on("data", (data) => {
                                responseString += data;
                            });
                            res.on("end", () => {
                                console.log("Your password has been saved.")
                                resolve(internals);
                            });
                        });

                        req.write(postData);
                        req.end();
                    }
                });
            });
        },
        // Authorize and enter public key
        "2": (internals) => {
            return new Promise((resolve, reject) => {
                internals.data.passwordAttempts = internals.data.passwordAttempts + 1 || 1;
                rl.question('Please verify your password to set public key: ', async (verifiedPassword) => {
                    // HTTP Request with post data
                    let postData = querystring.stringify({
                        'password': verifiedPassword,
                    });

                    let options = {
                        host: "localhost",
                        path: "/validate",
                        port: 3000,
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded"
                        }
                    };

                    let req = http.request(options, (res) => {
                        let responseString = "";
                        res.on("data", (data) => {
                            responseString += data;
                        });
                        res.on("end", () => {
                            if (internals.data.password !== verifiedPassword) {
                                if (internals.data.passwordAttempts > 3) {
                                    reject({message: 'You have attempted your password too many times. You have been locked out. Bye Bye.'})
                                } else {
                                    console.log('Your passwords did not match. PLease try again');
                                    resolve()
                                }                    
                            } else {
                                internals.data.passwordAttempts = 0;
                                internals.data.verifiedKey = responseString;
                                console.log('Thank you for verifying yourself')
                                resolve(internals.privateOptions.publicKey(internals));
                            }
                        });
                    });
                    req.write(postData);
                    req.end();
                });
            })
        },
        // Sign and send message
        "3": (internals) => {
            return new Promise((resolve, reject) => {
                rl.question('Please write out a message you would like to have signed: ', async (message) => {
                    internals.data.message = message;
                    resolve(internals.privateOptions.signMessage(internals));
                });
            })
        },
    },
    privateOptions: {
        // Sign and send message
        signMessage: (internals) => {
            return new Promise((resolve, reject) => {
                console.log("\nPlease copy and paste your private key here. Enter a new line with the text 'Done' to go to the next step.");
                let input = [];
                internals.data.action = 'signMessage';
                rl.on('line', (key) => {
                    if (key === 'Done' && internals.data.action === 'signMessage') {
                        rl.resume();
                        let privateKey = input.join('\n');

                        // HTTP Request with post data
                        let postData = querystring.stringify({
                            'message': internals.data.message,
                            'privateKey': privateKey,
                        });

                        let options = {
                            host: "localhost",
                            path: "/message",
                            port: 3000,
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            }
                        };

                        let req = http.request(options, (res) => {
                            let responseString = "";
                            res.on("data", (data) => {
                                responseString += data;
                            });
                            res.on("end", () => {
                                console.log("Your message was verified and sent");
                                resolve(internals);
                            });
                        });

                        req.write(postData);
                        req.end();
                    }
                    input.push(key);
                });
                rl.prompt();
            })
        },
        // Set public key
        publicKey: (internals) => {
            return new Promise((resolve, reject) => {
                console.log("\nPlease copy and paste your public key here. Enter a new line with the text 'Done' to go to the next step.");
                let input = [];
                internals.data.action = 'publicKey';
                rl.on('line', function (key) {
                    if (key === 'Done' && internals.data.action === 'publicKey') {
                        rl.resume();
                        internals.data.publicKey = input.join('\n');

                        // HTTP Request with post data
                        let postData = querystring.stringify({
                            'publicKey': internals.data.publicKey,
                            '_id': internals.data.verifiedKey,
                        });

                        let options = {
                            host: "localhost",
                            path: "/publicKey",
                            port: 3000,
                            method: "POST",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            }
                        };

                        let req = http.request(options, (res) => {
                            let responseString = "";
                            res.on("data", (data) => {
                                responseString += data;
                            });
                            res.on("end", () => {
                                console.log("Your public key has been saved")
                                resolve(internals);
                            });
                        });

                        req.write(postData);
                        req.end();
                    }
                    input.push(key);
                });
                rl.prompt();
            });
        }
    },
    data: {},
}

const mainMenu = async (internals) => {
    try {
        let menuOption = await internals.publicMenuOptions["0"](internals);
        await internals.publicMenuOptions[menuOption](internals);
        await mainMenu(internals);
    } catch (err) {
        if (err) console.log(err.message);
        rl.close();
    }
}

mainMenu(internals);