const router = require('express').Router();
const { User, Post, Comment } = require('../../models');
const withAuth = require('../../utils/auth');

// get  all users 
router.get('/', (req, res) => {
    
    User.findAll({
        attributes: { exclude: ['password'] }
    })
      .then(dbUser => res.json(dbUser))
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  });

// GET User By Id 
router.get('/:id', (req, res) => {
    User.findOne({
        attributes: { exclude: ['password']},
        where: {
          id: req.params.id
        },
        include: [
            {
              model: Post,
              attributes: ['id', 'title', 'post_content', 'created_at']
            },
            {
                model: Comment,
                attributes: ['id', 'comment_text', 'created_at'],
                include: {
                  model: Post,
                  attributes: ['title']
                }
            }
          ]

    })
      .then(dbUser => {
        if (!dbUser) {
          res.status(404).json({ message: 'No user found with this id' });
          return;
        }
        res.json(dbUser);
      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  });

// Create a User
router.post('/', (req, res) => {
    User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      twitter: req.body.twitter,
      github: req.body.github
    })
    .then(dbUser => {
      req.session.save(() => {
        req.session.user_id = dbUser.id;
        req.session.username = dbUser.username;
        req.session.twitter = dbUser.twitter;
        req.session.github = dbUser.github;
        req.session.loggedIn = true;
    
        res.json(dbUser);
      });
    });
  });

  // login route
  router.post('/login', (req, res) => {
    User.findOne({
      where: {
        email: req.body.email
      }
    }).then(dbUser => {
      if (!dbUser) {
        res.status(400).json({ message: 'No user with that email address!' });
        return;
      }
  
      const validPassword = dbUser.checkPassword(req.body.password);
  
      if (!validPassword) {
        res.status(400).json({ message: 'Incorrect password!' });
        return;
      }
  
      req.session.save(() => {
        
        req.session.user_id = dbUser.id;
        req.session.username = dbUser.username;
        req.session.twitter = dbUser.twitter;
        req.session.github = dbUser.github;
        req.session.loggedIn = true;
  
        res.json({ user: dbUser, message: 'You are now logged in!' });
      });
    });
  });

 // logout a user
  router.post('/logout', (req, res) => {
    if (req.session.loggedIn) {
      req.session.destroy(() => {
        res.status(204).end();
      });
    }
    else {
      res.status(404).end();
    }
  });

// send modify the user
router.put('/:id', withAuth, (req, res) => {
    User.update(req.body, {
        individualHooks: true,
        where: {
            id: req.params.id
      }
    })
      .then(dbUser => {
        if (!dbUser[0]) {
          res.status(404).json({ message: 'No user found with this id' });
          return;
        }
        res.json(dbUser);
      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  });

// delete the users
router.delete('/:id', withAuth, (req, res) => {
    User.destroy({
      where: {
        id: req.params.id
      }
    })
      .then(dbUser => {
        if (!dbUser) {
          res.status(404).json({ message: 'No user found with this id' });
          return;
        }
        res.json(dbUser);
      })
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      });
  });

module.exports = router;