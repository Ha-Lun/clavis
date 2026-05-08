import { Client, Account } from "node-appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('69f6281d001e86b9861e');

const account = new Account(client);

account.get().then(console.log).catch(console.error);
