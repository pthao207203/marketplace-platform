import { Router } from "express";
import { requireClientAuth } from "../../middlewares/auth";
import { addToCart, viewCart } from "../../controllers/client/cart.controller";
import { getMyProfile, listAddresses, getAddress, createAddress, updateAddress, deleteAddress } from "../../controllers/client/user.controller";
import { listBanks, getBank, createBank, deleteBankByName, updateBankByName } from '../../controllers/client/user.controller';

const router = Router();

// Cart 
router.post('/cart', requireClientAuth, addToCart);
router.get('/cart', requireClientAuth, viewCart);

// Profile
router.get('/', requireClientAuth, getMyProfile);

// Addresses
router.get('/addresses', requireClientAuth, listAddresses);
router.get('/addresses/:id', requireClientAuth, getAddress);
router.post('/addresses', requireClientAuth, createAddress);
router.put('/addresses/:id', requireClientAuth, updateAddress);
router.delete('/addresses/:id', requireClientAuth, deleteAddress);

// Banks
router.get('/banks', requireClientAuth, listBanks);
router.get('/banks/:id', requireClientAuth, getBank);
router.post('/banks', requireClientAuth, createBank);
router.put('/banks/:name', requireClientAuth, updateBankByName);
router.delete('/banks/:name', requireClientAuth, deleteBankByName);

export default router;
