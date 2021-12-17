const express = require('express')
const router = express.Router()


//installed bcrypt.js
const bcrypt = require('bcryptjs');
const UserModel = require('../models/User.model')
const { response } = require('express');

router.post('/signup', (req, res) => {
    const {emailId, password, firstName, lastName } = req.body;
    // console.log(emailId, password, firstName,lastName);
 
    // -----SERVER SIDE VALIDATION ----------

    if (!emailId || !password || !firstName || !lastName) {
        res.status(500)
          .json({
            errorMessage: 'Please enter emailId, password, firstName and lastName'
          });
        return;  
    }
    const myRegex = new RegExp(/^[a-z0-9](?!.*?[^\na-z0-9]{2})[^\s@]+@[^\s@]+\.[^\s@]+[a-z0-9]$/);
    if (!myRegex.test(emailId)) {
        res.status(500).json({
          errorMessage: 'Email format not correct'
        });
        return;  
    }
    const myPassRegex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/);
    if (!myPassRegex.test(password)) {
      res.status(500).json({
        errorMessage: 'Password needs to have 8 characters, a number, a special character and an Uppercase alphabet'
      });
      return;  
    }
    
    // NOTE: Used the Sync methods here. 
    // creating a salt 
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(password, salt);
    UserModel.create({firstName, lastName, emailId, password: hash})
      .then((user) => {
        // ensuring that we don't share the hash as well with the user
        user.password = "***";
        res.status(200).json(user);
      })
      .catch((err) => {
        if (err.code === 11000) {
          res.status(500).json({
            errorMessage: 'username or email entered already exists!',
            message: err,
          });
        } 
        else {
          res.status(500).json({
            errorMessage: 'Something went wrong! Go to sleep!',
            message: err,
          });
        }
      })
});


router.post('/google/auth', (req, res) => {
  
  // console.log(emailId, password, firstName,lastName);

  client.verifyIdToken({idToken: tokenId, audiende: "787148417509-42sv3s46rvl35qgintd8eo00bqco3p2t.apps.googleusercontent.com"}).then(response => {
    const {email_verified,given_name, family_name, email} = response.payload;
    if(email_verified) {

      UserModel.findOne({emailId:email})
          .then((userData) => {
            res.status(500).json({
              error: 'Email already exist',
              message: "Please sign in using the emailId"
          })
          return;
          })
          //throw an error if the user does not exists 
          .catch((err) => {
            let password = email+process.env.JWT_SIGNIN_KEY
            UserModel.create({firstName: given_name, lastName: family_name, emailId:email, password })
            .then((user) => {
              // ensuring that we don't share the hash as well with the user
              user.password = "***";
              res.status(200).json(user);
            })
            .catch((err) => {
              if (err.code === 11000) {
                res.status(500).json({
                  errorMessage: 'username or email entered already exists!',
                  message: err,
                });
              } 
              else {
                res.status(500).json({
                  errorMessage: 'Something went wrong! Go to sleep!',
                  message: err,
                });
              }
            })
          });     
    }

    // console.log(response.payload);
  })



  
});

router.post('/google/signin', (req, res) => {
  const {tokenId} = req.body;

  client.verifyIdToken({idToken: tokenId, audiende: "787148417509-42sv3s46rvl35qgintd8eo00bqco3p2t.apps.googleusercontent.com"}).then(response => {
    const {email_verified, name, email} = response.payload;
    if(email_verified) {
        UserModel.findOne({emailId:email})
          .then((userData) => {
              //check if passwords match
              {
                // req.session is the special object that is available to you
                
                req.session.user = userData;
                res.status(200).json(userData) 
              }
          })
          //throw an error if the user does not exists 
          .catch((err) => {
            res.status(500).json({
                error: 'Email does not exist',
                message: err
            })
            return;  
          });
    }

    // console.log(response.payload);
  })

  // console.log(tokenId);
  
});
 
// will handle all POST requests to http:localhost:5005/api/signin
router.post('/signin', (req, res) => {
    const {emailId, password } = req.body;

    // -----SERVER SIDE VALIDATION ----------
    
    if ( !emailId || !password) {
        res.status(500).json({
            error: 'Please enter Username. email and password',
       })
      return;  
    }
    const myRegex = new RegExp(/^[a-z0-9](?!.*?[^\na-z0-9]{2})[^\s@]+@[^\s@]+\.[^\s@]+[a-z0-9]$/);
    if (!myRegex.test(emailId)) {
        res.status(500).json({
            error: 'Email format not correct',
        })
        return;  
    }
    
    // Find if the user exists in the database 
    UserModel.findOne({emailId})
      .then((userData) => {
           //check if passwords match
          bcrypt.compare(password, userData.password)
            .then((doesItMatch) => {
                //if it matches
                if (doesItMatch) {
                  // req.session is the special object that is available to you
                  userData.password = "***";
                  req.session.user = userData;
                  res.status(200).json(userData) 
                }
                //if passwords do not match
                else {
                    res.status(500).json({
                        error: 'Passwords don\'t match',
                    })
                  return; 
                }
            })
            .catch(() => {
                res.status(500).json({
                    error: 'Email format not correct',
                })
              return; 
            });
      })
      //throw an error if the user does not exists 
      .catch((err) => {
        res.status(500).json({
            error: 'Email does not exist',
            message: err
        })
        return;  
      });
  
});
 
// will handle all POST requests to http:localhost:5005/api/logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    // Nothing to send back to the user
    res.status(204).json({});
})


// middleware to check if user is loggedIn
const isLoggedIn = (req, res, next) => {  
  if (req.session.user) {
      //calls whatever is to be executed after the isLoggedIn function is over
      next()
  }
  else {
      res.status(401).json({
          message: 'Unauthorized user',
          code: 401,
      })
  };
};


// THIS IS A PROTECTED ROUTE
// will handle all get requests to http:localhost:5005/api/user
router.get("/user", isLoggedIn, (req, res, next) => {
  res.status(200).json(req.session.user);
});

module.exports = router;