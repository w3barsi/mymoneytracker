import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

const noteValidator = v.object({
  _id: v.id("notes"),
  _creationTime: v.number(),
  ownerId: v.string(),
  title: v.string(),
  body: v.string(),
  updatedAt: v.number(),
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(noteValidator),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    return await ctx.db
      .query("notes")
      .withIndex("by_ownerId_and_updatedAt", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { noteId: v.string() },
  returns: v.union(noteValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const noteId = ctx.db.normalizeId("notes", args.noteId);

    if (!noteId) {
      return null;
    }

    const note = await ctx.db.get("notes", noteId);
    if (!note || note.ownerId !== user._id) {
      return null;
    }

    return note;
  },
});

export const create = mutation({
  args: {},
  returns: v.id("notes"),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);

    return await ctx.db.insert("notes", {
      ownerId: user._id,
      title: "",
      body: "",
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.string(),
    body: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const note = await ctx.db.get("notes", args.noteId);

    if (!note || note.ownerId !== user._id) {
      throw new ConvexError("Note not found");
    }

    await ctx.db.patch("notes", args.noteId, {
      title: args.title,
      body: args.body,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const remove = mutation({
  args: { noteId: v.id("notes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const note = await ctx.db.get("notes", args.noteId);

    if (!note || note.ownerId !== user._id) {
      throw new ConvexError("Note not found");
    }

    await ctx.db.delete("notes", args.noteId);
    return null;
  },
});
