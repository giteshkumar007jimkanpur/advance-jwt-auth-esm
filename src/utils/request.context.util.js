import { AsyncLocalStorage } from 'async_hooks';
const asyncLocalStorage = new AsyncLocalStorage();

const setContext = (data) => {
  asyncLocalStorage.enterWith(data);
};

const getContext = () => asyncLocalStorage.getStore() || {};

export default { setContext, getContext };
