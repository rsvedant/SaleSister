import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// User settings and configuration
	userSettings: defineTable({
		userId: v.string(),
		systemPrompt: v.optional(v.string()),
		salesScript: v.optional(v.string()),
		companyDocs: v.optional(v.string()),
		hubspotApiKey: v.optional(v.string()), // Plaintext for demo - encrypt post-hackathon
		hubspotEnabled: v.boolean(),
	}).index("by_userId", ["userId"]),

	// Call recordings and transcriptions
	calls: defineTable({
		userId: v.string(),
		title: v.string(),
		transcription: v.optional(v.string()),
		participants: v.optional(v.string()), // JSON string of participant objects
		duration: v.optional(v.number()), // Duration in seconds
		recordingUrl: v.optional(v.string()),
		processingStatus: v.union(
			v.literal("pending"),
			v.literal("processing"),
			v.literal("completed"),
			v.literal("failed")
		),
		metadata: v.optional(v.string()), // JSON string for extensible metadata
	})
		.index("by_userId", ["userId"])
		.index("by_userId_and_status", ["userId", "processingStatus"]),

	// Extracted actionables (tasks, follow-ups, deals)
	actionables: defineTable({
		userId: v.string(),
		callId: v.id("calls"),
		type: v.union(v.literal("task"), v.literal("follow_up"), v.literal("deal")),
		title: v.string(),
		description: v.optional(v.string()),
		priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
		dueDate: v.optional(v.number()), // Timestamp
		status: v.union(
			v.literal("pending"),
			v.literal("in_progress"),
			v.literal("completed"),
			v.literal("cancelled")
		),
		crmSynced: v.boolean(),
		crmEntityId: v.optional(v.string()), // HubSpot entity ID
		crmEntityType: v.optional(v.string()), // "task", "deal", "engagement"
	})
		.index("by_userId", ["userId"])
		.index("by_callId", ["callId"])
		.index("by_userId_and_status", ["userId", "status"])
		.index("by_userId_and_crmSynced", ["userId", "crmSynced"]),

	// CRM sync status tracking
	crmSyncStatus: defineTable({
		userId: v.string(),
		entityType: v.union(
			v.literal("call"),
			v.literal("actionable"),
			v.literal("contact")
		),
		entityId: v.string(), // ID of the entity being synced
		crmEntityType: v.optional(v.string()), // HubSpot entity type
		crmEntityId: v.optional(v.string()), // HubSpot entity ID
		syncStatus: v.union(
			v.literal("pending"),
			v.literal("syncing"),
			v.literal("completed"),
			v.literal("failed")
		),
		lastAttempt: v.optional(v.number()), // Timestamp
		retryCount: v.number(),
		errorMessage: v.optional(v.string()),
	})
		.index("by_entityId", ["entityId"])
		.index("by_userId_and_status", ["userId", "syncStatus"]),

	// Call insights from LLM analysis
	callInsights: defineTable({
		userId: v.string(),
		callId: v.id("calls"),
		sentiment: v.optional(
			v.union(v.literal("positive"), v.literal("neutral"), v.literal("negative"))
		),
		talkRatio: v.optional(v.number()), // 0-1 representing user talk percentage
		keyMoments: v.optional(v.string()), // JSON string of key moment objects
		topics: v.optional(v.string()), // JSON string of topics array
		dealLikelihood: v.optional(v.number()), // 0-100 score
		summary: v.optional(v.string()),
	}).index("by_callId", ["callId"]),
});
