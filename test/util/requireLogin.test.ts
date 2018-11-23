import * as Parse from 'parse/node';
import requireLogin, { PLEASE_LOGIN } from '../../src/util/requireLogin';

test('Given a request with no user nor master key: should throw', () => {
  expect(() => {
    (requireLogin as any)({});
  }).toThrow(PLEASE_LOGIN);
});

test('Given a request with master key: should not throw', () => {
  expect(() => {
    (requireLogin as any)({ master: true });
  }).not.toThrow();
});

test('Given a request with user: should not throw', () => {
  expect(() => {
    const user = new Parse.User();
    user.id = '123';

    (requireLogin as any)({ user });
  }).not.toThrow();
});
