/**
 * React Native optimized response utilities for mobile applications
 */
const reactNativeConfig = require('../config/react-native');

/**
 * Creates a standardized success response for mobile apps
 * @param {Object} data - The data to send
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} - Formatted response object
 */
const successResponse = (data = null, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    statusCode
  };
};

/**
 * Creates a standardized error response for mobile apps
 * @param {string} message - Error message
 * @param {string} code - Error code for mobile app handling
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {Object} details - Additional error details
 * @returns {Object} - Formatted error response object
 */
const errorResponse = (message = 'Something went wrong', code = 'ERROR', statusCode = 400, details = null) => {
  const response = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    statusCode
  };

  if (details) {
    response.details = details;
  }

  return response;
};

/**
 * Creates a paginated response for mobile apps
 * @param {Array} data - Array of data items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 * @returns {Object} - Formatted paginated response
 */
const paginatedResponse = (data, page, limit, total, message = 'Data retrieved successfully') => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    success: true,
    message,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Creates a mobile-optimized list response
 * @param {Array} items - Array of items
 * @param {string} message - Success message
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Formatted list response
 */
const listResponse = (items = [], message = 'List retrieved successfully', metadata = {}) => {
  return {
    success: true,
    message,
    data: {
      items,
      count: items.length,
      ...metadata
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Creates a mobile-optimized single item response
 * @param {Object} item - Single item data
 * @param {string} message - Success message
 * @returns {Object} - Formatted single item response
 */
const itemResponse = (item, message = 'Item retrieved successfully') => {
  return {
    success: true,
    message,
    data: item,
    timestamp: new Date().toISOString()
  };
};

/**
 * Creates a mobile-optimized action response (create, update, delete)
 * @param {Object} data - The created/updated/deleted data
 * @param {string} action - Action performed (created, updated, deleted)
 * @param {string} resource - Resource type (user, post, etc.)
 * @returns {Object} - Formatted action response
 */
const actionResponse = (data, action, resource) => {
  const messages = {
    created: `${resource} created successfully`,
    updated: `${resource} updated successfully`,
    deleted: `${resource} deleted successfully`
  };

  return {
    success: true,
    message: messages[action] || 'Action completed successfully',
    data,
    action,
    resource,
    timestamp: new Date().toISOString()
  };
};

/**
 * Common error codes for React Native apps
 */
const ERROR_CODES = {
  ...reactNativeConfig.errorCodes,
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE'
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  listResponse,
  itemResponse,
  actionResponse,
  ERROR_CODES
}; 