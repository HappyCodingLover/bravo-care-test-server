const { Router } = require('express')
const {
  fetchFacilities,
  fetchNurseOrder,
  fetchSpots,
  fetchNurses,
  fetchFacilitiesWithBestNurse,
} = require('./controller')

const router = Router()

router.get('/facilities', fetchFacilities)
router.post('/nurseOrders', fetchNurseOrder)
router.get('/spots', fetchSpots)
router.get('/nurses', fetchNurses)
router.get('/facilitiesWithBestNurse', fetchFacilitiesWithBestNurse)

module.exports = router
