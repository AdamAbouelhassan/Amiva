/** technical_specification.md §5: "Dispatches via FCM." */
import * as functions from 'firebase-functions/v1';
import { FcmPushSender } from '../adapters/pushAdapter';
import { dispatchNotification } from '../lib/notificationDispatch';

export const sendNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    await dispatchNotification(new FcmPushSender(), {
      notificationId: context.params.notificationId,
      recipientId: data.recipientId,
      type: data.type,
      payload: data.payload ?? {},
    });
  });
