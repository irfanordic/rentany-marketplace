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

router.post('/add-asset', verifyLogin, (req, res) => {
    // 1. Add asset to DB
    assetHelpers.addAsset(req.body, req.session.user._id).then((id) => {
        
        // 2. Check if file exists (using express-fileupload style)
        if (req.files && req.files.Image) {
            let image = req.files.Image;
            
            // 3. Move the file
            image.mv('./public/asset-images/' + id + '.jpg', (err) => {
                if (!err) {
                    res.redirect('/');
                } else {
                    console.log("Image move error:", err);
                    res.redirect('/'); // Still redirect so the user isn't stuck
                }
            });
        } else {
            res.redirect('/');
        }
    }).catch((err) => {
        console.log("DB Error:", err);
        res.status(500).send("Database error");
    });
});

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


router.get('/edit-product/:id', verifyLogin, async(req, res)=>{
    let product = await assetHelpers.getProductDetails(req.params.id)
    res.render('user/edit-product', {user: req.session.user, product})
})


router.post('/edit-product/:id', verifyLogin, (req, res)=>{
   let productId = req.params.id; // Define the ID clearly
   
       assetHelpers.updateProduct(productId, req.body).then(() => {
           // 1. Handle the image update if a new one exists
           if (req.files && req.files.Image) {
               let image = req.files.Image;
               image.mv('./public/asset-images/' + productId + '.jpg', (err) => {
                   if (!err) {
                       res.redirect('/owner-dashboard');
                   } else {
                       console.log("Image upload error:", err);
                       res.redirect('/owner-dashboard');
                   }
               });
           } else {
               // 2. No new image, just redirect
               res.redirect('/owner-dashboard');
           }
       });
   });


   router.get('/delete-product/:id', verifyLogin, (req, res)=>{
    let productId = req.params.id
    assetHelpers.deleteProduct(productId, req.session.user._id).then(()=>{
        res.redirect('/owner-dashboard')
    })
   })


   router.get('/profile', verifyLogin, async(req, res)=>{
    let stats = await userHelpers.getUserDetails(req.session.user._id)
    res.render('user/profile', {user:req.session.user, stats})
   })

   router.get('/products', async(req, res)=>{
    let user  = req.session.user
    let products =  await assetHelpers.getAllAssets()
    res.render('user/products', {user, products})
   })

   router.get('/search', async(req, res)=>{
    let query = req.query.q
    let results = await assetHelpers.searchProducts(query)
    res.json(results)
   })







module.exports = router;




