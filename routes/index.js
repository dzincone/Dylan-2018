const express = require('express');
const router = express.Router();
const crypto = require('crypto');


// Bcrypt settings
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Mongoose settings
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/bitpay');
const Schema = mongoose.Schema;
 
// Basic schema and model
const BitpaySchema = new Schema({
 password: String,
 publicKey: String,
});
const BitpayModel = mongoose.model('Bitpay', BitpaySchema);


// POST route, set or re-set password for user
router.post('/password', async (req, res, next) => {
  const { password } = req.body;
  try {
    let hashedPassword = await bcrypt.hash(password, saltRounds);
    let foundUser = await BitpayModel.findOne();

    // Update existing user with new password
    if (foundUser) {
      foundUser.password = hashedPassword;
      await foundUser.save();
    } else {
      // Create new user with new password
      let bitpay = new BitpayModel();
      bitpay.password = hashedPassword;
      await bitpay.save();
    }

    res.status(200).json({message: 'Successfully saved password'})
  } catch (err) {
    console.log(err);
    if (err) res.status(500).json({message: 'There was an issue saving your password'});
  }
});

router.post('/validate', async (req, res, next) => {
  const { password } = req.body;
  try {
    let foundUser = await BitpayModel.findOne();
    if (foundUser) {
      let hashPass = foundUser.password;
      let validated = await bcrypt.compare(password, hashPass);
      if (!validated) throw new Error();

      res.status(200).json(foundUser._id);
    }
  } catch (err) {

    if (err) res.status(400).json({message: "Unauthorized"});
  }
})

router.post('/publicKey', async (req, res, next) => {
  const { publicKey } = req.body;
  let _id = req.body._id.replace(/["']/g, "")
  try {
    let foundUser = await BitpayModel.findById(_id);
    if (foundUser) {
      foundUser.publicKey = publicKey;
      await foundUser.save();
    } else {
      throw new Error("You do not have access to change this user's publicKey");
    }
    res.status(200).json({message: 'You have successfully saved your public key'});
  } catch (err) {
    if(err) res.status(400).json({message: err});
  }
})

router.post('/message', async (req, res, next) => {
  const { message, privateKey } = req.body;
  try {
    let foundUser = await BitpayModel.findOne();
    if (foundUser) {
      const publicKey = foundUser.publicKey;

      const signer = crypto.createSign('sha256');
      signer.update(message);
      signer.end();
      const signature = signer.sign(privateKey);

      const verifier = crypto.createVerify('sha256');
      verifier.update(message);
      verifier.end();
      const verified = verifier.verify(publicKey, signature);

      if (verified) {
        res.status(200).json({message: "Verified message"});
      } else {
        throw new Error('You are not verified to sign this message');
      }
    }
  } catch (err) {
    console.log("Error here");
    console.log(err);
    res.status(400).json({message: 'You are not verified to sign this message'});
  }

})



module.exports = router;
