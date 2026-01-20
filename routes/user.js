const express = require('express');
const router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const assetHelpers = require('../helpers/asset-helpers')
const multer = require('multer');
const session = require('express-session');
const { verify } = require('crypto');

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/asset-images/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });



const verifyLogin = (req, res, next)=>{
    if(req.session.loggedIn){
        next()
    }else{
        res.redirect('/login')
    }
}

router.get('/', async (req, res)=>{


    let user = req.session.user
    let assets = await  assetHelpers.getAllAssets()
    

    if (user){
        res.render('user/homepage', {user, assets})
    }else{
        res.render('user/home', {assets})
    }
})


router.get('/signup', (req, res)=>{
    res.render('user/signup')
})

router.post('/signup', (req, res)=>{
    userHelpers.doSignup(req.body).then((response)=>{
        console.log(response.insertedId);
        req.session.loggedIn = true;
        req.session.user = req.body
        res.redirect('/')
    })
})

router.get('/login', (req, res)=>{
    res.render('user/login')
})
 
router.post('/login', (req, res)=>{
    userHelpers.doLogin(req.body).then((response)=>{
     if(response.status){
        req.session.loggedIn = true;
        req.session.user = response.user
        res.redirect('/')

     }
    })
})

router.get('/logout', (req, res)=>{
    req.session.destroy()
    res.redirect('/')
})

router.get('/add-asset', verifyLogin, (req, res)=>{
    res.render('user/add-asset', {user: req.session.user})
})

router.post('/add-asset', verifyLogin, upload.single('Image'), (req, res)=>{
assetHelpers.addAsset(req.body, req.session.user._id).then((id)=>{
    if (req.file){
         const fs  = require('fs');
            fs.renameSync(req.file.path, 'public/asset-images/' + id + '.jpg');
            console.log('File uploaded and renamed successfully');
}   
    res.redirect('/')

})
})

router.get('/product-details/:id', async(req,res)=>{
    let user =req.session.user
    let product  = await assetHelpers.getProductDetails(req.params.id)
    res.render('user/product-details', {user, product})
})


router.get('/rent-request/:id', verifyLogin, async(req, res)=>{
   assetHelpers.placeRequest(req.params.id, req.session.user._id).then((response)=>{
    res.render('user/rent-request-success', {user: req.session.user})
   })
})

router.get('/my-rentals', verifyLogin, async(req, res)=>{
    let rentals = await assetHelpers.getUserRentals(req.session.user._id)
    res.render('user/my-rentals', {user: req.session.user, rentals})
})


router.get('/owner-dashboard', verifyLogin, async(req, res)=>{
    let requests = await assetHelpers.getOwnerRequests(req.session.user._id)
    res.render('user/owner-dashboard', {user: req.session.user, requests})
})

router.get('/approve-request/:id', verifyLogin, async(req, res)=>{
   assetHelpers.updateRequestStatus(req.params.id, 'Approved').then(()=>{
    res.redirect('/owner-dashboard')
   })
})

router.get('/reject-request/:id', verifyLogin, async(req, res)=>{
   assetHelpers.updateRequestStatus(req.params.id, 'Rejected').then(()=>{
    res.redirect('/owner-dashboard')
   })
})









module.exports = router;




