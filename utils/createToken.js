const createTokenUser = (user) => {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    _id: user._id,
  };
};

export default createTokenUser;
