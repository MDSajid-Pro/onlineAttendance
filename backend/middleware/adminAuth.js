import jwt from 'jsonwebtoken'

const adminAuth = (req, res, next) => {
      
    const token = req.headers.authorization;

    try {

        jwt.verify(token, process.env.JWT_SECRET)
        next();
        
    } catch (err) {
        return res.json({success: false, message: err.message})
    }
}

export default adminAuth;