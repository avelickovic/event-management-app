const express = require("express");
const {verifyToken} = require("../middleware/authMiddleware");
const categoriesModel = require("../models/categoriesModel");
const router = express.Router();

router.post('/createCategory',verifyToken,categoriesModel.createCategory);
router.get('/', verifyToken, categoriesModel.getAllCategories);
router.patch('/:id', verifyToken, categoriesModel.updateCategory);
router.delete('/:id', verifyToken, categoriesModel.deleteCategory);
router.get('/:id', verifyToken, categoriesModel.getCategoryById);
module.exports = router;