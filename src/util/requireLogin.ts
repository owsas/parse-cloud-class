export const PLEASE_LOGIN = 'Please login';

/**
 * Requires the request to have ben sent by an user or by a master key
 * @param req
 */
export default function requireLogin(req: Parse.Cloud.BeforeSaveRequest) {
  if (!req.user && !req.master) {
    throw new Error(PLEASE_LOGIN);
  }
}
