export const sendSuccess = (res, data = null, message = 'Operation completed successfully', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    data,
    message
  });
};

export const sendPaginated = (res, data, pagination, message = 'Data fetched successfully') => {
  return res.status(200).json({
    status: 'success',
    data,
    pagination,
    message
  });
};
