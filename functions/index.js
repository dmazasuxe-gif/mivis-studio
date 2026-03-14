const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendBookingNotification = functions.firestore
    .document("bookings/{bookingId}")
    .onWrite(async (change, context) => {
        const newData = change.after.exists ? change.after.data() : null;
        const oldData = change.before.exists ? change.before.data() : null;

        if (!newData || !newData.professionalId) return null;

        const isNewAndConfirmed = !oldData && newData.status === 'confirmed';
        const wasJustConfirmed = oldData && oldData.status !== 'confirmed' && newData.status === 'confirmed';

        if (!isNewAndConfirmed && !wasJustConfirmed) return null;

        const workerDoc = await admin.firestore().collection("employees").doc(newData.professionalId).get();
        if (!workerDoc.exists || !workerDoc.data().fcmToken) return null;
        const fcmToken = workerDoc.data().fcmToken;

        // --- 🕒 DATE & TIME FORMATTING (Peru Timezone) ---
        const bookingDate = newData.date.toDate ? newData.date.toDate() : new Date(newData.date);
        
        // Format: 15/03/2026
        const dateLabel = bookingDate.toLocaleDateString('es-PE', {
            timeZone: 'America/Lima',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Format: 10.35pm
        const timeLabel = bookingDate.toLocaleTimeString('en-US', {
            timeZone: 'America/Lima',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).toLowerCase().replace(' ', '').replace(':', '.');

        const fullMsg = `${dateLabel} ${timeLabel}. cliente: ${newData.clientName} (${newData.service})`;

        const message = {
            notification: {
                title: "¡Nueva Cita! 🕒",
                body: fullMsg,
                clickAction: "/", // Compatibility for some Android browsers
            },
            data: {
                url: "/",
                bookingId: context.params.bookingId
            },
            token: fcmToken,
            android: {
                priority: "high",
                notification: { 
                    sound: "default",
                    tag: context.params.bookingId 
                }
            },
            apns: {
                headers: {
                    "apns-collapse-id": context.params.bookingId
                },
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
        } catch (error) {
            console.error("Error enviando FCM:", error);
        }
        return null;
    });
