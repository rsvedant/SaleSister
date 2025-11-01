import { v } from "convex/values";
import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { authComponent } from "./auth";
import { actionableDataValidator } from "./validators";

/**
 * List all actionables for a specific call
 */
export const listByCall = query({
	args: { callId: v.id("calls") },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		// Verify the call belongs to the user
		const call = await ctx.db.get(args.callId);
		if (!call || call.userId !== userId) {
			throw new Error("Call not found or unauthorized");
		}

		const actionables = await ctx.db
			.query("actionables")
			.withIndex("by_callId", (q) => q.eq("callId", args.callId))
			.collect();

		return actionables;
	},
});

/**
 * List actionables for the authenticated user with optional filters
 */
export const listByUser = query({
	args: {
		status: v.optional(
			v.union(
				v.literal("pending"),
				v.literal("in_progress"),
				v.literal("completed"),
				v.literal("cancelled")
			)
		),
		type: v.optional(
			v.union(v.literal("task"), v.literal("follow_up"), v.literal("deal"))
		),
		crmSynced: v.optional(v.boolean()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		let results;

		// Apply filters based on provided arguments
		if (args.status) {
			results = await ctx.db
				.query("actionables")
				.withIndex("by_userId_and_status", (q) =>
					q.eq("userId", userId).eq("status", args.status!)
				)
				.collect();
		} else if (args.crmSynced !== undefined) {
			results = await ctx.db
				.query("actionables")
				.withIndex("by_userId_and_crmSynced", (q) =>
					q.eq("userId", userId).eq("crmSynced", args.crmSynced!)
				)
				.collect();
		} else {
			results = await ctx.db
				.query("actionables")
				.withIndex("by_userId", (q) => q.eq("userId", userId))
				.collect();
		}

		// Apply type filter if provided (can't use index for this)
		if (args.type) {
			results = results.filter((a) => a.type === args.type);
		}

		// Apply limit if provided
		if (args.limit) {
			results = results.slice(0, args.limit);
		}

		return results;
	},
});

/**
 * Get a single actionable by ID
 */
export const get = query({
	args: { actionableId: v.id("actionables") },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const actionable = await ctx.db.get(args.actionableId);

		if (!actionable) {
			throw new Error("Actionable not found");
		}

		// Verify the actionable belongs to the user
		if (actionable.userId !== userId) {
			throw new Error("Unauthorized");
		}

		return actionable;
	},
});

/**
 * Create a new actionable
 */
export const create = mutation({
	args: actionableDataValidator,
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		// Verify the call belongs to the user
		const call = await ctx.db.get(args.callId);
		if (!call || call.userId !== userId) {
			throw new Error("Call not found or unauthorized");
		}

		// Create the actionable
		const actionableId = await ctx.db.insert("actionables", {
			userId: userId,
			callId: args.callId,
			type: args.type,
			title: args.title,
			description: args.description,
			priority: args.priority,
			dueDate: args.dueDate,
			status: args.status,
			crmSynced: false, // Initially not synced
		});

		return actionableId;
	},
});

/**
 * Update actionable status
 */
export const updateStatus = mutation({
	args: {
		actionableId: v.id("actionables"),
		status: v.union(
			v.literal("pending"),
			v.literal("in_progress"),
			v.literal("completed"),
			v.literal("cancelled")
		),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const actionable = await ctx.db.get(args.actionableId);

		if (!actionable) {
			throw new Error("Actionable not found");
		}

		// Verify the actionable belongs to the user
		if (actionable.userId !== userId) {
			throw new Error("Unauthorized");
		}

		await ctx.db.patch(args.actionableId, {
			status: args.status,
		});

		return args.actionableId;
	},
});

/**
 * Update actionable details
 */
export const update = mutation({
	args: {
		actionableId: v.id("actionables"),
		title: v.optional(v.string()),
		description: v.optional(v.string()),
		priority: v.optional(
			v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
		),
		dueDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const actionable = await ctx.db.get(args.actionableId);

		if (!actionable) {
			throw new Error("Actionable not found");
		}

		// Verify the actionable belongs to the user
		if (actionable.userId !== userId) {
			throw new Error("Unauthorized");
		}

		// Build update object with only provided fields
		const updates: Record<string, any> = {};
		if (args.title !== undefined) updates.title = args.title;
		if (args.description !== undefined) updates.description = args.description;
		if (args.priority !== undefined) updates.priority = args.priority;
		if (args.dueDate !== undefined) updates.dueDate = args.dueDate;

		await ctx.db.patch(args.actionableId, updates);

		return args.actionableId;
	},
});

/**
 * Mark actionable as synced to CRM
 */
export const markSynced = mutation({
	args: {
		actionableId: v.id("actionables"),
		crmEntityId: v.string(),
		crmEntityType: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const actionable = await ctx.db.get(args.actionableId);

		if (!actionable) {
			throw new Error("Actionable not found");
		}

		// Verify the actionable belongs to the user
		if (actionable.userId !== userId) {
			throw new Error("Unauthorized");
		}

		await ctx.db.patch(args.actionableId, {
			crmSynced: true,
			crmEntityId: args.crmEntityId,
			crmEntityType: args.crmEntityType,
		});

		return args.actionableId;
	},
});

/**
 * Delete an actionable
 */
export const deleteActionable = mutation({
	args: { actionableId: v.id("actionables") },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const actionable = await ctx.db.get(args.actionableId);

		if (!actionable) {
			throw new Error("Actionable not found");
		}

		// Verify the actionable belongs to the user
		if (actionable.userId !== userId) {
			throw new Error("Unauthorized");
		}

		await ctx.db.delete(args.actionableId);

		return { success: true };
	},
});

/**
 * Get active actionables (pending or in_progress) for the user
 */
export const getActive = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const actionables = await ctx.db
			.query("actionables")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		// Filter for active statuses
		return actionables.filter(
			(a) => a.status === "pending" || a.status === "in_progress"
		);
	},
});

/**
 * Get unsynced actionables (for CRM sync queue)
 */
export const getUnsynced = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const actionables = await ctx.db
			.query("actionables")
			.withIndex("by_userId_and_crmSynced", (q) =>
				q.eq("userId", userId).eq("crmSynced", false)
			)
			.collect();

		return actionables;
	},
});

/**
 * Internal query to get an actionable by ID (for use in actions)
 */
export const getInternal = internalQuery({
	args: { actionableId: v.id("actionables") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.actionableId);
	},
});

/**
 * Internal mutation to mark actionable as synced (for use in actions)
 */
export const markSyncedInternal = internalMutation({
	args: {
		actionableId: v.id("actionables"),
		crmEntityId: v.string(),
		crmEntityType: v.string(),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.actionableId, {
			crmSynced: true,
			crmEntityId: args.crmEntityId,
			crmEntityType: args.crmEntityType,
		});

		return args.actionableId;
	},
});
