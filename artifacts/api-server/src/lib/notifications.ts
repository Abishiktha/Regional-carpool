import { db, notificationsTable } from "@workspace/db";

export type NotificationEvent =
  | "patient_approved"
  | "patient_rejected"
  | "driver_approved"
  | "driver_rejected"
  | "driver_assigned";

interface NotifyPatientApprovedArgs {
  patientId: number;
  fullName: string;
  phone: string;
  suburb: string;
}

interface NotifyPatientRejectedArgs {
  patientId: number;
  fullName: string;
  phone: string;
  rejectionReason: string;
}

interface NotifyDriverApprovedArgs {
  driverId: number;
  fullName: string;
  phone: string;
}

interface NotifyDriverRejectedArgs {
  driverId: number;
  fullName: string;
  phone: string;
  rejectionReason: string;
}

interface NotifyDriverAssignedArgs {
  patientId: number;
  patientName: string;
  patientPhone: string;
  driverName: string;
  tripDate: string;
  tripTime: string;
  destinationName: string;
  pickupAddress: string;
  pickupSuburb: string;
  returnTrip: boolean;
  returnTime: string | null;
}

export async function notifyPatientApproved(args: NotifyPatientApprovedArgs) {
  await db.insert(notificationsTable).values({
    recipientType: "patient",
    recipientId: args.patientId,
    recipientName: args.fullName,
    recipientPhone: args.phone,
    event: "patient_approved",
    subject: "Your medical transport registration has been approved",
    message: `Hi ${args.fullName},

Great news — your Regional Carpool medical transport registration has been approved!

You can now book transport to your medical appointments. Use your Patient ID #${args.patientId} when booking.

To book transport, visit the Medical Transport section and select "Book Medical Transport".

If you have any questions, please contact your regional coordinator.

Regional Carpool Medical Transport Team`,
  });
}

export async function notifyPatientRejected(args: NotifyPatientRejectedArgs) {
  await db.insert(notificationsTable).values({
    recipientType: "patient",
    recipientId: args.patientId,
    recipientName: args.fullName,
    recipientPhone: args.phone,
    event: "patient_rejected",
    subject: "Update on your medical transport registration",
    message: `Hi ${args.fullName},

We were unable to approve your Regional Carpool medical transport registration at this time.

Reason: ${args.rejectionReason}

If you believe this is an error, or once you have resolved the issue above, you are welcome to resubmit your registration.

Regional Carpool Medical Transport Team`,
  });
}

export async function notifyDriverApproved(args: NotifyDriverApprovedArgs) {
  await db.insert(notificationsTable).values({
    recipientType: "driver",
    recipientId: args.driverId,
    recipientName: args.fullName,
    recipientPhone: args.phone,
    event: "driver_approved",
    subject: "Your driver registration has been approved",
    message: `Hi ${args.fullName},

Welcome aboard! Your Regional Carpool medical transport driver registration has been approved.

You are now an active verified driver. A coordinator will contact you when you are matched to a transport request in your area.

Thank you for supporting elderly residents in regional Australia.

Regional Carpool Medical Transport Team`,
  });
}

export async function notifyDriverRejected(args: NotifyDriverRejectedArgs) {
  await db.insert(notificationsTable).values({
    recipientType: "driver",
    recipientId: args.driverId,
    recipientName: args.fullName,
    recipientPhone: args.phone,
    event: "driver_rejected",
    subject: "Update on your driver registration",
    message: `Hi ${args.fullName},

We were unable to approve your Regional Carpool driver registration at this time.

Reason: ${args.rejectionReason}

Once the issue has been resolved, you are welcome to resubmit your registration.

Regional Carpool Medical Transport Team`,
  });
}

export async function notifyDriverAssigned(args: NotifyDriverAssignedArgs) {
  const returnNote = args.returnTrip && args.returnTime
    ? `\nReturn pickup: approximately ${args.returnTime}`
    : "";

  await db.insert(notificationsTable).values({
    recipientType: "patient",
    recipientId: args.patientId,
    recipientName: args.patientName,
    recipientPhone: args.patientPhone,
    event: "driver_assigned",
    subject: "Your driver has been assigned for your medical transport",
    message: `Hi ${args.patientName},

A verified driver has been assigned to your upcoming medical transport.

Trip details:
  Date: ${args.tripDate}
  Pickup time: ${args.tripTime}
  Pickup address: ${args.pickupAddress}, ${args.pickupSuburb}
  Destination: ${args.destinationName}${returnNote}

Your driver: ${args.driverName}

Please be ready at your pickup address 5 minutes before your scheduled time. If you need to cancel or have any questions, contact your regional coordinator as soon as possible.

Regional Carpool Medical Transport Team`,
  });
}
