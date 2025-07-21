import jwt from 'jsonwebtoken'
import b

const generateToken = userId => {
    return jwt.sign({id: userId}, process.env.JWT_SECRET)
}