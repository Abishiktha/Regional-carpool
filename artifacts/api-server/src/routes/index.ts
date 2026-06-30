import { Router, type IRouter } from "express";
import healthRouter from "./health";
import carpoolPostsRouter from "./carpoolPosts";
import rideRequestsRouter from "./rideRequests";
import statsRouter from "./stats";
import medicalPatientsRouter from "./medicalPatients";
import medicalDriversRouter from "./medicalDrivers";
import medicalAppointmentsRouter from "./medicalAppointments";
import medicalTransportRouter from "./medicalTransport";
import notificationsRouter from "./notifications";
import verificationAuditLogRouter from "./verificationAuditLog";
import driverAvailabilityRouter from "./driverAvailability";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/carpool-posts", carpoolPostsRouter);
router.use("/ride-requests", rideRequestsRouter);
router.use("/stats", statsRouter);
router.use("/medical/patients", medicalPatientsRouter);
router.use("/medical/drivers", medicalDriversRouter);
router.use("/medical/appointments", medicalAppointmentsRouter);
router.use("/medical/transport-requests", medicalTransportRouter);
router.use("/notifications", notificationsRouter);
router.use("/medical/audit-log", verificationAuditLogRouter);
router.use("/medical/driver-availability", driverAvailabilityRouter);

export default router;
