const router = require("express").Router();
const userController = require("../controllers/user");
const authController = require("../controllers/auth");

router.get("/get-me", authController.protect, userController.getMe);
router.patch("/update-me", authController.protect, userController.updateMe);
router.get("/get-users", authController.protect, userController.getUsers);
router.get("/get-friends", authController.protect, userController.getFriends);
router.get("/get-requests", authController.protect, userController.getRequests);

module.exports = router;
