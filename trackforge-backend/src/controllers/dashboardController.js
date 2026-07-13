import { getDashboardOverviewData } from '../services/dashboardService.js';
import { sendSuccess } from '../utils/response.js';

export const getOverview = async (req, res, next) => {
  try {
    const data = await getDashboardOverviewData(req.user.userId);
    return sendSuccess(res, data, 'Dashboard overview fetched successfully');
  } catch (error) {
    next(error);
  }
};
