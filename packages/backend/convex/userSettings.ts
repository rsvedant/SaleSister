import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { authComponent } from "./auth";
import { partialUserSettingsValidator, userSettingsValidator } from "./validators";

/**
 * Get user settings for the authenticated user
 */
export const get = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const settings = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.first();

		return settings;
	},
});

/**
 * Internal query to get user settings by userId (for use in actions)
 */
export const getInternal = internalQuery({
	args: { userId: v.string() },
	handler: async (ctx, args) => {
		const settings = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", args.userId))
			.first();

		return settings;
	},
});

/**
 * Create or update user settings (upsert)
 */
export const upsert = mutation({
	args: userSettingsValidator,
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		// Check if settings already exist
		const existing = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.first();

		if (existing) {
			// Update existing settings
			await ctx.db.patch(existing._id, args);
			return existing._id;
		} else {
			// Create new settings
			const settingsId = await ctx.db.insert("userSettings", {
				userId: userId,
				...args,
			});
			return settingsId;
		}
	},
});

/**
 * Update partial user settings
 */
export const update = mutation({
	args: partialUserSettingsValidator,
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const existing = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.first();

		if (!existing) {
			throw new Error("Settings not found. Create settings first.");
		}

		// Only update fields that are provided
		const updates: Record<string, any> = {};
		if (args.systemPrompt !== undefined) updates.systemPrompt = args.systemPrompt;
		if (args.salesScript !== undefined) updates.salesScript = args.salesScript;
		if (args.companyDocs !== undefined) updates.companyDocs = args.companyDocs;
		if (args.hubspotApiKey !== undefined) updates.hubspotApiKey = args.hubspotApiKey;
		if (args.hubspotEnabled !== undefined) updates.hubspotEnabled = args.hubspotEnabled;

		await ctx.db.patch(existing._id, updates);
		return existing._id;
	},
});

/**
 * Update HubSpot API key
 */
export const updateHubSpotKey = mutation({
	args: {
		hubspotApiKey: v.string(),
		hubspotEnabled: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const existing = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.first();

		if (!existing) {
			// Create settings with HubSpot key
			const settingsId = await ctx.db.insert("userSettings", {
				userId: userId,
				hubspotApiKey: args.hubspotApiKey,
				hubspotEnabled: args.hubspotEnabled ?? true,
			});
			return settingsId;
		}

		// Update existing settings
		await ctx.db.patch(existing._id, {
			hubspotApiKey: args.hubspotApiKey,
			...(args.hubspotEnabled !== undefined && {
				hubspotEnabled: args.hubspotEnabled,
			}),
		});
		return existing._id;
	},
});

/**
 * Update system prompt
 */
export const updateSystemPrompt = mutation({
	args: { systemPrompt: v.string() },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const existing = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.first();

		if (!existing) {
			throw new Error("Settings not found. Create settings first.");
		}

		await ctx.db.patch(existing._id, {
			systemPrompt: args.systemPrompt,
		});
		return existing._id;
	},
});

/**
 * Update sales script
 */
export const updateSalesScript = mutation({
	args: { salesScript: v.string() },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const existing = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.first();

		if (!existing) {
			throw new Error("Settings not found. Create settings first.");
		}

		await ctx.db.patch(existing._id, {
			salesScript: args.salesScript,
		});
		return existing._id;
	},
});

/**
 * Update company documentation
 */
export const updateCompanyDocs = mutation({
	args: { companyDocs: v.string() },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const existing = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.first();

		if (!existing) {
			throw new Error("Settings not found. Create settings first.");
		}

		await ctx.db.patch(existing._id, {
			companyDocs: args.companyDocs,
		});
		return existing._id;
	},
});

/**
 * Toggle HubSpot integration on/off
 */
export const toggleHubSpot = mutation({
	args: { enabled: v.boolean() },
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		const existing = await ctx.db
			.query("userSettings")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.first();

		if (!existing) {
			throw new Error("Settings not found. Create settings first.");
		}

		await ctx.db.patch(existing._id, {
			hubspotEnabled: args.enabled,
		});
		return existing._id;
	},
});
