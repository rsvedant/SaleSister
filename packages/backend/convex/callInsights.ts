import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { callInsightsValidator } from "./validators";

/**
 * Get insights for a specific call
 */
export const getByCall = query({
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

		// Get insights for this call
		const insights = await ctx.db
			.query("callInsights")
			.withIndex("by_callId", (q) => q.eq("callId", args.callId))
			.first();

		return insights;
	},
});

/**
 * Create or update call insights (LLM analysis results)
 */
export const create = mutation({
	args: callInsightsValidator,
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

		// Check if insights already exist for this call
		const existing = await ctx.db
			.query("callInsights")
			.withIndex("by_callId", (q) => q.eq("callId", args.callId))
			.first();

		if (existing) {
			// Update existing insights
			await ctx.db.patch(existing._id, {
				sentiment: args.sentiment,
				talkRatio: args.talkRatio,
				keyMoments: args.keyMoments, // JSON string
				topics: args.topics, // JSON string
				dealLikelihood: args.dealLikelihood,
				summary: args.summary,
			});
			return existing._id;
		} else {
			// Create new insights
			const insightsId = await ctx.db.insert("callInsights", {
				userId: userId,
				callId: args.callId,
				sentiment: args.sentiment,
				talkRatio: args.talkRatio,
				keyMoments: args.keyMoments, // JSON string
				topics: args.topics, // JSON string
				dealLikelihood: args.dealLikelihood,
				summary: args.summary,
			});
			return insightsId;
		}
	},
});

/**
 * Update specific insight fields
 */
export const update = mutation({
	args: {
		callId: v.id("calls"),
		sentiment: v.optional(
			v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative"))
		),
		talkRatio: v.optional(v.number()),
		keyMoments: v.optional(v.string()), // JSON string
		topics: v.optional(v.string()), // JSON string
		dealLikelihood: v.optional(v.number()),
		summary: v.optional(v.string()),
	},
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

		// Find existing insights
		const existing = await ctx.db
			.query("callInsights")
			.withIndex("by_callId", (q) => q.eq("callId", args.callId))
			.first();

		if (!existing) {
			throw new Error("Insights not found for this call");
		}

		// Build update object with only provided fields
		const updates: Record<string, any> = {};
		if (args.sentiment !== undefined) updates.sentiment = args.sentiment;
		if (args.talkRatio !== undefined) updates.talkRatio = args.talkRatio;
		if (args.keyMoments !== undefined) updates.keyMoments = args.keyMoments;
		if (args.topics !== undefined) updates.topics = args.topics;
		if (args.dealLikelihood !== undefined) updates.dealLikelihood = args.dealLikelihood;
		if (args.summary !== undefined) updates.summary = args.summary;

		await ctx.db.patch(existing._id, updates);

		return existing._id;
	},
});

/**
 * Delete insights for a call
 */
export const deleteInsights = mutation({
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

		// Find and delete insights
		const insights = await ctx.db
			.query("callInsights")
			.withIndex("by_callId", (q) => q.eq("callId", args.callId))
			.first();

		if (insights) {
			await ctx.db.delete(insights._id);
		}

		return { success: true };
	},
});

/**
 * Get all insights for the authenticated user
 */
export const listAll = query({
	args: {
		sentiment: v.optional(
			v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative"))
		),
		minDealLikelihood: v.optional(v.number()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		// Get all calls for this user first
		const calls = await ctx.db
			.query("calls")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		const callIds = calls.map((c) => c._id);

		// Get all insights
		let insights = await ctx.db.query("callInsights").collect();

		// Filter to only insights for user's calls
		insights = insights.filter((insight) => callIds.includes(insight.callId));

		// Apply sentiment filter if provided
		if (args.sentiment) {
			insights = insights.filter((i) => i.sentiment === args.sentiment);
		}

		// Apply deal likelihood filter if provided
		if (args.minDealLikelihood !== undefined) {
			insights = insights.filter(
				(i) => i.dealLikelihood !== undefined && i.dealLikelihood >= args.minDealLikelihood!
			);
		}

		// Apply limit if provided
		if (args.limit) {
			insights = insights.slice(0, args.limit);
		}

		return insights;
	},
});

/**
 * Get insights summary statistics for the user
 */
export const getStats = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user?.userId) {
			throw new Error("Unauthorized");
		}

		const userId = user.userId;

		// Get all calls for this user
		const calls = await ctx.db
			.query("calls")
			.withIndex("by_userId", (q) => q.eq("userId", userId))
			.collect();

		const callIds = calls.map((c) => c._id);

		// Get all insights
		let insights = await ctx.db.query("callInsights").collect();

		// Filter to only insights for user's calls
		insights = insights.filter((insight) => callIds.includes(insight.callId));

		// Calculate statistics
		const totalInsights = insights.length;
		const positiveSentiment = insights.filter((i) => i.sentiment === "positive").length;
		const negativeSentiment = insights.filter((i) => i.sentiment === "negative").length;
		const neutralSentiment = insights.filter((i) => i.sentiment === "neutral").length;

		const avgDealLikelihood =
			insights.filter((i) => i.dealLikelihood !== undefined).length > 0
				? insights
						.filter((i) => i.dealLikelihood !== undefined)
						.reduce((sum, i) => sum + (i.dealLikelihood ?? 0), 0) /
				  insights.filter((i) => i.dealLikelihood !== undefined).length
				: 0;

		const avgTalkRatio =
			insights.filter((i) => i.talkRatio !== undefined).length > 0
				? insights
						.filter((i) => i.talkRatio !== undefined)
						.reduce((sum, i) => sum + (i.talkRatio ?? 0), 0) /
				  insights.filter((i) => i.talkRatio !== undefined).length
				: 0;

		return {
			totalInsights,
			sentimentBreakdown: {
				positive: positiveSentiment,
				negative: negativeSentiment,
				neutral: neutralSentiment,
			},
			avgDealLikelihood,
			avgTalkRatio,
		};
	},
});
