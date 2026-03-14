const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendBookingNotification = functions.firestore
    .document("bookings/{bookingId}")
    .onCreate(async (snapshot, context) => {
        const booking = snapshot.data();
        const professionalId = booking.professionalId;

        if (!professionalId) return null;

        // 1. Get the worker's FCM token
        const workerDoc = await admin.firestore().collection("employees").doc(professionalId).get();
        if (!workerDoc.exists) return null;

        const workerData = workerDoc.data();
        const fcmToken = workerData.fcmToken;

        if (!fcmToken) {
            console.log(`No FCM token found for worker ${professionalId}`);
            return null;
        }

        // 2. Prepare the notification
        const bookingTime = booking.date.toDate ? booking.date.toDate() : new Date(booking.date);
        const timeStr = bookingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const message = {
            notification: {
                title: "¡Nueva Cita! 💅",
                body: `Tienes una cita a las ${timeStr} para: ${booking.service}`,
            },
            data: {
                url: "/",
            },
            token: fcmToken,
            android: {
                priority: "high",
                notification: {
                    sound: "default"
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        badge: 1,
                        contentAvailable: true
                    }
                }
            }
        };

        // 3. Send the notification
        try {
            const response = await admin.messaging().send(message);
            console.log("Successfully sent message:", response);
            return response;
        } catch (error) {
            console.error("Error sending message:", error);
            return null;
        }
    });

exports.onBookingUpdate = functions.firestore
    .document("bookings/{bookingId}")
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const oldData = change.before.data();

        // Only trigger if status changed to confirmed
        if (newData.status === 'confirmed' && oldData.status !== 'confirmed') {
            const professionalId = newData.professionalId;
            if (!professionalId) return null;

            const workerDoc = await admin.firestore().collection("employees").doc(professionalId).get();
            if (!workerDoc.exists) return null;

            const fcmToken = workerDoc.data().fcmToken;
            if (!fcmToken) return null;

            const bookingTime = newData.date.toDate ? newData.date.toDate() : new Date(newData.date);
            const timeStr = bookingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const message = {
                notification: {
                    title: "Cita Confirmada ✅",
                    body: `Nueva cita a las ${timeStr} para: ${newData.service}`,
                },
                token: fcmToken,
                apns: { payload: { aps: { sound: "default", contentAvailable: true } } }
            };

            return admin.messaging().send(message);
        }
        return null;
    });
