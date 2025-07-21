import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const generateToken = userId => {
    return jwt.sign({id: userId}, process.env.JWT_SECRET)
}