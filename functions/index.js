const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendBookingNotification = functions.firestore
    .document("bookings/{bookingId}")
    .onWrite(async (change, context) => {
        const newData = change.after.exists ? change.after.data() : null;
        const oldData = change.before.exists ? change.before.data() : null;

        // 1. Exit if deleted or no professional assigned
        if (!newData || !newData.professionalId) return null;

        // 2. Logic: Only notify if it's NEW and CONFIRMED, OR if it CHANGED from pending to confirmed
        const isNewAndConfirmed = !oldData && newData.status === 'confirmed';
        const wasJustConfirmed = oldData && oldData.status !== 'confirmed' && newData.status === 'confirmed';

        // 3. Prevent self-triggering or multiple triggers
        if (!isNewAndConfirmed && !wasJustConfirmed) return null;

        // 4. Get Worker Token
        const workerDoc = await admin.firestore().collection("employees").doc(newData.professionalId).get();
        if (!workerDoc.exists || !workerDoc.data().fcmToken) {
            console.log(`No se encontró token para el trabajador ${newData.professionalId}`);
            return null;
        }
        const fcmToken = workerDoc.data().fcmToken;

        // 5. Format Date & Time
        const bookingTime = newData.date.toDate ? newData.date.toDate() : new Date(newData.date);
        const day = bookingTime.getDate().toString().padStart(2, '0');
        const month = (bookingTime.getMonth() + 1).toString().padStart(2, '0');
        const year = bookingTime.getFullYear();
        const hour = bookingTime.getHours();
        const ampm = hour >= 12 ? 'pm' : 'am';
        
        const dateStr = `${day}/${month}/${year} ${ampm}`;

        // 6. Construct Message
        const message = {
            notification: {
                title: "¡Nueva Cita! 🕒",
                body: `${dateStr}. cliente: ${newData.clientName} (${newData.service})`,
            },
            data: {
                url: "/",
                bookingId: context.params.bookingId
            },
            token: fcmToken,
            android: {
                priority: "high",
                notification: { sound: "default" }
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

        try {
            await admin.messaging().send(message);
            console.log(`Notificación enviada a ${newData.professionalId} para la cita ${context.params.bookingId}`);
        } catch (error) {
            console.error("Error enviando FCM:", error);
        }
        return null;
    });

// Removed redundant onBookingUpdate
