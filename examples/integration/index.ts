// Copyright 2016-2017, Pulumi Corporation.  All rights reserved.

/*tslint:disable:no-require-imports*/
declare let require: any;
declare let JSON: any;
declare let Date: any;
declare let Math: any;

import * as platform from "@lumi/platform";
import * as config from "./config";
import {Digest} from "./digest";
import * as mailgun from "./mailgun";
import {poll} from "./poll";
import * as salesforce from "./salesforce";
import * as twitter from "./twitter";

let sendEmail = mailgun.send;
let salesforceQueryAll = salesforce.queryAll;

function exampleTwitter1() {
    // Get a stream of all tweets matching this query, forever...
    let tweets = twitter.search("pulumi", "vscode");

    // On each tweet, log it and send an email.
    tweets.subscribe("tweetlistener", async (tweet) => {
        console.log(tweet);
        await sendEmail({
            to: "luke@pulumi.com",
            subject: `Tweets from ${new Date().toDateString()}`,
            body: `@${tweet.user.screen_name}: ${tweet.text}\n`,
        });
    });
}

function exampleTwitter2() {
    // Get a stream of all tweets matching this query, forever...
    let tweets: platform.Stream<twitter.Tweet> = twitter.search("pulumi", "vscode");

    // Collect them into bunches
    let digest = new Digest("tweetdigest", tweets);

    // Every night, take all of the tweets collected since the
    // last digest and publish that as a group to the digest stream.
    platform.timer.daily("nightly", { hourUTC: 7 },  async () => {
        await digest.collect();
    });

    // For every group of tweets published to the digest stream (nightly)
    // send an email.
    digest.subscribe("digest", async (dailyTweets) => {
        // Arbitrary code to compose email body - could use templating system or
        // any other programmatic way of constructing the text.
        let text = "Tweets:\n";
        for (let i = 0; i < (<any>dailyTweets).length; i++) {
            let tweet = dailyTweets[i];
            text += `@${tweet.user.screen_name}: ${tweet.text}\n`;
        }
        await sendEmail({
            to: "luke@pulumi.com",
            subject: `Tweets from ${new Date().toDateString()}`,
            body: text,
        });
    });
}

function exampleSalesforce1() {
    // Get a stream of all modifications to the Contact list...
    let contactsStream = poll("contactspolling", {minutes: 1}, async (timestamp) => {
        if (timestamp === undefined) {
            // Initial timestamp to start collecting edits from.
            timestamp = "2017-01-01T00:00:00.000Z";
        }
        // Query Salesforce
        let records = await salesforceQueryAll(
            `SELECT Id,Name,LastModifiedDate FROM Contact WHERE LastModifiedDate > ${timestamp}`,
        );
        // Update timetamp to latest of all received edits.
        let newTimestamp = (<any>records).reduce(
            (ts: string, record: salesforce.Record) => {
                let newts = record["LastModifiedDate"];
                return newts > ts ? newts : ts;
            },
            timestamp,
        );
        // Return this batch of items and the new timestamp
        return {
            items: records,
            nextToken: newTimestamp,
        };
    });

    // Log each modification.
    contactsStream.subscribe("contactlistener", async (contact) => {
        console.log(contact);
    });
}

function exampleSalesforce2() {
    // Get a stream of all modifications to the Contact list...
    let contacts = salesforce.query(
        "contacts",
        (timestamp) => `SELECT Id,Name,LastModifiedDate FROM Contact WHERE LastModifiedDate > ${timestamp}`,
        "2017-01-01T00:00:00.000Z",
        "LastModifiedDate",
        (a, b) => a > b ? a : b,
    );

    // Log each modification.
    contacts.subscribe("contactlistener", async (contact) => {
        console.log(contact);
    });
}

function exampleSalesforce3() {
    // Get a stream of all modifications to the Contact list...
    let contacts = salesforce.allObjectModifications("contacts", "Contact", "Id,Name");

    // Log each modification.
    contacts.subscribe("contactlistener", async (contact) => {
        console.log(contact);
    });
}

exampleSalesforce2();