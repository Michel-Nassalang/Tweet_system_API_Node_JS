var jwt = require('jsonwebtoken');

const JWT_SIGN_SECRET = '5GFY5ZgfgTRYPXMkT0P2m1EfTSu1Wj89j/DDiQIokHq5JqiBkp2SYpBCY60986Jhgfjbvx0oAWQ1sd7s5'

module.exports = {
    generateTokenForUser: function(userData){
        return jwt.sign({
            userId: userData.id,
            isAdmin: userData.isAdmin
        },
        JWT_SIGN_SECRET,
        {
            expiresIn: '1h'
        })
    },
    parseAuthorization: function (authorization) {
        return (authorization != null) ? authorization.replace('Bearer ', '') : null;
    },
    getUserId: function(authorization) {
        var userId = -1;
        var token = module.exports.parseAuthorization(authorization);
        if(token != null){
            try {
                var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
                if (jwtToken != null) {
                    userId = jwtToken.userId;
                }
            } catch (error) {
                
            }
        }
        return userId;
    }
}