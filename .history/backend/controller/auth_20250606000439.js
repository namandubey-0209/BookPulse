import jwt from 'js'

const generateToken = userId => {
    return jwt.sign({id: userId}, process.env.JWT_SECRET)
}