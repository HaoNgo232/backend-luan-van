export const EVENTS = {
  USER: {
    FIND_BY_ID: 'user.findById',
    FIND_BY_EMAIL: 'user.findByEmail',
    CREATE: 'user.create',
    UPDATE: 'user.update',
    DEACTIVATE: 'user.deactivate',
    LIST: 'user.list',
  },
  AUTH: {
    LOGIN: 'auth.login',
    VERIFY: 'auth.verify',
    REFRESH: 'auth.refresh',
  },
  ADDRESS: {
    LIST_BY_USER: 'address.listByUser',
    CREATE: 'address.create',
    UPDATE: 'address.update',
    DELETE: 'address.delete',
    SET_DEFAULT: 'address.setDefault',
  },
  PRODUCT: {
    GET_BY_ID: 'product.getById',
    GET_BY_SLUG: 'product.getBySlug',
    LIST: 'product.list',
    CREATE: 'product.create',
    UPDATE: 'product.update',
    DELETE: 'product.delete',
    INC_STOCK: 'product.incrementStock',
    DEC_STOCK: 'product.decrementStock',
  },
  CATEGORY: {
    GET_BY_ID: 'category.getById',
    GET_BY_SLUG: 'category.getBySlug',
    LIST: 'category.list',
    CREATE: 'category.create',
    UPDATE: 'category.update',
    DELETE: 'category.delete',
  },
  CART: {
    GET: 'cart.get',
    ADD_ITEM: 'cart.addItem',
    REMOVE_ITEM: 'cart.removeItem',
    CLEAR: 'cart.clear',
    TRANSFER_TO_USER: 'cart.transferToUser',
  },
  ORDER: {
    CREATE: 'order.create',
    GET: 'order.get',
    LIST_BY_USER: 'order.listByUser',
    UPDATE_STATUS: 'order.updateStatus',
    CANCEL: 'order.cancel',
  },
  ORDER_ITEM: {
    LIST_BY_ORDER: 'orderItem.listByOrder',
    ADD_ITEM: 'orderItem.addItem',
    REMOVE_ITEM: 'orderItem.removeItem',
  },
  PAYMENT: {
    PROCESS: 'payment.process',
    VERIFY: 'payment.verify',
    GET_BY_ID: 'payment.getById',
    GET_BY_ORDER: 'payment.getByOrder',
  },
  REPORT: {
    SALES_SUMMARY: 'report.salesSummary',
    PRODUCT_PERF: 'report.productPerformance',
    USER_COHORT: 'report.userCohort',
  },
  AR: {
    SNAPSHOT_CREATE: 'ar.snapshotCreate',
    SNAPSHOT_LIST: 'ar.snapshotList',
  },
} as const;

export const NATS_SERVICES = {
  USER: 'user-service',
  PRODUCT: 'product-service',
  ORDER: 'order-service',
  PAYMENT: 'payment-service',
  REPORTER: 'reporter-service',
};
