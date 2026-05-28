const { Client, Account } = require('node-appwrite');
const client = new Client().setEndpoint('https://cloud.appwrite.io/v1').setProject('dummy');
const account = new Account(client);
console.log(account.createSession ? 'createSession exists' : 'createSession does not exist');
console.log(account.createSession.toString());
