import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from'../models/User
const generateToken = userId => {
    return jwt.sign({id: userId}, process.env.JWT_SECRET)
}