import { Router, type IRouter } from "express";
import healthRouter from "./health";
import carpoolPostsRouter from "./carpoolPosts";
import rideRequestsRouter from "./rideRequests";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/carpool-posts", carpoolPostsRouter);
router.use("/ride-requests", rideRequestsRouter);
router.use("/stats", statsRouter);

export default router;
