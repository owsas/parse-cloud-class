import * as express from 'express';
import * as fetch from 'node-fetch';
import * as Parse from 'parse/node';
import * as path from 'path';

const { ParseServer } = require('parse-server');

const appId = 'myAppId';
const javascriptKey = 'jsKey';
const masterKey = 'myMasterKey';
const serverURL = 'http://localhost:1337/parse';

Parse.initialize(appId, javascriptKey, masterKey);
(Parse as any).serverURL = serverURL;

const api = new ParseServer({
  appId,
  javascriptKey,
  masterKey, // Keep this key secret!
  serverURL, // Don't forget to change to https if needed
  databaseURI: 'mongodb://localhost:27017/dev', // Connection string for your MongoDB database
  cloud: path.join(__dirname, 'cloud', 'main.js'), // Absolute path to your Cloud Code
  fileKey: 'optionalFileKey',
});

const app = express();
app.use('/parse', api);

const obj = new Parse.Object('Test');
obj.set('name', 'Test name');

beforeAll(async () => {
  return new Promise((resolve, reject) => {
    app.listen(1337, () => {
      console.log('running'); // tslint:disable-line
      resolve();
    });
  });
});

test('should have a server running', async () => {
  await fetch('http://localhost:1337', {});
});

test('saving the Test object should work', async () => {
  await obj.save(null, { useMasterKey: true });
});

test('the object should have changed', async () => {
  await obj.fetch({ useMasterKey: true });
  expect(obj.get('nice')).toBe(true);
});
