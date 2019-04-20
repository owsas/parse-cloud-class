import * as express from 'express';
import * as fetch from 'node-fetch';
import * as Parse from 'parse/node';
import delay from 'delay';
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

const testId = Math.floor(Math.random() * 200000);

const obj = new Parse.Object('Test');
obj.set('number', 123);
obj.set('testId', testId);

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

test('server should be able to save analytics', async () => {
  const analytic = new Parse.Object('Analytic');
  analytic.set('test', true);
  await analytic.save(null, { useMasterKey: true });
});

test('saving the Test object should work', async () => {
  await obj.save(null, { useMasterKey: true });
});

test('fetching the object', async () => {
  await obj.fetch({ useMasterKey: true });
});

test('the object should have changed', async () => {
  expect(obj.get('nice')).toBe(true);
});

test('the test addon should have been ', async () => {
  expect(obj.get('testAddonProcessed')).toBe(true);
});

test('waiting a few seconds', async () => {
  await delay(3000);
});

test('the analytic must have been created', async () => {
  const query = new Parse.Query('Analytic');
  query.equalTo('testId', testId);
  const first = await query.first({ useMasterKey: true });

  expect(first).toBeDefined();
});
