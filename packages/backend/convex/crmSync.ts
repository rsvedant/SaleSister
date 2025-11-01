"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent } from "./auth";
import { Client } from "@hubspot/api-client";
import type { Id } from "./_generated/dataModel";

/**
 * Sync a call to HubSpot as an engagement (note/call)
 */
export const syncCallToHubSpot = action({
	args: {
		callId: v.id("calls"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		try {
			// Get user settings
			const settings = await ctx.runQuery(internal.userSettings.getInternal, {
				userId,
			});
			if (!settings?.hubspotApiKey || !settings.hubspotEnabled) {
				throw new Error("HubSpot integration not configured");
			}

			// Get call data
			const call = await ctx.runQuery(internal.calls.getInternal, { callId: args.callId });
			if (!call) {
				throw new Error("Call not found");
			}

			// Initialize HubSpot client
			const hubspotClient = new Client({ accessToken: settings.hubspotApiKey });

			// Create engagement in HubSpot
			const engagementData = {
				properties: {
					hs_timestamp: new Date(call._creationTime).toISOString(),
					hs_note_body: `${call.title}\n\n${call.transcription || ""}`,
				},
				associations: [],
			};

			// Create the note engagement
			const response = await hubspotClient.crm.objects.notes.basicApi.create(
				engagementData
			);

			// Update sync status
			await ctx.runMutation(internal.crmSyncQueries.updateSyncStatusInternal, {
				userId,
				entityType: "call",
				entityId: args.callId,
				crmEntityType: "note",
				crmEntityId: response.id,
				syncStatus: "completed",
				retryCount: 0,
			});

			return {
				success: true,
				crmEntityId: response.id,
			};
		} catch (error: any) {
			// Log error and update sync status
			await ctx.runMutation(internal.crmSyncQueries.updateSyncStatusInternal, {
				userId,
				entityType: "call",
				entityId: args.callId,
				syncStatus: "failed",
				retryCount: 0,
				errorMessage: error.message || "Unknown error",
			});

			throw error;
		}
	},
});

/**
 * Sync an actionable to HubSpot (as task or deal)
 */
export const syncActionableToHubSpot = action({
	args: {
		actionableId: v.id("actionables"),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		try {
			// Get user settings
			const settings = await ctx.runQuery(internal.userSettings.getInternal, {
				userId,
			});
			if (!settings?.hubspotApiKey || !settings.hubspotEnabled) {
				throw new Error("HubSpot integration not configured");
			}

			// Get actionable data
			const actionable = await ctx.runQuery(internal.actionables.getInternal, {
				actionableId: args.actionableId,
			});
			if (!actionable) {
				throw new Error("Actionable not found");
			}

			// Initialize HubSpot client
			const hubspotClient = new Client({ accessToken: settings.hubspotApiKey });

			let crmEntityId: string;
			let crmEntityType: string;

			if (actionable.type === "deal") {
				// Create as a deal
				const properties: Record<string, string> = {
					dealname: actionable.title,
					amount: "0", // Default value, can be updated later
					dealstage: "appointmentscheduled",
					pipeline: "default",
				};

				if (actionable.dueDate) {
					properties.closedate = new Date(actionable.dueDate).toISOString().split("T")[0];
				}

				const dealData = {
					properties,
					associations: [],
				};

				const response = await hubspotClient.crm.deals.basicApi.create(dealData);
				crmEntityId = response.id;
				crmEntityType = "deal";
			} else {
				// Create as a task
				const taskData = {
					properties: {
						hs_task_subject: actionable.title,
						hs_task_body: actionable.description || "",
						hs_task_status: actionable.status === "completed" ? "COMPLETED" : "NOT_STARTED",
						hs_task_priority:
							actionable.priority === "high"
								? "HIGH"
								: actionable.priority === "medium"
								? "MEDIUM"
								: "LOW",
						hs_timestamp: actionable.dueDate
							? new Date(actionable.dueDate).toISOString()
							: new Date().toISOString(),
					},
					associations: [],
				};

				const response = await hubspotClient.crm.objects.tasks.basicApi.create(
					taskData
				);
				crmEntityId = response.id;
				crmEntityType = "task";
			}

			// Mark actionable as synced
			await ctx.runMutation(internal.actionables.markSyncedInternal, {
				actionableId: args.actionableId,
				crmEntityId,
				crmEntityType,
			});

			// Update sync status
			await ctx.runMutation(internal.crmSyncQueries.updateSyncStatusInternal, {
				userId,
				entityType: "actionable",
				entityId: args.actionableId,
				crmEntityType,
				crmEntityId,
				syncStatus: "completed",
				retryCount: 0,
			});

			return {
				success: true,
				crmEntityId,
				crmEntityType,
			};
		} catch (error: any) {
			// Log error and update sync status
			await ctx.runMutation(internal.crmSyncQueries.updateSyncStatusInternal, {
				userId,
				entityType: "actionable",
				entityId: args.actionableId,
				syncStatus: "failed",
				retryCount: 0,
				errorMessage: error.message || "Unknown error",
			});

			throw error;
		}
	},
});

/**
 * Internal action to retry a failed sync
 */
export const retryFailedSyncInternal = internalAction({
	args: {
		syncId: v.id("crmSyncStatus"),
	},
	handler: async (ctx, args) => {
		// Get sync record
		const sync = await ctx.runQuery(internal.crmSyncQueries.getSyncStatusInternal, {
			syncId: args.syncId,
		});

		if (!sync) {
			return { success: false, error: "Sync record not found" };
		}

		// Check if we've exceeded max retries
		if (sync.retryCount >= 3) {
			return { success: false, error: "Max retries exceeded" };
		}

		// Calculate backoff: 5min, 15min, 45min
		const backoffMinutes = [5, 15, 45];
		const backoffMs = (backoffMinutes[sync.retryCount] || 45) * 60 * 1000;
		const timeSinceLastAttempt = Date.now() - (sync.lastAttempt || 0);

		// Check if enough time has passed
		if (timeSinceLastAttempt < backoffMs) {
			return { success: false, error: "Backoff period not elapsed" };
		}

		// Increment retry count
		await ctx.runMutation(internal.crmSyncQueries.incrementRetryCount, {
			syncId: args.syncId,
		});

		// Retry the sync based on entity type
		try {
			if (sync.entityType === "call") {
				await ctx.runAction(internal.crmSync.syncCallToHubSpot, {
					callId: sync.entityId as Id<"calls">,
				});
			} else if (sync.entityType === "actionable") {
				await ctx.runAction(internal.crmSync.syncActionableToHubSpot, {
					actionableId: sync.entityId as Id<"actionables">,
				});
			}

			return { success: true };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	},
});

/**
 * Process all failed syncs (called by cron)
 */
export const processFailedSyncsInternal = internalAction({
	args: {},
	handler: async (ctx) => {
		// Get all failed syncs
		const failedSyncs = await ctx.runQuery(internal.crmSyncQueries.getAllFailedSyncsInternal);

		let processedCount = 0;
		let successCount = 0;

		for (const sync of failedSyncs) {
			// Skip if max retries exceeded
			if (sync.retryCount >= 3) {
				continue;
			}

			// Try to retry this sync
			const result = await ctx.runAction(internal.crmSync.retryFailedSyncInternal, {
				syncId: sync._id,
			});

			processedCount++;
			if (result.success) {
				successCount++;
			}
		}

		return {
			processedCount,
			successCount,
			failedCount: processedCount - successCount,
		};
	},
});

/**
 * Manual retry for a specific sync
 */
export const retrySyncManually = action({
	args: { syncId: v.id("crmSyncStatus") },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		// Verify the sync belongs to the user
		const sync = await ctx.runQuery(internal.crmSyncQueries.getSyncStatusInternal, {
			syncId: args.syncId,
		});

		if (!sync || sync.userId !== userId) {
			throw new Error("Sync not found or unauthorized");
		}

		// Retry the sync
		return await ctx.runAction(internal.crmSync.retryFailedSyncInternal, {
			syncId: args.syncId,
		});
	},
});
