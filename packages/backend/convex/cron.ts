import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Cron jobs configuration for SaleSister
 *
 * This file defines scheduled tasks that run automatically in the background
 */

const crons = cronJobs();

/**
 * Retry failed CRM syncs every 5 minutes
 *
 * This job processes failed HubSpot sync operations and retries them
 * with exponential backoff (5min → 15min → 45min)
 */
crons.interval(
	"retry-failed-syncs",
	{ minutes: 5 },
	internal.crmSync.processFailedSyncsInternal
);

export default crons;
