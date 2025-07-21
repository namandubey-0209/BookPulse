import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from'../models/User.js'

const generateToken = userId => {
    return jwt.sign({id: userId}, process.env.JWT_SECRET)
}

export const register =  async(req,res) => {
    try {
        const {username ,email ,password , confirmPassword} = req.body;

        if(!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ 
                message: 'All fields are required' 
            });
        }

        if(password !== confirmPassword){
            return res.status(400).json({
                 message: 'Passwords do not match' 
            })
        }
         if (password.length < 6) {
            return res.status(400).json({ 
                message: 'Password must be at least 6 characters long' 
            });
        }

         const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        })
        
    } catch (error) {
        
    }
}