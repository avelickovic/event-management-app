const express = require("express");
const {verifyAdmin,verifyToken} = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");
const userModel = require("../models/userModel");
const router = express.Router();
router.post('/createUser',verifyAdmin,userModel.createUser);
router.post('/login', userController.login );
router.get('/',verifyAdmin, userModel.getAllUsers);
router.patch('/update/:userId',verifyAdmin, userModel.updateUser);
router.post('/changeStatus',verifyAdmin, userModel.changeStatus);
router.get('/:userId', verifyToken, userModel.getUserById);
router.get('/getUserNameById/:userId',verifyToken, userModel.getUserNameById);


// Add other user-related routes here, e.g., registration, profile, etc.
module.exports = router;
