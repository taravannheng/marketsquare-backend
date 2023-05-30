const express = require('express');
const router = express.Router();
const { createSlideshow, getSlideshow, getMultipleSlideshows, getSlideshows, updateSlideshow, deleteSlideshow } = require('../../controllers/slideshows/slideshow.controller');

router.get('/slideshows', getSlideshows);
router.get('/slideshows/batch', getMultipleSlideshows);
router.get('/slideshows/:slideshowID', getSlideshow);
router.post('/slideshows', createSlideshow);
router.put('/slideshows/:id', updateSlideshow);
router.delete('/slideshows/:id', deleteSlideshow);

module.exports = router;
