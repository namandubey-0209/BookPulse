import mongoose from "mongoose";
import bcrypt from 'bcryptjs'; 

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  readingGoal: {
    year: {
      type: Number,
      default: () => new Date().getFullYear()
    },
    target: {
      type: Number,
      default: 12
    },
    current: {
      type: Number,
      default: 0
    }
  },
  favoriteGenres: [{
    type: String,
    trim: true
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  joinDate: {
    type: Date,
    default: Date.now
  }
    }, {
    timestamps: true
    });

    userSchema.pre('save', async function (next) {
        if(!this.isModified('password')) return next();

        try {
            const salt = await bcrypt.genSalt(12);
            this.password = await bcrypt.hash(this.password,salt);
            next();
        } catch (error) {
            next(error);
        }
    })

    userSchema.methods.comparePassword = async function (candidatePassword) {
        return await bcrypt.compare(candidatePassword,this.password);
    }

    userSchema.methods.toJSON = function(){
        const user = this.toObject();
        delete user.password;
        return user;
    }

    export default mongoose.model('User',userSchema);

