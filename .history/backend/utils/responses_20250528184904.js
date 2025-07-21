export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  };
  
  export const errorResponse = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  };
  
  export const validationErrorResponse = (res, errors) => {
    return errorResponse(res, 'Validation failed', 400, errors);
  };
  
  export const notFoundResponse = (res, resource = 'Resource') => {
    return errorResponse(res, `${resource} not found`, 404);
  };
  
  export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
    return errorResponse(res, message, 401);
  };
  
  export const forbiddenResponse = (res, message = 'Access forbidden') => {
    return errorResponse(res, message, 403);
  };