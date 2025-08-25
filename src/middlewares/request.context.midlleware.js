import { v4 as uuidv4 } from 'uuid';

import requestContextHelper from '../utils/request.context.helper.js';

const requestContext = (req, res, next) => {
  /** If upstream service or client already sent X-Request-ID, use it. */
  const incomingId = req.headers['x-request-id'];

  /** Otherwise generate a new one */
  const requestId = incomingId || uuidv4();

  /** Store it in asyncLocalStorage for downstream logger access */
  requestContextHelper.setContext({ requestId });

  /** Attach it to request object for app-level handlers */
  req.requestId = requestId;

  /** Always expose in response headers */
  res.setHeader('X-Request-ID', requestId);

  next();
};

export default requestContext;
