export const profile = async (req, res, next) => {
  try {
    return res.status(200).json({
      message: 'User Info ...',
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
