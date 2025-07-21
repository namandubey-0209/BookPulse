import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from'../models/User.js'

const generateToken = userId => {
    return jwt.sign({id: userId}, process.env.JWT_SECRET)
}

export const register =  async(req,res) => {
    try {
        const {username ,email}
    } catch (error) {
        
    }
}