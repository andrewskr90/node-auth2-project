const { JWT_SECRET } = require("../secrets"); // use this secret!
const jwt = require('jsonwebtoken')
const User = require('../users/users-model')

const restricted = (req, res, next) => {
  const token = req.headers.authorization
  if (!token) {
    next({
      status: 401,
      message: 'Token required'
    })
  } else {
    jwt.verify(
      token,
      JWT_SECRET,
      (err, decoded) => {
        if (err) {
          next({
            status: 401,
            message: 'Token invalid'
          })
        } else {
          req.decodedJwt = decoded
          next()
        }
      }
    )
  }

  /*
    If the user does not provide a token in the Authorization header:
    status 401
    {
      "message": "Token required"
    }

    If the provided token does not verify:
    status 401
    {
      "message": "Token invalid"
    }

    Put the decoded token in the req object, to make life easier for middlewares downstream!
  */
}

const only = role_name => (req, res, next) => {
  const { decodedJwt } = req
  console.log('decoded--->',decodedJwt)
  if (decodedJwt.role_name === role_name) {
    next()
  } else {
    next({
      status: 403,
      message: 'This is not for you'
    })
  }
  /*
    If the user does not provide a token in the Authorization header with a role_name
    inside its payload matching the role_name passed to this function as its argument:
    status 403
    {
      "message": "This is not for you"
    }

    Pull the decoded token from the req object, to avoid verifying it again!
  */
}


const checkUsernameExists = async (req, res, next) => {
  const { username } = req.body
  try {
    const possibleUser = await User.findBy({ username }) 
    if (!possibleUser) {
      next({
        status:401,
        message: 'Invalid credentials'
      })
    } else {
      next()
    }
  } catch (err) {
    next(err)
  }
  /*
    If the username in req.body does NOT exist in the database
    status 401
    {
      "message": "Invalid credentials"
    }
  */
}


const validateRoleName = (req, res, next) => {
  let role_name = req.body.role_name
  const err = { status: 422 }
  if (!role_name) {
    req.role_name = 'student'
    return next()
  } 
  role_name = role_name.trim()
  if (role_name === 'admin') {
    err.message = 'Role name can not be admin'
    next(err)
  } else if (role_name.length > 32) {
    err.message = 'Role name can not be longer than 32 chars'
    next(err)
  } else {
    req.role_name = role_name
    next()
  }
  
  /*
    If the role_name in the body is valid, set req.role_name to be the trimmed string and proceed.

    If role_name is missing from req.body, or if after trimming it is just an empty string,
    set req.role_name to be 'student' and allow the request to proceed.

    If role_name is 'admin' after trimming the string:
    status 422
    {
      "message": "Role name can not be admin"
    }

    If role_name is over 32 characters after trimming the string:
    status 422
    {
      "message": "Role name can not be longer than 32 chars"
    }
  */
}

module.exports = {
  restricted,
  checkUsernameExists,
  validateRoleName,
  only,
}
