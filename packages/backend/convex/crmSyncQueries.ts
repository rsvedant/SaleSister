import { v } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Query pending syncs for the user
 */
export const listPendingSyncs = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const pendingSyncs = await ctx.db
			.query("crmSyncStatus")
			.withIndex("by_userId_and_status", (q) =>
				q.eq("userId", userId).eq("syncStatus", "pending")
			)
			.collect();

		return pendingSyncs;
	},
});

/**
 * Query failed syncs for the user
 */
export const listFailedSyncs = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const failedSyncs = await ctx.db
			.query("crmSyncStatus")
			.withIndex("by_userId_and_status", (q) =>
				q.eq("userId", userId).eq("syncStatus", "failed")
			)
			.collect();

		return failedSyncs;
	},
});

/**
 * Internal query to get sync status
 */
export const getSyncStatusInternal = internalQuery({
	args: { syncId: v.id("crmSyncStatus") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.syncId);
	},
});

/**
 * Internal query to get all failed syncs
 */
export const getAllFailedSyncsInternal = internalQuery({
	args: {},
	handler: async (ctx) => {
		const failedSyncs = await ctx.db
			.query("crmSyncStatus")
			.filter((q) => q.eq(q.field("syncStatus"), "failed"))
			.collect();

		return failedSyncs;
	},
});

/**
 * Internal mutation to update sync status
 */
export const updateSyncStatusInternal = internalMutation({
	args: {
		userId: v.string(),
		entityType: v.union(
			v.literal("call"),
			v.literal("actionable"),
			v.literal("contact")
		),
		entityId: v.string(),
		crmEntityType: v.optional(v.string()),
		crmEntityId: v.optional(v.string()),
		syncStatus: v.union(
			v.literal("pending"),
			v.literal("syncing"),
			v.literal("completed"),
			v.literal("failed")
		),
		retryCount: v.number(),
		errorMessage: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Check if sync status record exists
		const existing = await ctx.db
			.query("crmSyncStatus")
			.withIndex("by_entityId", (q) => q.eq("entityId", args.entityId))
			.first();

		if (existing) {
			// Update existing record
			await ctx.db.patch(existing._id, {
				crmEntityType: args.crmEntityType,
				crmEntityId: args.crmEntityId,
				syncStatus: args.syncStatus,
				lastAttempt: Date.now(),
				retryCount: args.retryCount,
				errorMessage: args.errorMessage,
			});
		} else {
			// Create new record
			await ctx.db.insert("crmSyncStatus", {
				userId: args.userId,
				entityType: args.entityType,
				entityId: args.entityId,
				crmEntityType: args.crmEntityType,
				crmEntityId: args.crmEntityId,
				syncStatus: args.syncStatus,
				lastAttempt: Date.now(),
				retryCount: args.retryCount,
				errorMessage: args.errorMessage,
			});
		}
	},
});

/**
 * Internal mutation to increment retry count
 */
export const incrementRetryCount = internalMutation({
	args: { syncId: v.id("crmSyncStatus") },
	handler: async (ctx, args) => {
		const sync = await ctx.db.get(args.syncId);
		if (!sync) {
			throw new Error("Sync record not found");
		}

		await ctx.db.patch(args.syncId, {
			retryCount: sync.retryCount + 1,
			syncStatus: "pending",
		});
	},
});
