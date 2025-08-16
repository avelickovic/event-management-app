const express = require("express");
const {verifyToken} = require("../middleware/authMiddleware");
const categoriesModel = require("../models/categoriesModel");
const router = express.Router();

router.post('/',verifyToken,categoriesModel.createCategory);
router.get('/', categoriesModel.getAllCategories);
router.patch('/:id', verifyToken, categoriesModel.updateCategory);
router.delete('/:id', verifyToken, categoriesModel.deleteCategory);
router.get('/:id', categoriesModel.getCategoryById);
router.get('/getIdByName/:name', categoriesModel.getIdByName);
module.exports = router;