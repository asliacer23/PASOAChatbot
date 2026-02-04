# Close Chat Fix - Removes Closed Conversations from Student View

## Problem
When an admin closes a chat, the conversation was still visible to the student in their conversation list. This allowed students to:
- See the closed conversation in their chat list
- Potentially try to interact with it

## Solution
Modified the `fetchConversations()` function in the student chat hook to exclude closed conversations from the list.

## Changes Made

### File Modified
`src/features/chat/hooks/useChatMessages.ts` - Line 408-411

### What Changed
Added a filter to exclude closed conversations when fetching:

**Before:**
```typescript
const { data, error } = await supabase
  .from("conversations")
  .select("*")
  .eq("user_id", userId)
  .order("updated_at", { ascending: false });
```

**After:**
```typescript
const { data, error } = await supabase
  .from("conversations")
  .select("*")
  .eq("user_id", userId)
  .neq("status", "closed")  // ← Added this line
  .order("updated_at", { ascending: false });
```

## How It Works
- `.neq("status", "closed")` means "not equal to 'closed'"
- This filters out all conversations where `status = 'closed'`
- Students only see active conversations in their chat list
- Admin can still see and manage closed conversations in the admin panel

## Impact

### For Students
✅ Closed conversations no longer appear in their chat list
✅ They don't see conversations that admins have closed
✅ Cleaner chat interface with only active conversations

### For Admins
✅ No change - admins can still see closed conversations in admin panel
✅ Admins can reopen conversations if needed
✅ Full audit trail preserved (closed conversations are not deleted)

## Database Notes
- Conversations are **not deleted**, just marked with `status = 'closed'`
- All messages and history are preserved
- `closed_at` timestamp records when it was closed
- RLS policies already prevent students from accessing closed chats anyway

## Real-time Behavior
When an admin closes a chat:
1. The conversation status changes to 'closed'
2. The next time the student refreshes or their subscription updates, the conversation disappears
3. If they had the chat selected, it will auto-switch to another active conversation
4. The closed conversation is still in the database but hidden from the UI

## Testing Checklist
- [ ] Admin closes a conversation
- [ ] Student's chat list no longer shows that conversation
- [ ] Admin can still see and reopen the conversation
- [ ] Student can still access chat history (if they navigate to messages directly)
- [ ] Multiple conversations: Only closed ones are hidden
- [ ] Reopening a conversation: It reappears in student's list

## Backwards Compatibility
✅ Fully backwards compatible
✅ Existing closed conversations will be hidden
✅ No database migrations needed
✅ Works with existing RLS policies

## Security
- Students cannot send messages to closed conversations (already enforced by RLS)
- Students cannot view closed conversations in their list (now enforced by UI filter)
- Admins retain full access for management and auditing
