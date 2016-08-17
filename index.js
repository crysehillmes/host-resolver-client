#!/usr/bin/env node
'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs')
const readline = require('readline');
const http = require('http');
const commander = require('commander');
const pkg = require('./package.json');

const DOMAIN_PLAIN_PREFIX = '#!(DOMAIN, PLAIN):';

let resolve = (options) => {
    let configPath = '';
    let hostsFilePath = '';
    if (options.config) {
        configPath = options.config;
    } else {
        configPath = path.join(__dirname, 'config.json');
    }
    if (options.hostsfile) {
        hostsFilePath = options.hostsfile;
    } else {
        if (process.platform == 'win32') {
            hostsFilePath = path.join(process.env.SYSTEMROOT, 'system32', 'drivers\\etc\\hosts');
        } else {
            hostsFilePath = '/etc/hosts';
        }
    }
    let config = require(configPath);
    let templatePath = config.host_templates[0];
    if (path.resolve(templatePath) !== path.normalize(templatePath)) {
        templatePath = path.join(__dirname, templatePath);
    }
    let postData = { domains: [] };
    let templateReader = readline.createInterface({
        input: fs.createReadStream(templatePath)
    })
    let templateLines = [];
    templateReader.on('line', function (line) {
        templateLines.push(line);
        if (line.startsWith(DOMAIN_PLAIN_PREFIX)) {
            let domain = line.substring(DOMAIN_PLAIN_PREFIX.length);
            postData.domains.push(domain);
        }
    });
    templateReader.on('close', function () {
        let body = JSON.stringify(postData);
        let request = new http.ClientRequest({
            hostname: config.server_host,
            port: config.server_port,
            path: '/domain/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'Authorization': 'Bearer ' + config.server_auth_token
            }
        });
        request.end(body);
        request.on('response', function (response) {
            response.setEncoding('utf8');
            let jsonString = '';
            response.on('data', function (chunk) {
                jsonString += chunk;

            });
            response.on('end', function () {
                let resolved = JSON.parse(jsonString);
                if (!resolved.success) {
                    console.log('Failed');
                    exit();
                }
                let hostsFileWriter = fs.createWriteStream(hostsFilePath);
                hostsFileWriter.on('error', function (err) {
                    /* error handling */
                    console.log(err);
                });
                templateLines.forEach(function (line) {
                    if (line.startsWith(DOMAIN_PLAIN_PREFIX)) {
                        let domain = line.substring(DOMAIN_PLAIN_PREFIX.length);
                        let found = false;
                        for(let index in resolved.data.resolved) {
                            let resolvedDomain = resolved.data.resolved[index];
                            if(domain === resolvedDomain.domain) {
                                hostsFileWriter.write(resolvedDomain.ipv4[0] + ' ' + domain + '\n');
                                found = true;
                                break;
                            }
                        }
                        if(!found) {
                            hostsFileWriter.write(line + '\n');
                        }
                    } else {
                        hostsFileWriter.write(line + '\n');
                    }
                });
                hostsFileWriter.end();
                console.log(`Hosts file ${hostsFilePath} updated.`);
            });
            response.on('error', function (e) {
                console.log('Problem with response: ' + e.message);
            });
        });
        request.on('error', function (e) {
            console.log('Problem with request: ' + e.message);
        });
    });
}

let dispatcher = (options) => {
    if(options.generate) {

    } else {
        resolve(options);
    }
}

commander
    .version(pkg.version)
    .option('-c, --config [config]', 'Config file path. Default is ~[/host-resolver-config.json]')
    .option('-H, --hostsfile [hostsfile]', 'Output hosts file. On Windows, default is [%SYSTEMROOT%\\system32\\drivers\\etc\\hosts]. On *nix and OS X, default is [/etc/hosts]')
    .option('-g, --generate', 'Generate default config file.');

commander.parse(process.argv);

// if commander was called with no arguments, show help.
// if (commander.args.length === 0) commander.help();
dispatcher(commander.options);