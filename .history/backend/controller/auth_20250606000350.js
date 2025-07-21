const generateToken = userId => {
    return jwt.sign({id: userId})
}