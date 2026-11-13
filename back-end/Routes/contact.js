import { getOwnerSupportNotifications, readOwnerSupportNotification } from '../Controllers/ownerSupportNotificationsController.js';
import { getSupportNotifications } from '../Controllers/supportNotificationsController.js';
import { ownSupportRequests, getSupportConversation, sendSupportMessage } from '../Controllers/supportConversationController.js';
import express from 'express';
import { authenticate, restrict } from '../auth/verifyToken.js';
import { createContactRequest } from '../Controllers/contactController.js';

import { listSupportRequests, getSupportRequest, readSupportRequest, updateSupportRequest } from '../Controllers/supportManagementController.js';

const router = express.Router();
router.post(
    '/',
    (req, res, next) => {
        if (!req.headers.authorization) return next();
        return authenticate(req, res, () => restrict(['patient', 'doctor', 'admin'])(req, res, next));
    },
    createContactRequest,
);
router.get('/', authenticate, restrict(['admin']), listSupportRequests);
router.get('/notifications', authenticate, restrict(['admin']), getSupportNotifications);
router.get('/mine', ownSupportRequests);
router.get('/my-notifications', getOwnerSupportNotifications);
router.post('/my-notifications/read', readOwnerSupportNotification);
router.get('/:id/conversation', getSupportConversation);
router.post('/:id/messages', sendSupportMessage);
router.get('/:id', authenticate, restrict(['admin']), getSupportRequest);
router.post('/:id/read', authenticate, restrict(['admin']), readSupportRequest);
router.patch('/:id', authenticate, restrict(['admin']), updateSupportRequest);
export default router;
