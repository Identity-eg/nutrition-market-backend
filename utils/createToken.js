const createTokenUser = (user) => {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    _id: user._id,
    ...(user.company && { company: user.company }),
  };
};

export default createTokenUser;
